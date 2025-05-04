import { Matchmaker } from "./matchmaking";
import { PageStateManager } from "./pageState";
import { SwarmWrapper } from "./swarm";
import crypto from "crypto";
import { VideoManager } from "./videoManager";

export const matchmakingBufferString =
  "5aed8683c7b98175f04bfc077e5e8d9d5685f0383be178cffe4a6733a6e874fa";
export const sessionIdHexString = crypto.randomBytes(32).toString("hex");

export const iceServers = [{ urls: "stun:stun.l.google.com:19302" }];

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

  // Use bound methods for event listeners
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
}
