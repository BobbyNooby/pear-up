/*

    STATE MANAGEMENT

*/

import { GenericMediaSelector } from "./components/base/genericMediaSelector";
import { GenericVideo } from "./components/base/genericVideo";
import { ChatLog } from "./components/chatLog";
import { ChatTextArea } from "./components/chatTextArea";
import { MatchMakeButton } from "./components/matchmakeButton";
import { SendButton } from "./components/sendButton";
import { YourStream } from "./components/yourStream";
import { Matchmaker } from "./matchmaking";
import { SwarmWrapper } from "./swarm";
import { VideoManager } from "./videoManager";

export class PageStateManager {
  constructor() {
    /** @type {SwarmWrapper} */
    this.swarm = null;

    /** @type {Matchmaker} */
    this.matchmaker = null;

    /** @type {VideoManager} */
    this.videoManager = null;

    /** @type {GenericMediaSelector} */
    this.videoSelector = null;

    /** @type {GenericMediaSelector} */
    this.audioSelector = null;

    this.STATES = {
      SETTING_UP: "SETTING_UP",
      STOPPED: "STOPPED",
      CONNECTING_TO_MATCHMAKING: "CONNECTING_TO_MATCHMAKING",
      CONNECTING_TO_ROOM: "CONNECTING_TO_ROOM",
      SEARCHING_FOR_PEER: "SEARCHING",
      DISCONNECTING_FROM_ROOM: "DISCONNECTING_FROM_ROOM",
      DISCONNECTING_FROM_MATCHMAKING: "DISCONNECTING_FROM_MATCHMAKING",
      MATCHED: "MATCHED",
    };
  }

  init(swarm, matchmaker, videoManager) {
    this.swarm = swarm;
    this.matchmaker = matchmaker;
    this.videoManager = videoManager;

    this.components = {
      matchMakeButton: new MatchMakeButton(this),
      sendButton: new SendButton(this),
      chatInput: new ChatTextArea(this),
      chatLog: new ChatLog(this),
      yourStream: new YourStream(this),
      peerStream: new GenericVideo("peer-stream", this),
    };

    this.videoSelector = new GenericMediaSelector(
      "video-media-selector",
      this,
      "videoinput",
      (devideId) => {
        console.log("Changing video device:", devideId);
        this.videoManager.changeVideoInput(devideId);
      },
      () => {
        console.log("Toggling video");
        this.videoManager.toggleMuteVideo().then(() => {
          this.videoSelector.setMuted(this.videoManager.yourSettings.videoMute);
        });
      },
      "../assets/video-on-fill.svg",
      "../assets/video-off-line.svg",
      "../assets/video-on-line.svg"
    );

    this.audioSelector = new GenericMediaSelector(
      "audio-media-selector",
      this,
      "audioinput",
      (devideId) => {
        console.log("Changing audio device:", devideId);
        this.videoManager.changeAudioInput(devideId);
      },
      () => {
        console.log("Toggling audio");
        this.videoManager.toggleMuteAudio().then(() => {
          this.audioSelector.setMuted(this.videoManager.yourSettings.audioMute);
        });
      },
      "../assets/mic-fill.svg",
      "../assets/mic-off-line.svg",
      "../assets/mic-line.svg"
    );

    this.setState(this.STATES.SETTING_UP);
  }

  getComponents() {
    return this.components;
  }

  getState() {
    return this.state;
  }

  setState(state) {
    this.state = state;
    for (const key in this.components) {
      this.components[key].setState(this.state);
    }
  }
}
