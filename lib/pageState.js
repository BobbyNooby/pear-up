/*

    STATE MANAGEMENT

*/

export const States = {
  STOPPED: "stopped",
  CONNECTING: "connecting",
  SEARCHING: "searching",
  MATCHED: "matched",
};

let currentState = States.STOPPED;

export const matchMakeButton = document.getElementById("matchmake-button");
export const sendButton = document.getElementById("send-button");
export const chatInput = document.getElementById("chat-textarea");
export const chatLog = document.getElementById("chat-log");

export function getState() {
  return currentState;
}

export function setState(newState) {
  currentState = newState;
  updateUI(newState);
}

function updateUI(state) {
  switch (state) {
    case States.STOPPED:
      matchMakeButton.innerText = "New";
      matchMakeButton.disabled = false;
      chatInput.disabled = true;
      sendButton.disabled = true;
      break;
    case States.CONNECTING:
      matchMakeButton.disabled = true;
      matchMakeButton.innerText = "Cancel";
      sendButton.disabled = true;
      chatInput.disabled = true;
      clearChat();
      appendRawChat("Connecting to room...");
      break;
    case States.SEARCHING:
      matchMakeButton.disabled = false;
      matchMakeButton.innerText = "Cancel";
      sendButton.disabled = true;
      chatInput.disabled = true;
      clearChat();
      appendRawChat("Searching for a peer...");
      break;
    case States.MATCHED:
      matchMakeButton.innerText = "New";
      matchMakeButton.disabled = false;
      sendButton.disabled = false;
      chatInput.disabled = false;
      break;
    default:
      break;
  }
}

/*

    CHAT FUNCTIONS

*/

export function clearChat() {
  chatLog.innerHTML = "";
}

export function initializeChat() {
  clearChat();
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message");
  messageDiv.innerText = "You are now talking to a stranger. Say hi!";
  chatLog.appendChild(messageDiv);
}

export function appendRawChat(message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message");
  messageDiv.innerText = message;
  chatLog.appendChild(messageDiv);
}

export function appendChat(author, message) {
  const messageDiv = document.createElement("div");
  messageDiv.classList.add("chat-message");
  messageDiv.innerText = `<${author}> : ${message}`;
  chatLog.appendChild(messageDiv);
}

updateUI(States.STOPPED);
