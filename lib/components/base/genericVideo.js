import { GenericComponent } from "./genericComponent";

export class GenericVideo extends GenericComponent {
  constructor(htmlId, pageStateManager) {
    super(htmlId, pageStateManager);
    this.element.classList.add(
      "w-full",
      "h-full",
      "object-cover",
      "scale-x-[-1]"
    );
    this.element.autoplay = true;
    this.element.playsInLine = true;
  }

  setVideo(srcObject) {
    this.element.srcObject = srcObject;
  }

  clearVideo() {
    this.element.srcObject = null;
  }

  // Ghost method
  setState(state) {}
}
