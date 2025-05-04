import { GenericVideo } from "./base/genericVideo";

export class YourStream extends GenericVideo {
  constructor(pageStateManager) {
    super("your-stream", pageStateManager);
    this.element.muted = true;
  }
}
