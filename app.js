import { initGlobals } from "./lib/globals";

const { teardown } = Pear;

Pear.teardown(() => swarm.destroy());
Pear.updates(() => Pear.reload());

initGlobals();
