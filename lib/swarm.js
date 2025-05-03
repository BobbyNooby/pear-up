import Hyperswarm from "hyperswarm";
import b4a from "b4a";
import crypto from "hypercore-crypto";
import {
  States,
  setState,
  getState,
  appendChat,
  initializeChat,
} from "./pageState";

/*

  Globals

*/

const swarm = new Hyperswarm();
const matchmakingBufferString =
  "5aed8683c7b98175f04bfc077e5e8d9d5685f0383be178cffe4a6733a6e874fa";
const matchmakingBuffer = b4a.from(matchmakingBufferString, "hex");
let sessionIdHexString = crypto.randomBytes(32).toString("hex");

let timestamp = Date.now();
let matchmakingCandidates = [];

/*

  Button Handlers

*/

export async function onSendButtonClick() {
  const textArea = document.getElementById("chat-textarea");
  const message = textArea.value;
  await broadcast({
    type: "chat",
    message: message,
    author: sessionIdHexString,
  });
  appendChat("You", message);
  textArea.value = "";
}

export function onMatchmakingButtonClick() {
  console.log(getState());
  if (getState() === States.SEARCHING) {
    stopMatchmaking();
  } else {
    startMatchmaking();
  }
}

/*

  Listeners

*/

swarm.on("connection", async (peer) => {
  peer.on("data", async (data) => {
    try {
      const payload = JSON.parse(data);

      switch (payload.type) {
        case "marco":
          await sendPolo(peer);
          break;
        case "polo":
          matchmakingCandidates.push({
            peer,
            session: payload.session,
            timestamp: payload.timestamp,
            state: payload.state,
          });
          break;
        case "handshake":
          await handleHandshake(payload);
          break;
        case "chat":
          appendChat("Stranger", payload.message);
          break;
      }
    } catch (err) {
      console.warn("Failed to parse peer message:", err);
    }
  });
});

/*

  Matchmaking Logic

*/

async function stopMatchmaking() {
  console.log("Stopping matchmaking...");
  setState(States.CONNECTING);
  await leaveMatchmakingSwarm();
  setState(States.STOPPED);
}

export async function startMatchmaking() {
  console.log("Attempting to join matchmaking swarm...");
  setState(States.CONNECTING);
  timestamp = Date.now();
  matchmakingCandidates = [];

  await connectToRoom(matchmakingBufferString);
  setState(States.SEARCHING);
  await sendMarco();
}

async function sendMarco() {
  if (getState() !== States.SEARCHING) return;

  matchmakingCandidates = [];

  const payload = { type: "marco" };
  broadcast(payload);

  setTimeout(matchmake, 2000);
}

async function sendPolo(peer) {
  if (getState() !== States.SEARCHING) return;

  const payload = {
    type: "polo",
    session: sessionIdHexString,
    state: getState(),
    timestamp,
  };

  broadcastOne(peer, payload);
}

async function broadcast(payload) {
  const payloadString = JSON.stringify(payload);
  for (const peer of [...swarm.connections]) {
    peer.write(payloadString);
  }
}

async function broadcastOne(peer, payload) {
  peer.write(JSON.stringify(payload));
}

async function matchmake() {
  if (getState() !== States.SEARCHING) return;

  console.log("Attempting to matchmake...");

  const all = [
    { peer: null, session: sessionIdHexString, state: getState(), timestamp },
    ...matchmakingCandidates,
  ];

  all.sort(
    (a, b) => a.timestamp - b.timestamp || a.session.localeCompare(b.session)
  );
  const earliest = all[0];

  if (earliest.session === sessionIdHexString) {
    const others = all.slice(1);
    if (others.length === 0) {
      console.log("No peers found. Retrying...");
      await sendMarco();
      return;
    }

    const choice = others[Math.floor(Math.random() * others.length)];
    const roomIdString = crypto.randomBytes(32).toString("hex");

    setState(States.CONNECTING);
    await sendHandshake(choice.peer, roomIdString);
    await leaveMatchmakingSwarm();
    await connectToRoom(roomIdString);
    setState(States.MATCHED);
    initializeChat();
  } else {
    console.log("Not earliest; awaiting handshake...");
    await sendMarco();
  }
}

async function sendHandshake(peer, roomIdString) {
  const payload = {
    type: "handshake",
    roomId: roomIdString,
  };

  broadcastOne(peer, payload);
}

async function handleHandshake(payload) {
  console.log("Handshake received.");
  await leaveMatchmakingSwarm();
  setState(States.CONNECTING);
  await connectToRoom(payload.roomId);
  setState(States.MATCHED);
  initializeChat();
}

async function leaveMatchmakingSwarm() {
  console.log("Leaving matchmaking swarm...");
  await swarm.leave(matchmakingBuffer);
}

async function connectToRoom(roomId) {
  const roomBuffer = b4a.from(roomId, "hex");
  console.log(
    `Connecting to room ${
      roomId === matchmakingBufferString ? "matchmaking" : roomId
    }...`
  );
  const discovery = swarm.join(roomBuffer, { client: true, server: true });
  await discovery.flushed();

  console.log(
    `Connected to room ${
      roomId === matchmakingBufferString ? "for matchmaking" : roomId
    }.`
  );
}
