import { PageStateManager } from "./pageState";
import { SwarmWrapper } from "./swarm";
import crypto from "crypto";
import { VideoManager } from "./videoManager";

export class Matchmaker {
  constructor() {
    this.timestamp = Date.now();
    this.matchmakingCandidates = [];

    // Lazy inject prep

    /**   @type {PageStateManager} **/
    this.pageStateManager = null;

    /**   @type {SwarmWrapper} **/
    this.swarm = null;

    /**   @type {VideoManager} **/
    this.videoManager = null;

    /**   @type {string} **/
    this.sessionIdHexString = null;

    /**   @type {string} **/
    this.matchmakingBufferString = null;
  }

  init(
    swarm,
    pageStateManager,
    videoManager,
    sessionIdHexString,
    matchmakingBufferString
  ) {
    this.swarm = swarm;
    this.pageStateManager = pageStateManager;
    this.videoManager = videoManager;
    this.sessionIdHexString = sessionIdHexString;
    this.matchmakingBufferString = matchmakingBufferString;
  }

  async stopMatchMaking() {
    if (
      this.pageStateManager.getState() !==
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    )
      return;
    console.log("Stopping matchmaking...");
    this.pageStateManager.setState(
      this.pageStateManager.STATES.DISCONNECTING_FROM_MATCHMAKING
    );
    await this.swarm.leaveRoom(this.matchmakingBufferString);
    this.pageStateManager.setState(this.pageStateManager.STATES.STOPPED);
  }

  async findNew() {
    if (
      this.pageStateManager.getState() !== this.pageStateManager.STATES.MATCHED
    )
      return;
    this.pageStateManager.setState(
      this.pageStateManager.STATES.DISCONNECTING_FROM_ROOM
    );
    this.swarm.broadcast({ type: "bye" });
    this.videoManager.disconnect();
    await this.swarm.leaveRoom(this.swarm.roomIdString);
    await this.startMatchmaking();
  }

  async startMatchmaking() {
    if (
      ![
        this.pageStateManager.STATES.DISCONNECTING_FROM_ROOM,
        this.pageStateManager.STATES.STOPPED,
      ].includes(this.pageStateManager.getState())
    )
      return;

    console.log("Attempting to join matchmaking swarm...");
    this.pageStateManager.setState(
      this.pageStateManager.STATES.CONNECTING_TO_MATCHMAKING
    );

    this.timestamp = Date.now();
    this.matchmakingCandidates = [];

    await this.swarm.joinRoom(this.matchmakingBufferString);
    this.pageStateManager.setState(
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    );
    await this.sendMarco();
  }

  async sendMarco() {
    if (
      this.pageStateManager.getState() !==
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    )
      return;

    this.matchmakingCandidates = [];
    const payload = { type: "marco" };
    this.swarm.broadcast(payload);
    setTimeout(() => this.matchmake(), 2000);
  }

  async sendPolo(peer) {
    if (
      this.pageStateManager.getState() !==
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    )
      return;

    const payload = {
      type: "polo",
      session: this.sessionIdHexString,
      state: this.pageStateManager.getState(),
      timestamp: this.timestamp,
    };
    this.swarm.broadcastOne(peer, payload);
  }

  async matchmake() {
    if (
      this.pageStateManager.getState() !==
      this.pageStateManager.STATES.SEARCHING_FOR_PEER
    )
      return;

    console.log("Attempting to matchmake...");
    const all = [
      {
        peer: null,
        session: this.sessionIdHexString,
        state: this.pageStateManager.getState(),
        timestamp: this.timestamp,
      },
      ...this.matchmakingCandidates,
    ];

    all.sort(
      (a, b) => a.timestamp - b.timestamp || a.session.localeCompare(b.session)
    );
    const earliest = all[0];

    if (earliest.session === this.sessionIdHexString) {
      const others = all.slice(1);
      if (others.length === 0) {
        console.log("No peers found. Retrying...");
        await this.sendMarco();
        return;
      }

      const choice = others[Math.floor(Math.random() * others.length)];
      const roomIdString = crypto.randomBytes(32).toString("hex");

      this.pageStateManager.setState(
        this.pageStateManager.STATES.CONNECTING_TO_ROOM
      );
      await this.sendHandshake(choice.peer, roomIdString);
      await this.swarm.leaveRoom(this.matchmakingBufferString);
      await this.swarm.joinRoom(roomIdString);
      await this.videoManager.createConnection(true, (signal) => {
        this.swarm.broadcast({ type: "signal", data: signal });
      });
      this.pageStateManager.setState(this.pageStateManager.STATES.MATCHED);
    } else {
      console.log("Not earliest; awaiting handshake...");
      await this.sendMarco();
    }
  }

  async sendHandshake(peer, roomIdString) {
    console.log("Sending handshake...");
    const payload = {
      type: "handshake",
      roomId: roomIdString,
    };
    this.swarm.broadcastOne(peer, payload);
  }

  async handleHandshake(payload) {
    console.log("Handshake received.");
    await this.swarm.leaveRoom(this.matchmakingBufferString);
    this.pageStateManager.setState(
      this.pageStateManager.STATES.CONNECTING_TO_ROOM
    );
    await this.swarm.joinRoom(payload.roomId);
    await this.videoManager.createConnection(false, (signal) => {
      this.swarm.broadcast({ type: "signal", data: signal });
    });
    this.pageStateManager.setState(this.pageStateManager.STATES.MATCHED);
  }
}
