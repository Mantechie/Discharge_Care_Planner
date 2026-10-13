import { createHash, randomBytes } from "node:crypto";

export function generateOpaqueToken() {
  return randomBytes(48).toString("base64url");
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}
