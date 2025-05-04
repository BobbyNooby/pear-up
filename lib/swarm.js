import Hyperswarm from "hyperswarm";
import b4a from "b4a";
import { Matchmaker } from "./matchmaking";
import { PageStateManager } from "./pageState";
import { stringToBuffer } from "./utils";
import { VideoManager } from "./videoManager";

export class SwarmWrapper {
  constructor() {
    this.swarm = new Hyperswarm();
    this.roomIdString = null;

    // Lazy init prep

    /**   @type {Matchmaker} */
    this.matchmaker = null;

    /**   @type {PageStateManager} */
    this.pageStateManager = null;

    /**   @type {VideoManager} */
    this.videoManager = null;

    this.swarm.on("connection", async (peer) => {
      peer.on("data", async (data) => {
        try {
          const payload = JSON.parse(data);
          switch (payload.type) {
            case "marco":
              await this.matchmaker.sendPolo(peer);
              break;
            case "polo":
              this.matchmaker.matchmakingCandidates.push({
                peer,
                session: payload.session,
                timestamp: payload.timestamp,
                state: payload.state,
              });
              break;
            case "handshake":
              await this.matchmaker.handleHandshake(payload);
              break;
            case "chat":
              this.pageStateManager
                .getComponents()
                .chatLog.addMessage("Stranger", payload.message);
              break;
            case "bye":
              await this.matchmaker.findNew();
              break;
            case "signal":
              console.log("Signal received.");
              this.videoManager.handleSignal(payload.data);
              break;
          }
        } catch (err) {
          console.warn("Failed to parse peer message:", err);
        }
      });
    });
  }

  init(matchmaker, pageStateManager, videoManager) {
    this.matchmaker = matchmaker;
    this.pageStateManager = pageStateManager;
    this.videoManager = videoManager;
  }

  getRoomString(roomString) {
    return roomString === this.matchmaker.matchmakingBufferString
      ? "matchmaking room"
      : `room: ${roomString}.`;
  }

  async joinRoom(roomString) {
    const roomBuffer = b4a.from(roomString, "hex");
    console.log(`Connecting to ${this.getRoomString(roomString)}...`);
    const discovery = this.swarm.join(roomBuffer, {
      client: true,
      server: true,
    });
    await discovery.flushed();
    this.roomIdString = roomString;
    console.log(`Connected to ${this.getRoomString(roomString)}.`);
  }

  async leaveRoom(roomString) {
    console.log(`Leaving ${this.getRoomString(roomString)}...`);
    await this.swarm.leave(stringToBuffer(roomString));
    this.roomIdString = null;
    console.log(`Left ${this.getRoomString(roomString)}.`);
  }

  getPeers() {
    return [...this.swarm.connections];
  }

  broadcast(payload) {
    const data = JSON.stringify(payload);
    for (const peer of this.getPeers()) {
      peer.write(data);
    }
  }

  broadcastOne(peer, payload) {
    const data = JSON.stringify(payload);
    peer.write(data);
  }
}
