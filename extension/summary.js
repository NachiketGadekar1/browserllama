let message;

function append(msg) {
  // object structure:
  // {
  //   "echo message from native host": {
  //     "data": {
  //       "text": "gg"
  //     }
  //   }
  // }
  console.log("This is from the append func:");
  console.log(msg);

  let textToAppend = '';

  if (msg && msg["echo message from native host"] && msg["echo message from native host"].data) {
      textToAppend = msg["echo message from native host"].data.text || 'No text found';
  } else if (msg && msg["echo message from native host"] && msg["echo message from native host"].data) {
      textToAppend = msg["echo message from native host"].data.text || 'No text found';
  } else if (msg.ai_response) {
      console.log("full msg:", msg.ai_response);
    // textToAppend = msg.ai_response || 'No AI response found';
  } else if(msg.ai_response_chunk){
      textToAppend = msg.ai_response_chunk || 'No AI response found';
  }else {
      textToAppend = 'Unexpected message format';
  }

  console.log("Text to append:", textToAppend);
  const pTag = document.getElementById('summary-paragraph');
  if (pTag) {
      pTag.textContent += textToAppend + '\n';
  }
}

function get_tabname() {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    if (tabs[0] && tabs[0].url) {
      let url = tabs[0].url;
      let hostname = new URL(url).hostname;
      // Remove 'www.' if present
      hostname = hostname.replace(/^www\./, '');
      document.getElementById('tab_name').textContent = hostname;
      console.log("Tab hostname:", hostname);
    } else {
      console.log("No active tab or URL found");
    }
  });
}
get_tabname()

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('send-button').addEventListener('click', function() {
    bgcon(1);
  });

  // keydown event listener for the input field
  document.getElementById('question-input').addEventListener('keydown', function(event) {
    // Check if the pressed key is Enter
    if (event.key === 'Enter') {
      event.preventDefault();
      document.getElementById('send-button').click();
    }
  });

  // Event listener for the back button
  document.querySelector('.back-button').addEventListener('click', function() {
    window.location.href = './main.html';
  });
});


function bgcon(task){
  try{
    const portbg = chrome.runtime.connect({ name: "summary<->background" });
    if(task==1){
        message = { status: "old_chat",task:"summary",text: document.getElementById('question-input').value };
        console.log("summarypage input box content", message)
        portbg.postMessage(message);
    }else{
      portbg.postMessage("summarypage something  went wrong");
    }

    portbg.onMessage.addListener((smsg) => {
        console.log("summary page Received message from service worker:", smsg);
        console.log('Received message: <b>' + JSON.stringify(smsg) + '</b>');
        append(smsg)
        
      });
  }catch(error){
    console.log("bgcon error:",error)
  }  
}

