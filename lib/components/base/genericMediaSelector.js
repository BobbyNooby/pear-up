import { GenericComponent } from "./genericComponent";

export class GenericMediaSelector extends GenericComponent {
  /**
   * @param {string} htmlId
   * @param {PageStateManager} pageStateManager
   * @param {'videoinput'|'audioinput'} deviceType
   * @param {Function} onDeviceChange
   * @param {Function} onToggleMute
   * @param {string} iconSrc The left static icon (e.g., camera/mic)
   * @param {string} mutedIconSrc Path to SVG when muted
   * @param {string} unmutedIconSrc Path to SVG when unmuted
   */
  constructor(
    htmlId,
    pageStateManager,
    deviceType,
    onDeviceChange,
    onToggleMute,
    iconSrc,
    mutedIconSrc,
    unmutedIconSrc
  ) {
    super(htmlId, pageStateManager);
    this.deviceType = deviceType;
    this.onDeviceChange = onDeviceChange;
    this.onToggleMute = onToggleMute;
    this.iconSrc = iconSrc;
    this.mutedIconSrc = mutedIconSrc;
    this.unmutedIconSrc = unmutedIconSrc;

    // Wrapper
    this.wrapper = document.createElement("div");
    this.wrapper.classList.add(
      "flex",
      "items-center",
      "gap-2",
      "w-full",
      "p-1",
      "font-quicksand-700"
    );

    // Icon on the left (fixed size)
    this.iconElement = document.createElement("img");
    this.iconElement.src = iconSrc;
    this.iconElement.alt = "";
    this.iconElement.classList.add("w-6", "h-6", "text-white"); // Fixed size

    // Dropdown
    this.selectElement = document.createElement("select");
    this.selectElement.classList.add(
      "flex",
      "flex-1",
      "min-w-0",
      "border",
      "rounded",
      "p-1",
      "w-fit",
      "local-button",
    );

    // Mute button (with icon inside)
    this.muteButton = document.createElement("button");
    this.muteButton.classList.add(
      "border-2",
      "rounded-lg",
      "p-2",
      "flex",
      "items-center",
      "justify-center",
      "local-button",
      "w-10",
      "h-10"
    );
    this.muteIcon = document.createElement("img");
    this.muteIcon.src = unmutedIconSrc;
    this.muteIcon.alt = "";
    this.muteIcon.classList.add("w-5", "h-5");
    this.muteButton.appendChild(this.muteIcon);

    // Assemble
    this.wrapper.appendChild(this.iconElement);
    this.wrapper.appendChild(this.selectElement);
    this.wrapper.appendChild(this.muteButton);

    this.element.appendChild(this.wrapper);

    // Listeners
    this.selectElement.addEventListener("change", (e) => {
      if (this.onDeviceChange) {
        this.onDeviceChange(e.target.value);
      }
    });

    this.muteButton.addEventListener("click", () => {
      if (this.onToggleMute) {
        this.onToggleMute();
      }
    });
  }

  /**
   * Populate dropdown with devices
   * @param {MediaDeviceInfo[]} devices
   */
  populate(devices) {
    // Clear first
    this.selectElement.innerHTML = "";

    devices
      .filter((device) => device.kind === this.deviceType)
      .forEach((device) => {
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text =
          device.label || `${device.kind} ${this.selectElement.length + 1}`;
        this.selectElement.appendChild(option);
      });
  }

  /**
   * Set selected device by deviceId
   */
  setSelected(deviceId) {
    this.selectElement.value = deviceId;
  }

  /**
   * Update mute icon (muted/unmuted)
   * @param {boolean} isMuted
   */
  setMuted(isMuted) {
    this.muteIcon.src = isMuted ? this.mutedIconSrc : this.unmutedIconSrc;
  }

  // Optional: handle state if needed
  setState(state) {}
}
