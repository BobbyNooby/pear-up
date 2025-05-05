import { GenericComponent } from "./base/genericComponent";

export class ChatTextArea extends GenericComponent {
  constructor(pageStateManager) {
    super("chat-textarea", pageStateManager);
    this.addClasses([
      "flex-1",
      "h-full",
      "px-3",
      "py-2",
      "rounded",
      "resize-none",
      "outline-none",
      "local-textarea",
      "border-2",
      "font-quicksand-700",
    ]);

    this.element.addEventListener("keydown", (e) => {
      if(e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.pageStateManager.getComponents().sendButton.onClick();
      }
    })
  }

  setState(state) {
    switch (state) {
      case this.states.SETTING_UP:
        this.element.disabled = true;
        break;
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

  getValue() {
    return this.element.value;
  }

  setValue(value) {
    this.element.value = value;
  }
}
