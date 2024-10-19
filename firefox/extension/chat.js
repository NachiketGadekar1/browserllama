let message;
var chat_status = 0
let reference = null

// hide abort by default
document.getElementById("abort-button").style.display = "none";

// TODO: remove useless conditions later
function append(msg, isUserQuery = false) {
    console.log("append func:",msg);
    
    let textToAppend = '';
    if (isUserQuery) {
        textToAppend = msg.text || 'No user query found';
    } else if (msg && msg["echo message from native host"] && msg["echo message from native host"].data) {
        textToAppend = msg["echo message from native host"].data.text || 'No text found';
    } else if (msg.ai_response) {
        console.log("full msg:", msg.ai_response);
      // textToAppend = msg.ai_response || 'No AI response found';
    } else if(msg.ai_response_chunk){
        textToAppend = msg.ai_response_chunk || 'No AI response found';
    }else{
      textToAppend = 'Unexpected message format';
    }
    console.log("Text to append:", textToAppend);

    const chatContent = document.querySelector('.chat_content');
    const newParagraph = document.createElement('p');
    newParagraph.textContent = textToAppend;
    newParagraph.className = isUserQuery ? 'user_query' : 'ai_response';
    chatContent.appendChild(newParagraph);
}

// unique id for each reponse element
function createIdGenerator() {
    let i = 0;  
    
    return function() {
        const id = "id" + i;
        i += 1;  
        return id;
    };
}

// Function to show the abort button
function showAbortButton() {
  var element = document.getElementById("abort-button");
  element.style.display = "block";
}

// Function to hide the abort button
function hideAbortButton() {
  var element = document.getElementById("abort-button");
  element.style.display = "none";
}

// Function to show the send button
function showSendButton() {
  var element = document.getElementById("send-button");
  element.style.display = "block";
}

// Function to hide the send button
function hideSendButton() {
  var element = document.getElementById("send-button");
  element.style.display = "none";
}

function toggleButtonsState(){
  var element = document.getElementById("abort-button");
  var element2 = document.getElementById("send-button");
  if (element.style.display === "none") {
    element.style.display = "block";  
    element2.style.display = "none";
  } else {
    element.style.display = "none";  
    element2.style.display = "block";
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('send-button').addEventListener('click', function() {
      const userInput = document.getElementById('question-input').value;
      if (userInput.trim() !== '') {
          append({ text: userInput }, true);  // Append user query
          createNewAIResponseStructure();
          bgcon(1);
          hideSendButton();
          showAbortButton();
          document.getElementById('question-input').value = '';
      }
  });

  document.getElementById('abort-button').addEventListener('click', function() {
    console.log("aborting");
    hideAbortButton();
    showSendButton();
    bgcon(2);
  });

  document.getElementById('question-input').addEventListener('keydown', function(event) {
      if (event.key === 'Enter') {
          event.preventDefault();
          document.getElementById('send-button').click();
      }
  });

    document.querySelector('.back-button').addEventListener('click', function() {
      window.location.href = './main.html';
    });
});


// this function creates this structure:
/* 
<div class="chat_content">
    <!-- ... previous messages ... -->
    <div class="ai_response" id="[generated_id]">
        [AI response content]
    </div>
 </div> 
*/
function createNewAIResponseStructure() {
  const chatContent = document.querySelector('.chat_content');
  if (!chatContent) {
      const chatContentDiv = document.createElement('div');
      chatContentDiv.className = 'chat_content';
      document.body.appendChild(chatContentDiv);
  }

  const aiResponseDiv = document.createElement("div");
  aiResponseDiv.className = 'ai_response';
  const idGenerator = createIdGenerator();
  aiResponseDiv.id = idGenerator();
  
  document.querySelector('.chat_content').appendChild(aiResponseDiv);
  
  reference = aiResponseDiv;  // Update the global reference
}


function appendAiResponse(msg) {
  console.log("append ai response func:", msg);
  let textToAppend = '';

  // Helper function to handle the truncation before ###
  function truncateResponse(response) {
    if (response.includes('###')) {
      return response.split('###')[0];  
    }
    return response;  
  }

  if (msg.ai_response_chunk) {
    textToAppend = truncateResponse(msg.ai_response_chunk) || 'No AI response found';
    
    if (reference) {
      reference.textContent += textToAppend;
    } else {
      console.error("No reference element to append to");
    }
  } else if (msg.ai_response) {
    textToAppend = truncateResponse(msg.ai_response) || 'No AI response found';

    if (reference) {
      reference.textContent = textToAppend;
    } else {
      console.error("No reference element to append to");
    }
  } else {
    console.log('Unexpected message format:', msg);
  }

  console.log("Text to append:", textToAppend);
}


function bgcon(task){
  try{
    const portbg = chrome.runtime.connect({ name: "chat<->background" });
    if(task == 1 && chat_status == 1){
        message = { status: "old_chat",task:"chat",text: document.getElementById('question-input').value };
        console.log("chat input box content", message)
        portbg.postMessage(message);
    }else if(task == 1 && chat_status == 0){
      message = { status: "new_chat",task:"chat", text: document.getElementById('question-input').value };
      console.log("chat input box content", message)
      portbg.postMessage(message);
      chat_status = 1
    }else if(task == 2){
      message = { status: "abort",task:"chat", text: "None"};
      portbg.postMessage(message);
    }else{
      portbg.postMessage("invalid");
    }

    portbg.onMessage.addListener((smsg) => {
        console.log("chat page Received message from service worker:", smsg);
        console.log('Received message: <b>' + JSON.stringify(smsg) + '</b>');
        // TODO: this is not working right
        let object;
        object = smsg
        if (object.ai_response === "^^^stop^^^"){
          hideAbortButton();
          showSendButton();
        }else{
          appendAiResponse(smsg)
        }
        
      });
  }catch(error){
    console.log("bgcon error:",error)
  }  
}

