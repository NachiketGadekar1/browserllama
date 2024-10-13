// message for connecting with native host will be sent to background.js when connect is pressed

document.addEventListener('DOMContentLoaded', () => {
    const connectButton = document.getElementById('connect-button');
    if (connectButton) {
        connectButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({action: "connect"}, function(response) {
                if (chrome.runtime.lastError) {
                    console.error("Error connecting:", chrome.runtime.lastError);
                
                } else {
                    console.log("Connect response:", response);
                    localStorage.setItem('runConnectLogic', 'true');
                    window.location.href = 'main.html';
                }
            });
            
            // Set a flag in localStorage
            localStorage.setItem('runConnectLogic', 'true');
            window.location.href = 'main.html';
        });
    }
});