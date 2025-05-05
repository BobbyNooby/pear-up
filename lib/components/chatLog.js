import { GenericComponent } from "./base/genericComponent";

export class ChatLog extends GenericComponent {
  constructor(pageStateManager) {
    super("chat-log", pageStateManager);
    this.addClasses([
      "flex",
      "flex-col",
      "w-full",
      "h-full",
      "local-container",
      "overflow-y-auto",
      "border-2",
      "rounded-lg",
      "p-4",
      "font-cascadia-code"
    ]);
  }

  setState(state) {
    switch (state) {
      case this.states.SETTING_UP:
        this.clearChat();
        this.appendRawChat(`Setting up media devices...`);
        break;
      case this.states.STOPPED:
        this.clearChat();
        this.appendRawChat(
          `Welcome to Pear Up! Click on the "New" button to get started.`
        );
        break;
      case this.states.CONNECTING:
        this.clearChat();
        this.appendRawChat(`Connecting...`);
        break;
      case this.states.CONNECTING_TO_MATCHMAKING:
        this.clearChat();
        this.appendRawChat(`Connecting to matchmaking server...`);
        break;
      case this.states.CONNECTING_TO_ROOM:
        this.clearChat();
        this.appendRawChat(`Connecting to room...`);
        break;
      case this.states.SEARCHING_FOR_PEER:
        this.clearChat();
        this.appendRawChat(`Searching for a peer...`);
        break;
      case this.states.DISCONNECTING_FROM_MATCHMAKING:
        this.clearChat();
        this.appendRawChat(`Disconnecting from matchmaking server...`);
        break;
      case this.states.DISCONNECTING_FROM_ROOM:
        this.clearChat();
        this.appendRawChat(`Disconnecting from room...`);
        break;
      case this.states.MATCHED:
        this.clearChat();
        this.appendRawChat(`You are now talking to a stranger. Say hi!`);
        break;
      default:
        break;
    }
  }

  appendRawChat(text) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("chat-message");
    messageDiv.innerText = text;
    this.element.appendChild(messageDiv);
  }

  clearChat() {
    this.element.innerHTML = "";
  }

  addMessage(author, message) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("flex", "flex-row", "space-x-1");
    const nameElement = document.createElement("p");
    nameElement.innerText = `<${author}>`;
    const divider  = document.createElement("p");
    divider.innerText = ":";
    const messageElement = document.createElement("p");
    messageElement.innerText = message;
    messageDiv.appendChild(nameElement);
    messageDiv.appendChild(divider);
    messageDiv.appendChild(messageElement);
    this.element.appendChild(messageDiv);
  }
}
