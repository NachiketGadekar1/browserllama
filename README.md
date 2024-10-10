![alt text](https://github.com/NachiketGadekar1/browserllama/blob/main/extension/assets/browserllama-logo-black.png?raw=true)

# BrowserLlama 

**BrowserLlama** is a browser extension that lets you summarize and chat with any webpage using a local LLM. It utilizes a koboldcpp backend for inference and a native-messaging-host facilitates the extension-backend communication. 

## Features

- **Webpage Summaries**:  Create customizable summaries of any webpage .
- **Question the Webpage**: Engage with webpage content by asking questions to the ai.
- **AI Chat**: Have conversations with language models.
- **Local AI Backend**: Leverage your locally running language models for a fully private experience.

## Getting Started

1. **Clone the Repository**:
   ```
   git clone https://github.com/NachiketGadekar1/browserllama.git
2. **Install Node Modules**:
   ```
   cd extension
   npm install
   ```
3. Install Python Backend

   Install the required packages using pip:
      ```
   cd host
   pip install -r requirements.txt
   ```
4. Load the Extension in Your Browser

    Open Chrome (or any Chromium-based browser) and go to chrome://extensions/.
    Enable Developer Mode in the top-right corner.
    Click on Load unpacked and select the extension folder from the browserllama directory.

5. Copy the loaded extension id 

   unpacked extension id is dynamic, so copy your current extension id and paste in 
   allowed origins field of com.google.chrome.example.echo.json/com.google.chrome.example.ech-win.json file

6. Build the Extension (optional, follow only if source is modified)

   Use Webpack to build the extension from source files:
   ```
   npx webpack --config webpack.config.js  
   ```

## Supported platforms
   Current version of browserllama only runs on chromium based browsers on windows.    

