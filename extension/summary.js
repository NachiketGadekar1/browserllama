let message;
let summaryOver = false
let summaryStatus = "Partial"

// establishing connection so we can listen to background.js without the user sending anything in the text box
summarybgcon()

console.log("***********summary page is active*****");

function append(msg) {
  console.log("This is from the append func:", msg);
  let textToAppend = '';

  if (msg && msg["echo message from native host"] && msg["echo message from native host"].data) {
    textToAppend = msg["echo message from native host"].data.text || 'No text found';
  }else if (msg.ai_response) {
    console.log("full msg:", msg.ai_response);
  }else if (msg.ai_response_chunk) {
    textToAppend = msg.ai_response_chunk || 'No AI response found';
  }else {
    textToAppend = 'Unexpected message format';
  }

  console.log("Text to append:", textToAppend);

  const summaryDiv = document.querySelector('.summary-content');
  const spinner = document.querySelector('.spinner');
  if (summaryDiv) {
    spinner.style.display = 'none';
    if (textToAppend === "\n") {
      summaryDiv.innerHTML += '<br>'; 
      summaryDiv.innerHTML += '<br>'; 
    } else {
      summaryDiv.appendChild(document.createTextNode(textToAppend));
    }
    summaryDiv.scrollTop = summaryDiv.scrollHeight;
  } else {
    console.error("Couldn't find the .summary-content div");
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

  document.getElementById('abort-button').addEventListener('click', function() {  
  const spinner = document.querySelector('.spinner');
  spinner.style.display = 'none';
  console.log("aborting");
  // toggleButtonsState()
  bgcon(2);
  });

  document.getElementById('summariseFurther').addEventListener('click', function() {
    console.log("Summarising further");
    const element = document.getElementById('summariseFurther');
    element.style.display = "none";
    bgcon(3);
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
        document.querySelector('.spinner').style.display = 'block';
        message = { status: "old_chat",task:"summary",text: document.getElementById('question-input').value };
        console.log("summarypage input box content", message)
        portbg.postMessage(message);
    }else if(task == 2){
      message = { status: "abort",task:"chat", text: "None"};
      portbg.postMessage(message);
    }else if(task == 3){
      message = { status: "old_chat",task:"summarise-further", text: "None"};
      portbg.postMessage(message);
    }else{
      portbg.postMessage("summarypage error");
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

function summarybgcon(){
  try{    
    const portbg = chrome.runtime.connect({ name: "summary<->background" });
    portbg.postMessage("initialize");

    document.querySelector('.spinner').style.display = 'block';
    portbg.onMessage.addListener((smsg) => {
      console.log("summary page Received message from service worker:", smsg);
      console.log('Received message: <b>' + JSON.stringify(smsg) + '</b>');
      let message;
      message = smsg
      if (message.ai_response === "^^^stop^^^"){
        summaryOver = true

        // making summarise further button visible once partial summary is over
        const element = document.getElementById('summariseFurther');
        if (summaryStatus == "Partial"){
          element.classList.remove('hidden');
          summaryStatus = "Full"
        }        

        let newline={
          "ai_response_chunk": "\n"
        }
        append(newline)
      }
      append(smsg)
  })
  }catch(error){
    console.log("summarybgcon error:",error)
  }  
}
