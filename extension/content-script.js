import { Readability } from '@mozilla/readability';

console.log("content script active");

document.body.style.backgroundColor = "orange";

const clonedDocument = document.cloneNode(true);

const reader = new Readability(clonedDocument);
const article = reader.parse();

// Function to clean the input text by replacing newline characters
function cleanInput(text) {
  return text ? text.replace(/\n+/g, ' ').trim() : '';
}


if (article) {
    article.textContent = cleanInput(article.textContent); 

    console.log('Title:', article.title);
    console.log('Content:', article.textContent);

    // Send data to background.js
    (async () => {
      try {
        const response = await chrome.runtime.sendMessage(article); 
        console.log('Response from background:', response);
      } catch (error) {
        console.error('Error sending message:', error);
      }
    })();
} else {
    console.log("Failed to parse the article.");
}
