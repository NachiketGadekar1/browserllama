import requests
import re
import time
import threading
import logging
import os
import json
import queue
from langchain.text_splitter import RecursiveCharacterTextSplitter


stop_event = threading.Event()

logging.basicConfig(filename='kcpp_api.log',  encoding='utf-8', level=logging.INFO, format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
logging.info("kcpp_api module imported")

class kcpp_api:        
    def __init__(self):
        self.ENDPOINT = "http://127.0.0.1:5001"
        self.username = "User"
        self.botname = "Assistant"
        self.file_path = 'conv_history.txt'
        self.delete_history_file()
        self.conversation_history = ""
        self.load_conversation_history()
        self.conversation_history = self.read_conversation_history()
                
    def delete_history_file(self):
        if os.path.exists(self.file_path):
            os.remove(self.file_path)    
            # logging.info(f"Deleted previous conversation history: {self.file_path}")
            
    def clear_conversation_history(self):
        # Clear the in-memory conversation history
        self.conversation_history = ""
        # Clear the contents of the file
        open(self.file_path, 'w').close()        
        # logging.info(f"Cleared conversation history file: {self.file_path}")        

    def load_conversation_history(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as file:
                self.conversation_history = file.read()

    def read_conversation_history(self, file_path=None):
        if file_path is None:
            file_path = self.file_path

        try:
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as file:
                    content = file.read()
                # logging.info(f"Successfully read conversation history from {file_path}")
                # logging.info(f"history is {content}")
                return content
            else:
                # logging.info(f"No conversation history file found at {file_path}")
                return ""
        except IOError as e:
            logging.error(f"Error reading file {file_path}: {str(e)}")
            return ""
            
    def text_chunker(self,text):
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size = 3000,
            chunk_overlap  = 50,
            length_function = len,
        )
        texts = text_splitter.split_text(text)
        # logging.info(f"--------text chunks -----: {texts}") 
        return texts
    
    @staticmethod
    def split_text(text):
        parts = re.split(r'\n[a-zA-Z]', text)
        return parts

    def get_prompt(self, text):  
        try:
            mcl = requests.get(f"{self.ENDPOINT}/api/extra/true_max_context_length")  
            value = mcl.json()['value']         
        except (requests.RequestException, ValueError):
            mcl = 4096
            logging.error('requests.get(f"{self.ENDPOINT}/api/extra/true_max_context_length") failed') 
             
        return {
            # "prompt": self.conversation_history +f"{self.username}: {text}\n{self.botname}:",
            "prompt": self.conversation_history + f"### Instruction:\n{text}\n### Response:\n",
            "use_story": False,
            "use_memory": True,
            "use_authors_note": False,
            "use_world_info": False,
            "max_context_length": value,
            "max_length": 300,
            "rep_pen": 1.3,
            "rep_pen_range": 4096,
            "rep_pen_slope": 0.7,
            "temperature": 0.70,
            "tfs": 0.97,
            "top_a": 0.8,
            "top_k": 100,
            "top_p": 0.92,
            "typical": 1,
            "sampler_order": [6, 0, 1, 3, 4, 2, 5],
            "singleline": False,
            "frmttriminc": False,
            "frmtrmblln": False
        }

    def handle_message(self, user_message, q, abort_flag_q, webpage_content):       
        try:       
            logging.info('output: " backend module is ACTIVE"')
            # turn string to object
            user_message = json.loads(user_message)
            # logging.info(f"user_message bah: {user_message}")
            
            # Check if it's a new chat
            if user_message["data"].get("status") == "new_chat":
                # logging.info("New chat detected. Clearing conversation history.")
                self.clear_conversation_history()
        
            only_text = user_message["data"]["text"]
            prompt = self.get_prompt(only_text)
                
            if user_message["data"]["status"] == "abort":
                logging.info("abort detected in status")  
                
            if user_message["data"]["task"] == "summary-chat":
                # logging.info("summary_chat_prompt detected") 
                summary_chat_prompt = user_message["data"]["text"] 
                summary_chat_prompt = self.get_prompt(summary_chat_prompt)

            stop_event = threading.Event()
            previous_text = ""
            
            def get_request():
                nonlocal previous_text
                received_so_far = ""
                i=0
                x= "empty"            
                try:
                    while not stop_event.is_set():                        
                        response = requests.get(f"{self.ENDPOINT}/api/extra/generate/check")
                        if response.status_code == 200:
                            response_data = response.json()
                            if i==0:
                                text = response_data['results'][0]['text']                
                                i=i+1
                            elif 'results' in response_data and response_data['results']:
                                current_text = response_data['results'][0]['text']                    
                                new_content = current_text[len(previous_text):]   
                                # logging.info(f"**NEW CONTENT **: {new_content}")        
                                received_so_far += new_content
                                # logging.info(f"***received_so_far***: {received_so_far}")  
                                # some models keep infintitely generating it own ###instruction and ###response, this aborts generation when that happens
                                if new_content == '###' or '###' in received_so_far :
                                    # logging.info(f"'###' found in the string : {new_content}")         
                                    stop_event.set()
                                    abort = requests.post(f"{self.ENDPOINT}/api/extra/abort") 
                                    # logging.info(f"abort:{abort}") 
                                    new_content = ' '
                                    break
                                if new_content:       
                                    q.put(new_content)                                             
                                    x=1               
                                previous_text = current_text
                        
                        time.sleep(0.2)
                        
                except Exception as e:
                    logging.error(f"---------------Error in get_request----------: {str(e)}")        

            
            get_thread = threading.Thread(target=get_request) 
            get_thread.daemon = True
            get_thread.start()        
            
            #TODO:clean this block
            if user_message["data"].get("task") == "chat" and user_message["data"].get("text") != "None":
                logging.info(f"****task is chat*** ") 
                response = requests.post(f"{self.ENDPOINT}/api/v1/generate", json=prompt)
            elif user_message["data"].get("task") == "summary-chat": 
                response = requests.post(f"{self.ENDPOINT}/api/v1/generate", json= summary_chat_prompt)  
            elif user_message["data"].get("task") == "summary": 
                # summarsing only the first chunk
                chunks = self.text_chunker(user_message["data"]["text"])
                abort_value = abort_flag_q.get
                prompt = self.get_prompt(chunks[0])
                response = requests.post(f"{self.ENDPOINT}/api/v1/generate", json=prompt)
                if response.status_code == 200:
                    results = response.json()['results']
                    text = results[0]['text']
                    # change the format to match previous
                    new_conversation = f"### Instruction:\n{chunks[0]}\n### Response:\n{text}\n"
                    self.conversation_history += new_conversation
                    # logging.info(f"self.conversation history after one chunk summary is:{self.conversation_history}")    
                    with open(self.file_path, "a", encoding="utf-8") as f:  
                        f.write(new_conversation) 
                    # logging.info(f"Out: {results}")  
                else:
                    logging.info(f"bad response status code: {response.status_code}")
                                                
                stop_event.set()
                get_thread.join()
                return results
            # bugged
            elif user_message["data"].get("task") == "summarise-further": 
                try:
                    # we send one text chunk at a time to speed things up
                    chunks = self.text_chunker(webpage_content)
                    if len(chunks) > 1:
                        for only_text in chunks[1:]:
                            abort_value = abort_flag_q.get()
                            if abort_value == True:
                                logging.info(f"****abort flag true****")
                                break
                            
                            prompt = self.get_prompt(only_text)
                            # logging.info(f"current chunk is: {only_text}") 
                            response = requests.post(f"{self.ENDPOINT}/api/v1/generate", json=prompt)
                            if response.status_code == 200:
                                results = response.json()['results']
                                text = results[0]['text']
                                # logging.info(f"text is: {text}")  
                                # change the format to match previous
                                new_conversation = f"### Instruction:\n{only_text}\n### Response:\n{text}\n"
                                self.conversation_history += new_conversation
                                with open(self.file_path, "a" ,encoding="utf-8") as f:  
                                    f.write(new_conversation)
                                # response_text = response_text.replace("\n", "")

                            else:
                                logging.info(f"bad response status code: {response.status_code}")

                        # logging.info(f"Out: {results}")    
                        stop_event.set()
                        get_thread.join()
                        return   
                                                
                    else:
                        logging.info("Not enough chunks to process from the second index.")
                                
                except Exception as e:
                     logging.error(f"Error in summarise-further block: {str(e)}")
            
            else:
                logging.info("invalid data in user_message['data'].get('task')")    
                
            stop_event.set()
            get_thread.join()
            
            if response.status_code == 200:
                results = response.json()['results']
                text = results[0]['text']
                # logging.info(f"##########RESPONSEtext is: {response_text}") 
                # change the format to match previous
                new_conversation = f"### Instruction:\n{only_text}\n### Response:\n{text}\n"
                logging.info(f" new conv is: {text}") 
                self.conversation_history += new_conversation
                with open(self.file_path, "a", encoding="utf-8") as f:  
                    f.write(new_conversation) 
                # response_text = response_text.replace("\n", "")
                logging.info(f"Out: {results}")
            return results
        
        except Exception as e:
            logging.error(f"Error in handle_message: {str(e)}")
    

def main():
    ai_interaction = kcpp_api()
    while True:
        # user_message = input(f"{ai_interaction.username}: ")
        user_message = "hi"
        ai_interaction.handle_message(user_message)

if __name__ == '__main__':
    main()