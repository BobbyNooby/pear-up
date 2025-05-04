import { GenericButton } from "./base/genericButton";

export class MatchMakeButton extends GenericButton {
  constructor(pageStateManager) {
    super("matchmake-button", pageStateManager);
  }

  setState(state) {
    switch (state) {
      case this.states.STOPPED:
        this.element.innerText = "New";
        this.element.disabled = false;
        break;
      case this.states.CONNECTING:
        this.element.innerText = "Cancel";
        this.element.disabled = true;
        break;
      case this.states.CONNECTING_TO_MATCHMAKING:
        this.element.innerText = "Cancel";
        this.element.disabled = true;
        break;
      case this.states.CONNECTING_TO_ROOM:
        this.element.innerText = "Cancel";
        this.element.disabled = true;
        break;
      case this.states.SEARCHING_FOR_PEER:
        this.element.innerText = "Cancel";
        this.element.disabled = false;
        break;
      case this.states.DISCONNECTING_FROM_MATCHMAKING:
        this.element.innerText = "Cancel";
        this.element.disabled = true;
        break;
      case this.states.DISCONNECTING_FROM_ROOM:
        this.element.innerText = "Cancel";
        this.element.disabled = true;
        break;
      case this.states.MATCHED:
        this.element.innerText = "New";
        this.element.disabled = false;
        break;
      default:
        break;
    }
  }

  onClick() {
    if (
      this.pageStateManager.getState() === this.pageStateManager.STATES.STOPPED
    ) {
      this.pageStateManager.matchmaker.startMatchmaking();
    } else if (
      this.pageStateManager.getState() ===
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    ) {
      this.pageStateManager.matchmaker.stopMatchMaking();
    } else if (
      this.pageStateManager.getState() === this.pageStateManager.STATES.MATCHED
    ) {
      this.pageStateManager.matchmaker.findNew();
    }
  }
}
