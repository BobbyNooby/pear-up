import { GenericComponent } from "./genericComponent";

export class GenericVideo extends GenericComponent {
  constructor(htmlId, pageStateManager) {
    super(htmlId, pageStateManager);
    this.element.classList.add(
      "object-cover",
      "scale-x-[-1]",
      "max-h-full",
      "max-w-full",
      "z-10"
    );
    this.element.autoplay = true;
    this.element.playsInline = true;
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
