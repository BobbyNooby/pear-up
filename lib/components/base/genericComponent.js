import { PageStateManager } from "../../pageState";

export class GenericComponent {
  constructor(htmlId, pageStateManager) {
    /** @type {PageStateManager} **/
    this.pageStateManager = pageStateManager;
    this.element = document.getElementById(htmlId);
    this.states = this.pageStateManager.STATES;
  }

  addClasses(classes) {
    this.element.classList.add(...classes);
  }
}
