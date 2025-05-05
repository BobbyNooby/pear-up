import { Matchmaker } from "./matchmaking";
import { PageStateManager } from "./pageState";
import { SwarmWrapper } from "./swarm";
import crypto from "crypto";
import { VideoManager } from "./videoManager";
import { GenericMediaSelector } from "./components/base/genericMediaSelector";

export const matchmakingBufferString =
  "5aed8683c7b98175f04bfc077e5e8d9d5685f0383be178cffe4a6733a6e874fa";
export const sessionIdHexString = crypto.randomBytes(32).toString("hex");
export const iceServers = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "stun:stun.relay.metered.ca:80",
  },
  {
    urls: "turn:global.relay.metered.ca:80",
    username: "36c02e68c9f7e48a7f890b68",
    credential: "5zyAj0A8vPYN6W4i",
  },
  {
    urls: "turn:global.relay.metered.ca:80?transport=tcp",
    username: "36c02e68c9f7e48a7f890b68",
    credential: "5zyAj0A8vPYN6W4i",
  },
  {
    urls: "turn:global.relay.metered.ca:443",
    username: "36c02e68c9f7e48a7f890b68",
    credential: "5zyAj0A8vPYN6W4i",
  },
  {
    urls: "turns:global.relay.metered.ca:443?transport=tcp",
    username: "36c02e68c9f7e48a7f890b68",
    credential: "5zyAj0A8vPYN6W4i",
  },
];

const matchmaker = new Matchmaker();
const swarm = new SwarmWrapper();
const pageStateManager = new PageStateManager();
const videoManager = new VideoManager();

export async function initGlobals() {
  matchmaker.init(
    swarm,
    pageStateManager,
    videoManager,
    sessionIdHexString,
    matchmakingBufferString
  );
  swarm.init(matchmaker, pageStateManager, videoManager);
  pageStateManager.init(swarm, matchmaker, videoManager);
  videoManager.init(pageStateManager);

  // Get components first
  const components = pageStateManager.getComponents();

  // Listen for buttons events
  document
    .querySelector("#matchmake-button")
    .addEventListener(
      "click",
      components.matchMakeButton.onClick.bind(components.matchMakeButton)
    );

  document
    .querySelector("#send-button")
    .addEventListener(
      "click",
      components.sendButton.onClick.bind(components.sendButton)
    );

  await videoManager.setupLocalMedia();

  // Listen for window events
  window.addEventListener("beforeunload", async () => {
    await videoManager.disconnect();
    await swarm.leaveRoom(swarm.roomIdString);
  });

  window.addEventListener("unload", async () => {
    console.log("Cleaning up before unload...");
    await videoManager.disconnect();
    if (swarm.roomIdString) {
      await swarm.leaveRoom(swarm.roomIdString);
    }
  });


  // Populate selectors with devices
  async function populateMediaSelectors() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    pageStateManager.videoSelector.populate(devices);
    pageStateManager.audioSelector.populate(devices);

    if (videoManager.yourSettings.videoDevice) {
      pageStateManager.videoSelector.setSelected(
        videoManager.yourSettings.videoDevice
      );
    }
    if (videoManager.yourSettings.audioDevice) {
      pageStateManager.audioSelector.setSelected(
        videoManager.yourSettings.audioDevice
      );
    }

    // Set initial mute states
    pageStateManager.videoSelector.setMuted(
      videoManager.yourSettings.videoMute
    );
    pageStateManager.audioSelector.setMuted(
      videoManager.yourSettings.audioMute
    );
  }

  await populateMediaSelectors();
  
  pageStateManager.setState(pageStateManager.STATES.STOPPED);
}
