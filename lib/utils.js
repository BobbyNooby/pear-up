import b4a from "b4a";

export function stringToBuffer(string) {
  return b4a.from(string, "hex");
}

export function bufferToString(buffer) {
  return b4a.toString(buffer, "hex");
}


