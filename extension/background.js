let extract;
let message;
let port = null;
let portbg;
let portsumpg;
let portchpg;
let receivedMsgFromComponent

// TODO: add condition check for forward_to_summarise_page(msg) in handleairesponse()

//listen for content-script message
console.log("service worker active");
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "connect") {
      connect();
      return true; // Indicates we want to send a response asynchronously
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
  }
);
//native messaging host communication:

//this func sends text extracted from webpage only
function sendExtractedNativeMessage() {
  try{
    chrome.storage.session.get("extract", (result) => {
      if (chrome.runtime.lastError) {
        console.error("Error retrieving from storage:", chrome.runtime.lastError);
      }else {
          // console.log("textcontent:",result.extract.textContent)
          data = {"data":{ status: "new_chat",task:"summary",text: "The following text is extracted from a webpage. Please read the content and provide a concise summary highlighting the main points, key details, and important insights. Make sure the summary is clear, accurate, and easy to understand. Keep the summary under 150 words. Webpage Content:" + result.extract.textContent }}
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

function sendNativeMessage(data) {
  console.log("sending msg from input field: ",data);
  message = { data: data };
  port.postMessage(message);
}

function onDisconnected() {
  port = null;
  console.log("disconnected");
}

function connect() {
  const hostName = 'com.google.chrome.example.echo';
  port = chrome.runtime.connectNative(hostName);
  port.onMessage.addListener(onNativeMessage);
  port.onDisconnect.addListener(onDisconnected);
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
  console.log("***********forward_to_summarise_page() is active*************")
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


//add error handling here later
chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "popup<->background") {
    return;
  }
  portbg = port;
  port.onMessage.addListener((portmsg) => {
    console.log("Received message from popup:", portmsg);
    if(portmsg == 1) {
      connect();
    }else if(portmsg == 2){
      sendExtractedNativeMessage();
    } else {
      console.log("serviceworker background.js received text from popup: ",portmsg);
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
  } else {
    handleAIResponse(msg);
  }
}

function handleAIResponse(msg) {
  console.log("***********handleairesponse() is active*************")
  try {
    if(receivedMsgFromComponent && typeof receivedMsgFromComponent === 'object' && 'task' in receivedMsgFromComponent){
      if(receivedMsgFromComponent.task == "chat"){
        forward_to_chat_page(msg);
      }else{
        console.log("handleairesponse else cond")
        // forwardtopopup(msg);      
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