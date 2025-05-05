import { GenericComponent } from "./genericComponent";

export class GenericButton extends GenericComponent {
  constructor(htmlId, pageStateManager) {
    super(htmlId, pageStateManager);
    const classes = [
      "w-24",
      "h-full",
      "local-button",
      "border-2",
      "rounded-lg",
      "font-quicksand-700",
    ];
    this.element.classList.add(...classes);
    this.element.style.cursor = "pointer";
  }
}
