#!/usr/bin/python3
import struct
import sys
import logging
import traceback
import threading
import asyncio
import json
import time
import queue
import requests
import psutil
import subprocess
import os
from backend_api_handler import kcpp_api


#logging
logging.basicConfig(filename='native_messaging.log',  encoding='utf-8',level=logging.INFO, 
                    format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

ai = kcpp_api()
global_data = None
webpage_content = ""
q = queue.Queue()
abort_flag_q = queue.Queue()
abort = False
abort_flag_q.put(abort)


# On Windows, the default I/O mode is O_TEXT. Set this to O_BINARY
# to avoid unwanted modifications of the input/output streams.
if sys.platform == "win32":
  import msvcrt
  msvcrt.setmode(sys.stdin.fileno(), os.O_BINARY)
  msvcrt.setmode(sys.stdout.fileno(), os.O_BINARY)


def get_script_dir():
    if getattr(sys, 'frozen', False):
        # Running as compiled exe
        return os.path.dirname(sys.executable)
    else:
        # Running as script
        return os.path.dirname(os.path.abspath(__file__))

def is_process_running(process_names):
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            if proc.info['name'] in process_names:
                return True
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
    return False

def find_kcpp_executable():
    script_dir = get_script_dir()
    executables = ["koboldcpp_nocuda.exe", "koboldcpp.exe"]
    
    for exe in executables:
        path = os.path.join(script_dir, exe)
        if os.path.isfile(path):
            return path
    
    # If not found in script directory, check parent directory
    parent_dir = os.path.dirname(script_dir)
    for exe in executables:
        path = os.path.join(parent_dir, exe)
        if os.path.isfile(path):
            return path
    
    return None

def run_kcpp():
    try:
        process_names = ["koboldcpp_nocuda.exe", "koboldcpp.exe"]
        process_status = is_process_running(process_names)
        logging.info(f"Is kcpp running? {process_status}")
       
        if not process_status:
            kcpp_path = find_kcpp_executable()            
            if kcpp_path:
                logging.info(f"kcpp path: {kcpp_path}")
                command = [kcpp_path, "no-webui.kcpps", "--showgui"]                
                subprocess.Popen(command,
                                 creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0)
            else:
                logging.error("KCPP executable not found in the script directory or its parent.")
        else:
            logging.info("KCPP executable is already running!")
    except Exception as e:
        logging.error(f"Error in kcpp: {str(e)}")
run_kcpp()


# Helper function that sends a message to the webapp.
def send_message(message):
  # Write message size.
  sys.stdout.buffer.write(struct.pack('I', len(message)))
  # Write the message itself.
  sys.stdout.write(message)
  sys.stdout.flush()

  
# Function that reads messages from the webapp.
def read_messages(): 
  global abort,global_data,webpage_content

  # received string looks like this:
  # '{"data":{"status":"new_chat","text":"hi"}}'
  try:    
    logging.info('Input: "read_message func active"')
    while True:
      abort=False
      # Read the message length (first 4 bytes).
      text_length_bytes = sys.stdin.buffer.read(4)
      if len(text_length_bytes) == 0:
        sys.exit(0)

      # Unpack message length as 4 byte integer.
      text_length = struct.unpack('@I', text_length_bytes)[0]

      # Read the text (JSON object) of the message.
      text = sys.stdin.buffer.read(text_length).decode('utf-8')
      logging.info(f"received data from extension: {text}")      
          
      #abort generation
      try:
          jsondata = text   
          jsondata = json.loads(text)

          if jsondata["data"]["status"] == "abort":              
                    abort = True
                    abort_flag_q.put(abort)
                    abortrequest = requests.post("http://127.0.0.1:5001/api/extra/abort")      
                    if abortrequest.status_code == 200:
                        logging.info("Abort request successful.")
                    else:
                        logging.error(f"Abort request failed: {abortrequest.status_code}")   

          if jsondata != None:
                  if jsondata["data"]["task"] == "summary":
                    webpage_content = jsondata["data"]["text"]
                  elif jsondata["data"]["task"] == "ping":
                      process_names = ["koboldcpp_nocuda.exe", "koboldcpp.exe"]
                      p_value = is_process_running(process_names)
                      if p_value == True:
                        logging.info("sent pong msg")
                        send_message(json.dumps({"ping":"pong"}))
                      else:
                          logging.info("koboldcpp doesnt seem to be running, trying to relaunch")
                          send_message(json.dumps({"error":"relaunching kcpp exe"}))
                          run_kcpp()

                      continue   

      except Exception as e:
        logging.error(f"Error during abort: {str(e)}")

      if text and abort == False:
        # Start call_handle_message in a separate thread to keep reading continuously
        thread = threading.Thread(target=call_handle_message, args=(text,))
        thread.start()
        
      # Send an echo message back.
      # send_message(json.dumps({"echo message from native host": text}))

  except Exception as e:
            logging.error(f"Error in read_messages: {str(e)}")
    
     
def call_handle_message(prompt):
    logging.info("***********call_handle_message func IS ACTIVE*********")
    global webpage_content

     # Check if the prompt contains a non-empty string
    if not prompt or not isinstance(prompt, str) or prompt.strip() == "":
        logging.error("Error: The prompt is empty or not a valid string.")
        return

    try:                                    
        textobj = ai.handle_message(prompt,q,abort_flag_q,webpage_content)
        text = textobj[0]['text']
        logging.info("returned data")  
        logging.info(text)   
        send_message(json.dumps({"ai_response": text}))
        send_message(json.dumps({"ai_response":"^^^stop^^^"}))
    except Exception as e:
        logging.error(f"Error in call_handle_message: {str(e)}")

    return    


# send individuals chunks to the extension
def send_chunks():
    while True:  
        try:
            while not q.empty():
                chunk = q.get()
                # logging.info(f"*****HOST received data from backend*****: {chunk}")
                send_message(json.dumps({"ai_response_chunk": chunk}))
            time.sleep(0.2)  
        except Exception as e:
            logging.error(f"Error in send_chunks: {str(e)}")
     

def Main():
    try:        
        # handle_thread = threading.Thread(target=call_handle_message)

        send_chunks_thread = threading.Thread(target=send_chunks)
        # handle_thread.daemon = True
        send_chunks_thread.daemon = True
        # handle_thread.start()
        send_chunks_thread.start()
        read_messages()
        logging.info("Exiting Main")
    except Exception as e:
        logging.error(f"Error in Main: {str(e)}")
        logging.error(traceback.format_exc())        
       

if __name__ == '__main__':
  Main()
  