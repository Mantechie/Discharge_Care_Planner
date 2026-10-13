import jwt from "jsonwebtoken";

export function signAccessToken(
  { userId },
  { secret, expiresIn, issuer, audience }
) {
  return jwt.sign({ sub: userId }, secret, {
    expiresIn,
    issuer,
    audience,
  });
}

export function verifyAccessToken(token, { secret, issuer, audience }) {
  return jwt.verify(token, secret, {
    issuer,
    audience,
  });
}
