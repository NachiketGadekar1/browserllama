![alt text](https://github.com/NachiketGadekar1/browserllama/blob/main/extension/assets/Llama-PNG-Photo-128.png?raw=true)

# BrowserLlama 

**BrowserLlama** is a browser extension that lets you summarize and chat with any webpage using a local LLM. 

## Features

   Summarize Webpages: Quickly generate concise summaries of any webpage.

   Chat with Webpages: Interact with the webpage content using a conversational AI interface.

   Local AI Backend: Runs with a locally hosted Python-based AI backend, ensuring data privacy and security.

## Getting Started



1. **Clone the Repository**:
   ```
   git clone https://github.com/NachiketGadekar1/browserllama.git

2. **Install Node Modules**:


   ```
   cd extension
   npm install
   ```

3. Build the Extension

Use Webpack to build the extension from source files:
   ```
   npm run build
   ```
This will create the necessary build files in the dist folder. 

4. Install Python Backend

Navigate to the host directory where the Python server is located and install the required packages using pip:
   ```
cd browserllama
pip install -r requirements.txt
   ```
5. Load the Extension in Your Browser

    Open Chrome (or any Chromium-based browser) and go to chrome://extensions/.
    Enable Developer Mode in the top-right corner.
    Click on Load unpacked and select the extension folder from the browserllama directory.

## note 
The extension is still in beta, if you're facing any problems try the following
<li>make sure only one backend is open at a given moment, a yet to be fixed bug sometimes opens two instances at once 
            <li>reopen the extension popup</li>
            <li>reload the webpage</li>
            <li>restart the browser</li>
            <li>ensure backend is running</li>
            