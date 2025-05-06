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
    this.remoteDescriptionSet = false;
    this.pendingCandidates = [];

    this.yourSettings = {
      videoDevice: false,
      audioDevice: false,
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
              this.yourSettings.videoDevice = videoDevice.deviceId;
              this.yourSettings.audioDevice = audioDevice.deviceId;
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
          this.yourSettings.videoDevice = videoDevice.deviceId;
          this.yourSettings.audioDevice = false;
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
      this.yourSettings.videoDevice = false;
      this.yourSettings.audioDevice = false;
      this.pageStateManager.getComponents().yourStream.clearVideo();
      return false;
    } catch (e) {
      console.error(`There was an error in setting up local media: ${e}`);
      return false;
    }
  }

  async getLocalMedia(videoDeviceId, audioDeviceId) {
    try {
      const constraints = {
        video: videoDeviceId !== null ? { deviceId: videoDeviceId } : false,
        audio: audioDeviceId !== null ? { deviceId: audioDeviceId } : false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log(`Got media: V : ${!!videoDeviceId}, A : ${!!audioDeviceId}`);
      return stream;
    } catch (e) {
      console.error(`Failed to get media: ${e}`);
      return null;
    }
  }

  async createConnection(isInitiator, sendSignal) {
    this.disconnect();
    this.isInitiator = isInitiator;
    this.onSignal = sendSignal;
    this.peerConnection = new RTCPeerConnection({
      iceServers: iceServers,
    });

    this.peerConnection.onicegatheringstatechange = () => {
      console.log("ICE gathering state:", this.peerConnection.iceGatheringState);
    };
    
    this.peerConnection.oniceconnectionstatechange = () => {
      console.log("ICE connection state:", this.peerConnection.iceConnectionState);
    };

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
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        this.onSignal({
          type: "offer",
          offer: this.peerConnection.localDescription,
        });
      } catch (e) {
        console.error(`There was an error in creating an offer: ${e}`);
      }
    }

  this.peerConnection.onconnectionstatechange = async () => {
      let peerState = "";

      switch (this.peerConnection.connectionState) {
        case "connected":
          peerState = "Connected";
          break;
        case "disconnected":
          peerState = "Disconnected";
          await this.pageStateManager.matchmaker.findNew();
          break;
        case "failed":
          peerState = "Failed";
          await this.pageStateManager.matchmaker.findNew();
          break;
        case "closed":
          peerState = "Closed";
          await this.pageStateManager.matchmaker.findNew();
          break;
      }

      console.log(peerState);
    };
  }

  async handleSignal(data) {
    if (!this.peerConnection) return;
  
    try {
      switch (data.type) {
        case "offer":
          // Set remote description…
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.offer)
          );
          // 2) Now we’re “ready” to add ICE candidates:
          this.remoteDescriptionSet = true;
  
          // ─── FLUSH QUEUED CANDIDATES HERE ───
          for (const candidate of this.pendingCandidates) {
            console.log("🔵 Flushing queued candidate:", candidate);
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          this.pendingCandidates = [];
          // ─────────────────────────────────────
  
          // 3) Create & send answer
          const answer = await this.peerConnection.createAnswer();
          await this.peerConnection.setLocalDescription(answer);
          this.onSignal({
            type: "answer",
            answer: this.peerConnection.localDescription,
          });
          break;
  
        case "answer":
          // 1) Set remote description…
          await this.peerConnection.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          // 2) Mark ready and flush again:
          this.remoteDescriptionSet = true;
  
          // ─── FLUSH QUEUED CANDIDATES HERE ───
          for (const candidate of this.pendingCandidates) {
            console.log("🔵 Flushing queued candidate:", candidate);
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(candidate)
            );
          }
          this.pendingCandidates = [];
          // ─────────────────────────────────────
          break;
  
        case "ice":
          if (this.remoteDescriptionSet) {
            console.log("🟢 Adding ICE candidate directly:", data.candidate);
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(data.candidate)
            );
          } else {
            console.log("🟡 Queueing ICE candidate:", data.candidate);
            this.pendingCandidates.push(data.candidate);
          }
          break;
      }
    } catch (e) {
      console.error("Error in handleSignal:", e);
    }
  }

  async changeVideoInput(deviceId) {
    if (!this.yourStream) return;
    this.yourSettings.videoDevice = deviceId;
    await this.updateLocalMedia();
  }

  async changeAudioInput(deviceId) {
    if (!this.yourStream) return;
    this.yourSettings.audioDevice = deviceId;
    await this.updateLocalMedia();
  }
  async toggleMuteVideo() {
    this.yourSettings.videoMute = !this.yourSettings.videoMute;
    await this.updateLocalMedia();
  }
  async toggleMuteAudio() {
    this.yourSettings.audioMute = !this.yourSettings.audioMute;
    await this.updateLocalMedia();
  }

  async updateLocalMedia() {
    const { videoDevice, audioDevice, videoMute, audioMute } =
      this.yourSettings;
    console.log("Updating local media with settings:", this.yourSettings);

    const newStream = await this.getLocalMedia(videoDevice, audioDevice);

    if (!newStream) return;

    if (this.yourStream) {
      this.yourStream.getTracks().forEach((track) => track.stop());
    }

    // Apply mute settings to new tracks
    newStream.getVideoTracks().forEach((track) => {
      track.enabled = !videoMute;
    });
    newStream.getAudioTracks().forEach((track) => {
      track.enabled = !audioMute;
    });

    this.yourStream = newStream;
    this.pageStateManager.getComponents().yourStream.setVideo(this.yourStream);

    if (this.peerConnection) {
      console.log("Sending new stream to peer connection");
      if (this.peerConnection) {
        console.log("Updating peer connection senders...");

        // Replace video track
        const newVideoTrack = newStream.getVideoTracks()[0];
        const videoSender = this.peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (videoSender && newVideoTrack) {
          await videoSender.replaceTrack(newVideoTrack);
        }

        // Replace audio track
        const newAudioTrack = newStream.getAudioTracks()[0];
        const audioSender = this.peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "audio");
        if (audioSender && newAudioTrack) {
          await audioSender.replaceTrack(newAudioTrack);
        }
      }
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
