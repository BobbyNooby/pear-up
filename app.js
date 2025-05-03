import { onMatchmakingButtonClick, onSendButtonClick } from "./lib/swarm";

const { teardown } = Pear;

teardown(() => swarm.destroy());
Pear.updates(() => Pear.reload());

document
  .querySelector("#matchmake-button")
  .addEventListener("click", onMatchmakingButtonClick);

document
  .querySelector("#send-button")
  .addEventListener("click", onSendButtonClick);
