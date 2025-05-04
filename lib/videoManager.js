import { iceServers } from "./globals";
import { PageStateManager } from "./pageState";

export class VideoManager {
  constructor() {
    // Lazy init prep

    /**   @type {PageStateManager} **/
    this.pageStateManager = null;

    // Base vars
    this.peerConnection = null;
    this.yourStream = null;
    this.peerStream = null;
    this.onSignal = null;
    this.isInitiator = false;

    this.yourSettings = {
      videoDevice: null,
      audioDevice: null,
      videoMute: false,
      audioMute: false,
    };

    this.peerSettings = {
      videoMute: false,
      audioMute: false,
    };
  }

  init(pageStateManager) {
    this.pageStateManager = pageStateManager;
  }

  async setupLocalMedia() {
    try {
      // Get all devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      const audioInputs = devices.filter((d) => d.kind === "audioinput");

      // Try all video and audio devices
      if (videoInputs.length > 0 && audioInputs.length > 0) {
        for (const videoDevice of videoInputs) {
          for (const audioDevice of audioInputs) {
            try {
              // Try combination
              this.yourStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: videoDevice.deviceId },
                audio: { deviceId: audioDevice.deviceId },
              });

              // Log combination
              console.log(`Using camera: ${videoDevice.label}`);
              console.log(`Using audio: ${audioDevice.label}`);

              // Set video element
              this.pageStateManager
                .getComponents()
                .yourStream.setVideo(this.yourStream);
              return true;
            } catch (e) {
              console.error(
                `Invalid combination. V : ${videoDevice.label} A: ${audioDevice.label} Error : ${e}`
              );
              // Try next combination
            }
          }
        }
      }

      // Fallback to video only
      for (const videoDevice of videoInputs) {
        try {
          // Try video device
          this.yourStream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: videoDevice.deviceId },
            audio: false,
          });

          // Log combination
          console.log(`Using camera: ${videoDevice.label}`);
          console.log(`Using audio: false}`);

          // Set video element
          this.pageStateManager
            .getComponents()
            .yourStream.setVideo(this.yourStream);
          return true;
        } catch (e) {
          console.error(
            `Invalid combination. V : ${videoDevice.label} A: false Error : ${e}`
          );
          // Try next combination
        }
      }

      // Fallback to nothing
      this.yourStream = null;
      this.pageStateManager.getComponents().yourStream.clearVideo();
      return false;
    } catch (e) {
      console.error(`There was an error in setting up local media: ${e}`);
      return false;
    }
  }

  createConnection(isInitiator, sendSignal) {
    this.disconnect();
    this.isInitiator = isInitiator;
    this.onSignal = sendSignal;
    this.peerConnection = new RTCPeerConnection({
      iceServers: iceServers,
    });

    this.peerStream = new MediaStream();
    this.pageStateManager.getComponents().peerStream.setVideo(this.peerStream);

    // Setup ice candidate callback
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.onSignal({ type: "ice", candidate: event.candidate });
      }
    };

    this.peerConnection.ontrack = (event) => {
      this.peerStream.addTrack(event.track);

      console.log(`Added peer track`);
      this.pageStateManager
        .getComponents()
        .peerStream.setVideo(this.peerStream);
    };

    this.yourStream.getTracks().forEach((track) => {
      this.peerConnection.addTrack(track, this.yourStream);
    });

    if (isInitiator) {
      try {
        this.peerConnection
          .createOffer()
          .then((offer) => this.peerConnection.setLocalDescription(offer))
          .then(() =>
            this.onSignal({
              type: "offer",
              offer: this.peerConnection.localDescription,
            })
          );
      } catch (e) {
        console.error(`There was an error in creating an offer: ${e}`);
      }
    }
  }

  handleSignal(data) {
    if (!this.peerConnection) return;

    try {
      switch (data.type) {
        case "offer":
          this.peerConnection
            .setRemoteDescription(new RTCSessionDescription(data.offer))
            .then(() => this.peerConnection.createAnswer())
            .then((answer) => this.peerConnection.setLocalDescription(answer))
            .then(() =>
              this.onSignal({
                type: "answer",
                answer: this.peerConnection.localDescription,
              })
            );
          break;
        case "answer":
          this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          break;
        case "ice":
          this.peerConnection.addIceCandidate(
            new RTCIceCandidate(data.candidate)
          );
          break;
      }
    } catch (e) {
      console.error(`There was an error in handling a signal: ${e}`);
    }
  }

  disconnect() {
    if (this.peerConnection) {
      this.peerConnection.close();
    }
    this.peerConnection = null;
    this.peerStream = new MediaStream();
    this.pageStateManager.getComponents().peerStream.clearVideo();

    this.onSignal = null;
  }
}
