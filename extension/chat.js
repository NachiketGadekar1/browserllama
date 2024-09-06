let message;
var chat_status = 0
let reference = null

// TODO: remove useless else conditions later
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


document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('send-button').addEventListener('click', function() {
      const userInput = document.getElementById('question-input').value;
      if (userInput.trim() !== '') {
          append({ text: userInput }, true);  // Append user query
          createNewAIResponseStructure();
          bgcon(1);
          document.getElementById('question-input').value = '';  // Clear input after sending
      }
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
  if (msg.ai_response_chunk) {
      textToAppend = msg.ai_response_chunk || 'No AI response found';
  } else {
      console.log('Unexpected message format:',msg);
  }
  console.log("Text to append:", textToAppend);
  
  if (reference) {
      reference.textContent += textToAppend;
  } else {
      console.error("No reference element to append to");
  }
}


function bgcon(task){
  try{
    const portbg = chrome.runtime.connect({ name: "chat<->background" });
    if(task==1 && chat_status == 1){
        message = { status: "old_chat",task:"chat",text: document.getElementById('question-input').value };
        console.log("chat input box content", message)
        portbg.postMessage(message);
    }else if(task==1 && chat_status == 0){
      message = { status: "new_chat",task:"chat", text: document.getElementById('question-input').value };
      console.log("chat input box content", message)
      portbg.postMessage(message);
      chat_status = 1
    }else{
      portbg.postMessage("task was not 1");
    }

    portbg.onMessage.addListener((smsg) => {
        console.log("chat page Received message from service worker:", smsg);
        console.log('Received message: <b>' + JSON.stringify(smsg) + '</b>');
        appendAiResponse(smsg)
        
      });
  }catch(error){
    console.log("bgcon error:",error)
  }  
}

