import requests
import re
import time
import threading
import logging
import os
import json

logging.basicConfig(filename='kcpp_api.log', level=logging.INFO, 
                    format='%(asctime)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
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
                
    def delete_history_file(self):
        if os.path.exists(self.file_path):
            os.remove(self.file_path)    
            logging.info(f"Deleted previous conversation history: {self.file_path}")
            
    def clear_conversation_history(self):
        # Clear the in-memory conversation history
        self.conversation_history = ""
        # Clear the contents of the file
        open(self.file_path, 'w').close()        
        logging.info(f"Cleared conversation history file: {self.file_path}")        

    def load_conversation_history(self):
        if os.path.exists(self.file_path):
            with open(self.file_path, 'r') as file:
                self.conversation_history = file.read()
            
    def sayhi(self,message):
        # this will output in log file of the module that called it
        logging.info(f"Out: backend module active")
        logging.info(f"Out: {message}")
    
    
    @staticmethod
    def split_text(text):
        parts = re.split(r'\n[a-zA-Z]', text)
        return parts

    def get_prompt(self, text):  
        return {
            # "prompt": self.conversation_history +f"{self.username}: {text}\n{self.botname}:",
            "prompt": self.conversation_history + f"### Instruction:\n{text}\n### Response:\n",
            "use_story": False,
            "use_memory": True,
            "use_authors_note": False,
            "use_world_info": False,
            "max_context_length": 4096,
            "max_length": 200,
            "rep_pen": 1.1,
            "rep_pen_range": 4096,
            "rep_pen_slope": 0.7,
            "temperature": 0.74,
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

    def handle_message(self, user_message,q):        
        logging.info('output: " backend module is ACTIVE"')
         # turn string to object
        user_message = json.loads(user_message)
        logging.info(f"user_message bah: {user_message}")
        
        # Check if it's a new chat
        if user_message["data"].get("status") == "new_chat":
            logging.info("New chat detected. Clearing conversation history.")
            self.clear_conversation_history()
        
        only_text = user_message["data"]["text"]
        prompt = self.get_prompt(only_text)
        stop_event = threading.Event()
        
        previous_text = ""
        
        def get_request():
            nonlocal previous_text
            received_so_far = ""
            i=0
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
                            logging.info(f"**NEW CONTENT **: {new_content}")        
                            received_so_far += new_content
                            logging.info(f"***received_so_far***: {received_so_far}")  
                            # some models keep infintitely generating it own ###instruction and ###response, this aborts generation when that happens
                            if new_content == '###' or '###' in received_so_far:
                                logging.info(f"'###' found in the string: {new_content}")         
                                abort = requests.post(f"{self.ENDPOINT}/api/extra/abort") 
                                logging.info(f"abort:{abort}") 
                                new_content = ' '
                            if new_content:       
                                q.put(new_content)                                             
                                x=1               
                            previous_text = current_text
                    
                    time.sleep(0.1)
            except Exception as e:
                logging.error(f"---------------Error in get_request----------: {str(e)}")        

        
        get_thread = threading.Thread(target=get_request)
        get_thread.daemon = True
        get_thread.start()
        
        response = requests.post(f"{self.ENDPOINT}/api/v1/generate", json=prompt)
        stop_event.set()
        get_thread.join()
        
        if response.status_code == 200:
            results = response.json()['results']
            text = results[0]['text']
            response_text = self.split_text(text)[0]
            response_text = response_text.replace(" ", " ")
            # cahnge the format to match previous
            new_conversation = f"### Instruction:\n{only_text}\n### Response:\n{response_text}\n"
            self.conversation_history += new_conversation
            with open(self.file_path, "a") as f:  
                f.write(new_conversation) 
            response_text = response_text.replace("\n", "")
            logging.info(f"Out: {results}")
        return results
    

def main():
    ai_interaction = kcpp_api()
    while True:
        # user_message = input(f"{ai_interaction.username}: ")
        user_message = "hi"
        ai_interaction.handle_message(user_message)

if __name__ == '__main__':
    main()