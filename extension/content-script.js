//TODO: MAKE SURE IT WORKS AFTER USER SWITCHES TABS ON EACH WEBPAGE && CERTAIN WEBPAGES LIKE THIS ONE: https://en.wikipedia.org/wiki/Florida_State_Road_858 ARE 
//CRASHING SOMETHING, ADD BETTER FILTERING!!

import { Readability } from '@mozilla/readability';

console.log("content script active")

// Clone the current document
const clonedDocument = document.cloneNode(true);

const reader = new Readability(clonedDocument);
const article = reader.parse();

if (article) {
    console.log('Title:', article.title);
    console.log('Content:', article.textContent);
}




// //extract visible text and store to json
// function extractVisibleTextContent() {
//   // Define elements to exclude (navigation, footer etc.)
//   const excludedElements = ["script", "style", "nav", "header", "footer", "form"];

//   // Helper function to check visibility
//   function isVisible(element) {
//     const style = window.getComputedStyle(element);
//     return (
//       style.display !== "none" &&
//       style.visibility !== "hidden" &&
//       element.nodeName.toLowerCase() !== "a" 
//     );
//   }

//   const body = document.body;

//   // Text container
//   const extractedData = {
//     url: window.location.href, // Get current webpage URL
//     textContent: "",
//   };

//   //traverse and extract text
//   function getText(element) {
//     if (element.nodeType === Node.TEXT_NODE && isVisible(element.parentElement)) {
//       extractedData.textContent += element.textContent.trim() + " ";
//     } else if (element.hasChildNodes()) {
//       for (const child of element.childNodes) {
//         if (!excludedElements.includes(child.nodeName.toLowerCase())) {
//           getText(child);
//         }
//       }
//     }
//   }
//   getText(body);

//   // Remove trailing whitespace
//   extractedData.textContent = extractedData.textContent.trim();

//   return extractedData;
// }

// // call the function and store the contents 
// const jsonData = extractVisibleTextContent();
// //console.log(JSON.stringify(jsonData));


// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//         if (request.msg == "turn_blue")
//           document.body.style.backgroundColor = "blue";
//         }
// );

// send to background.js
(async () => {
  const response = await chrome.runtime.sendMessage(article);
  console.log(response);
})();
