/** @typedef {import('pear-interface')} */

/* global Pear */
import Hyperswarm from "hyperswarm";
import b4a from "b4a";
import crypto from "hypercore-crypto";

const { teardown, updates } = Pear;
const swarm = new Hyperswarm();

const matchmakingBufferString =
  "5aed8683c7b98175f04bfc077e5e8d9d5685f0383be178cffe4a6733a6e874fa";
const matchmakingBuffer = b4a.from(matchmakingBufferString, "hex");

// "menu", "searching", "matched"
let state = "menu";

let sessionIdHexString = crypto.randomBytes(32).toString("hex");
let timestamp = 0;

let matchmakingCandidates = [];

// Unannounce the public key before exiting the process
teardown(() => swarm.destroy());

// Enable automatic reloading for the app
Pear.updates(() => Pear.reload());

// Handle incoming connections and messages
swarm.on("connection", async (peer) => {
  peer.on("data", async (data) => {
    try {
      const payload = JSON.parse(data);

      // If its a marco, respond with polo
      if (payload.type === "marco") {
        await onMarco(peer);
      }

      // Update matchmaking candidates upon polo
      if (payload.type === "polo") {
        matchmakingCandidates.push({
          peer,
          session: payload.session,
          timestamp: payload.timestamp,
          state: payload.state,
        });
      }

      // Handle handshake when received
      if (payload.type === "handshake") {
        await onReceiveHandshake(payload);
      }
    } catch (err) {
      console.warn("Failed to parse peer message:", err);
    }
  });
});

document
  .querySelector("#matchmake")
  .addEventListener("click", startMatchmaking);

export async function startMatchmaking() {
  console.log("Attempting to join matchmaking swarm...");
  state = "searching";
  timestamp = Date.now();
  matchmakingCandidates = [];

  await connectToRoom(matchmakingBufferString);

  await sendMarco();
}

async function sendMarco() {
  // Reset peer list and matchmake every 5 seconds
  if (state !== "searching") return;

  matchmakingCandidates = [];

  const payload = {
    type: "marco",
  };

  console.log("Updating peers...");
  broadcast(payload);
  setTimeout(matchmake, 2000);
}

async function onMarco(peer) {
  await sendPolo(peer);
}

async function sendPolo(peer) {
  if (state !== "searching") return;

  console.log(peer);

  const payload = {
    type: "polo",
    session: sessionIdHexString,
    state: state,
    timestamp: timestamp,
  };

  await broadcastOne(peer, payload);
}

async function broadcast(payload) {
  const payloadString = JSON.stringify(payload);
  // console.log(`Broadcasting ${payloadString} to all peers...`);
  for (const peer of [...swarm.connections]) {
    peer.write(payloadString);
  }
}

async function broadcastOne(peer, payload) {
  const payloadString = JSON.stringify(payload);
  // console.log(`Broadcasting ${payloadString} to one peer...`);
  peer.write(payloadString);
}

async function matchmake() {
  if (state !== "searching") return;
  console.log("Attempting to matchmake...");

  // Include self in candidate list for comparison
  const all = [
    {
      peer: null,
      session: sessionIdHexString,
      state: state,
      timestamp: timestamp,
    },
    ...matchmakingCandidates,
  ];

  // Sort by timestamp then session
  all.sort(
    (a, b) => a.timestamp - b.timestamp || a.session.localeCompare(b.session)
  );
  const earliest = all[0];

  if (earliest.session === sessionIdHexString) {
    // If im earliest look for a peer to connect to
    const others = all.slice(1);
    if (others.length === 0) {
      // No peers found, try again.
      console.log("No peers found. Continue searching...");
      await sendMarco();
      return;
    }

    // Randomly select a peer from the list
    const choice = others[Math.floor(Math.random() * others.length)];
    const roomIdString = crypto.randomBytes(32).toString("hex");

    state = "matched";
    console.log("Initiating handshake to", choice.session);
    await sendHandshake(choice.peer, roomIdString);
    await leaveMatchmakingSwarm();
    await connectToRoom(roomIdString);
  } else {
    // If im not earliest, wait for a handshake to come to me
    console.log("Not earliest; awaiting handshake...");
    await sendMarco();
    return;
  }
}

async function sendHandshake(peer, roomIdString) {
  const payload = {
    type: "handshake",
    roomId: roomIdString,
  };

  broadcastOne(peer, payload);
}

async function onReceiveHandshake(payload) {
  console.log("Receiving handshake...");
  state = "matched";
  await leaveMatchmakingSwarm();
  await connectToRoom(payload.roomId);
}

async function leaveMatchmakingSwarm() {
  console.log("Leaving matchmaking swarm...");
  await swarm.leave(matchmakingBuffer);
}

async function connectToRoom(roomId) {
  const roomBuffer = b4a.from(roomId, "hex");

  console.log(
    `Connecting to ${
      roomId === matchmakingBufferString ? "matchmaking room" : roomId
    }...`
  );
  const discovery = swarm.join(roomBuffer, { client: true, server: true });
  await discovery.flushed();
  console.log(
    `Connected to ${
      roomId === matchmakingBufferString ? "matchmaking room" : roomId
    }.`
  );
}
