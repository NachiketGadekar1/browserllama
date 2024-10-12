let extract;
let message;
let port = null;
let portbg;
let portsumpg;
let portchpg;
let receivedMsgFromComponent
let injectionFLag = false
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY = 1000; 

try{
    //listen for content-script message
    console.log("service worker active");

    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === chrome.runtime.OnInstalledReason.INSTALL) {
        chrome.tabs.create({ url: "./oninstall.html" });
      }
    });      

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      try{
        if (request.action === "connect") {
            console.log("swrkr listenr:",request.action)
            // connect();
            return true; // Indicates we want to send a response asynchronously
        }else if(request.action === "inject"){
            console.log("swrkr listenr:",request.action)
            async function injectScript() {
              const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
              // console.log("TAB:",tab.id)
              await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['./dist/content-script.bundle.js']
              });
              injectionFLag = true
            }
              injectScript();

        }else{
            console.log("invalid message",request.action)
        }

        extract = request;
        console.log(sender.tab ?
                    "from a content script:" + sender.tab.url :
                    "from the extension");
        console.log("this is the object received from content script: ", request);
        // store extracted content using chrome.storage api
        chrome.storage.session.set({extract}).then(() => {
          if (chrome.runtime.lastError) {
            console.error("Error saving to storage:", chrome.runtime.lastError);
          }else {
            console.log("Saved extract object to storage successfully!");
          }
        });
        // use this to respond
        if (request.url != "a")
          sendResponse({farewell: "working"});
      }catch(error) {
        console.log("Error trying to inject content script:", error);
      } 
  });


    //native messaging host communication:

    //this func sends text extracted from webpage only
    function sendExtractedNativeMessage() {
      try{
        chrome.storage.session.get("extract", (result) => {
          if (chrome.runtime.lastError) {
            console.error("Error retrieving from storage:", chrome.runtime.lastError);
          }else {
              // console.log("textcontent:",result.extract.textContent)
              data = {"data":{ status: "new_chat",task:"summary",text: "You are an AI model who is part of the browser extension 'browserllama' tasked with summarizing webpages and answering related questions. You will first receive only a part of the webpage and if the user wishes then you will also receive the rest of the webpage in managable chunks, one at a time . Carefully read each chunk and ensure that you do not repeat information provided in your previous responses. Keep your summaries clear, accurate, focused on key points, and under 100 words per chunk. DO NOT TALK ABOUT RECEIVING FURTHER CHUNKS. Here is the current chunk:" + result.extract.textContent }}
              port.postMessage(data);
              if (result) {
                console.log("Retrieved data from storage:", result);
              } else {
                console.log("No data found under the key");
            }
          }
        });
    }catch(error){
      console.log("error in sendExtractedNativeMessage() :", error)
    }
    }

    function connect() {
      try {
          const hostName = 'com.google.chrome.example.echo';
          port = chrome.runtime.connectNative(hostName);
          port.onMessage.addListener(onNativeMessage);
          port.onDisconnect.addListener(onDisconnected);
          reconnectAttempts = 0;
          console.log("Successfully connected to native host");
          return true;
      } catch(error) {
          console.error("Error connecting to native host:", error);
          forwardtopopup("error");
          return false;
      }
    }
  
    function onDisconnected() {
        console.log("Native connection disconnected");
        port = null;
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(() => {
                if (!port) {
                    connect();
                }
            }, RECONNECT_DELAY);
        } else {
            console.error("Max reconnection attempts reached");
            forwardtopopup("connection_failed");
        }
    }
    
    function sendNativeMessage(data) {
        try {
            if (!port) {
                console.log("No active connection, attempting to reconnect...");
                if (!connect()) {
                    throw new Error("Failed to establish connection");
                }
            }
            
            const message = { data: data };
            port.postMessage(message);
            console.log("Message sent successfully:", data);
        } catch(error) {
            console.error("Error in sendNativeMessage:", error);
            forwardtopopup("failed_to_send_message_to_backend");
            throw error; // Re-throw to maintain existing error handling flow
        }
    }

    // ping to check host connection
    function ping(){
      if (!port) return false; 

      // we are assuming that if everything goes right the connection is working or if error is thrown we are disconnected.
      let pingmsg = {data:{ status: "",task:"ping",text:""}};
      try{
        console.log("pinging")
        port.postMessage(pingmsg);
        return true
      }catch{
        console.log("ping failed")
        forwardtopopup("ping_failed")
        return false
      }
    }

    // forward message to popup
    function forwardtopopup(data) {
      if (portbg) {
        try{
          portbg.postMessage(data);
        }catch(error){
          console.log("forwardtopopup error:", error)
      }
    }
    }

    function forward_to_summarise_page(data) {
      if (portsumpg) {
        try{
          console.log("data to be sent is:",data)
          portsumpg.postMessage(data);
        }catch(error){
          console.log("portsumpg.postMessage(data); error:", error)
        }
      }
    }

    function forward_to_chat_page(data) {
      if (portchpg) {
        try{
          portchpg.postMessage(data);
        }catch(error){
          console.log("portchpg.postMessage(data) error:", error)
        }
      }
    }

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== "popup<->background") {
        return;
      }
      portbg = port;
      port.onMessage.addListener((portmsg) => {
        console.log("Received message from popup:", portmsg);
        if(portmsg == 1) {
          console.log("background.js received text from popup: ",portmsg);
          pingres = ping()
          if(pingres ==  false){
            connect();
          }else{
            console.log("host is already connected")
          }
        }else if(portmsg == 2){
          console.log("background.js received text from popup: ",portmsg);
          sendExtractedNativeMessage();
        } else {
          console.log("background.js received invalid text from popup: ",portmsg);
          sendNativeMessage(portmsg);
        }
      });
    });

    //communicate with summary.js
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== "summary<->background") {
        return;
      }
      portsumpg = port;
      
      port.onMessage.addListener((portmsg2) => {
        console.log(" background.js received text from summarypage: ", portmsg2);
        receivedMsgFromComponent = portmsg2
        if(portmsg2 == "initialize"){
          console.log("initalized connection")
        }else{
          try {
              sendNativeMessage(portmsg2);
          } catch (error) {
              console.error("Error sending native message:", error);
              port.postMessage({ error: "Failed to send native message" });
        }}
      });
    })

    //communicate with chat.js
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== "chat<->background") {
        return;
      }
      portchpg = port;
      
      port.onMessage.addListener((portmsg3) => {
        console.log(" background.js received text from chat page: ", portmsg3);
        receivedMsgFromComponent = portmsg3
        try {
          sendNativeMessage(portmsg3);
        }catch (error) {
          console.error("Error sending native message:", error);
          port.postMessage({ error: "Failed to send native message" });
        }
      });
    })

    function onNativeMessage(msg) {
      console.log("Received native message:", JSON.stringify(msg));
      
      if (msg["echo message from native host"]) {
        console.log("Received echo message from native host");
      }else if (msg["ping"] === "pong") {
        console.log("Received ping-pong message");
        // this will let the popup know what message to show
        forwardtopopup("ping_success")
      }else if (msg["error"] === "relaunching kcpp exe") {
        console.log("host is trying to relaunch kcpp exe");
        forwardtopopup("ping_failed")
      }else {
        handleAIResponse(msg);
      }
    }

    function handleAIResponse(msg) {
      try {
        if(receivedMsgFromComponent && typeof receivedMsgFromComponent === 'object' && 'task' in receivedMsgFromComponent){
          if(receivedMsgFromComponent.task == "chat"){
            forward_to_chat_page(msg);
          }else{
            forward_to_summarise_page(msg);
          }
        }else{
          console.log("sending to summary page func")
          forward_to_summarise_page(msg);
        }  
      }catch(error) {
        console.log("Error forwarding AI response:", error);
      }
    }
  }catch(error) {
    console.log("Error in srwrkr:", error);
  }  