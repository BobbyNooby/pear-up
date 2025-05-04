import { initGlobals } from "./lib/globals";

const { teardown } = Pear;

teardown(() => swarm.destroy());
Pear.updates(() => Pear.reload());

initGlobals();
