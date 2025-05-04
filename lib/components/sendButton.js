import { sessionIdHexString } from "../globals";
import { GenericButton } from "./base/genericButton";

export class SendButton extends GenericButton {
  constructor(pageStateManager) {
    super("send-button", pageStateManager);
    this.element.innerText = "Send";
  }

  setState(state) {
    switch (state) {
      case this.states.STOPPED:
        this.element.disabled = true;
        break;
      case this.states.CONNECTING:
        this.element.disabled = true;
        break;
      case this.states.CONNECTING_TO_MATCHMAKING:
        this.element.disabled = true;
        break;
      case this.states.CONNECTING_TO_ROOM:
        this.element.disabled = true;
        break;
      case this.states.SEARCHING_FOR_PEER:
        this.element.disabled = true;
        break;
      case this.states.DISCONNECTING_FROM_MATCHMAKING:
        this.element.disabled = true;
        break;
      case this.states.DISCONNECTING_FROM_ROOM:
        this.element.disabled = true;
        break;
      case this.states.MATCHED:
        this.element.disabled = false;
        break;
      default:
        break;
    }
  }

  initialize() {}

  onClick() {
    const text = this.pageStateManager.getComponents().chatInput.getValue();
    this.pageStateManager.getComponents().chatInput.setValue("");
    this.pageStateManager.swarm.broadcast({
      type: "chat",
      message: text,
      author: sessionIdHexString,
    });
    this.pageStateManager.getComponents().chatLog.addMessage("You", text);
  }
}
