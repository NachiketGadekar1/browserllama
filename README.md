![alt text](https://github.com/NachiketGadekar1/browserllama/blob/main/extension/assets/browserllama-logo-black.png?raw=true)

# BrowserLlama 

**BrowserLlama** is a browser extension that lets you summarize and chat with any webpage using a local LLM. It utilizes a koboldcpp backend for inference and a native-messaging-host facilitates the extension-backend communication. 

webstore: https://chromewebstore.google.com/detail/browserllama/iiceejapkffbankfmcpdnhhbaljepphh

## Features

- **Webpage Summaries**:  Create customizable summaries of any webpage .
- **Question the Webpage**: Engage with webpage content by asking questions to the ai.
- **AI Chat**: Have conversations with language models.
- **Local AI Backend**: Leverage your locally runnnig language models for a fully private experience.

## Getting Started

1. **Clone the Repository**:
   ```
   git clone https://github.com/NachiketGadekar1/browserllama.git
2. **Install Node Modules**:
   ```
   cd extension
   npm install
   ```
3. **Install Python Backend dependencies**

   Install the required packages using pip:
      ```
   cd host
   pip install -r requirements.txt
   ``` 

4. **Load the Extension in Your Browser**

    Open Chrome (or any Chromium-based browser) and go to chrome://extensions/.
    Enable Developer Mode in the top-right corner.
    Click on Load unpacked and select the extension folder from the browserllama directory.

5. **Copy the loaded extension id** 

   unpacked extension id is dynamic, so copy your current extension id and paste in 
   allowed origins field of com.google.chrome.example.echo.json/com.google.chrome.example.ech-win.json file

6. **Allow the browser to launch the right file**

    Go to the host folder and open native-messaging-host.bat and make sure that it is pointing to native-messaging-host.py if you want to test any modified host code or if you want to test native-messaging-host.exe which you can compile using
   ```
   pyinstaller native-messaging-host.py                              
   ```                                    
   then change path field in com.google.chrome.example.echo.json/com.google.chrome.example.ech-win.json from:
   ```
   "path": "native-messaging-host.bat"
   ```

   to 
   ```
   "path": "native-messaging-host.exe"
   ```              
   the exe and the internals folder needs to be on the same level as the bat, so you will have to copy it from dist               

7. **Build the Extension (optional, follow only if source is modified)**

   Use Webpack to build the extension from source files:
   ```
   npx webpack --config webpack.config.js  
   ```

## Supported platforms
   Current version of browserllama only runs on chromium based browsers on windows.    

