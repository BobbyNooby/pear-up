/*

    STATE MANAGEMENT

*/

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

    this.STATES = {
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

    this.setState(this.STATES.STOPPED);
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
