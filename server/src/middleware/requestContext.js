import { randomUUID } from "node:crypto";

export function requestContext(req, res, next) {
  const incoming = req.headers["x-request-id"];
  req.requestId =
    typeof incoming === "string" && incoming.trim()
      ? incoming.trim().slice(0, 128)
      : randomUUID();

  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function safeRequestLogger(req, res, next) {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    console.log(
      `[${req.requestId}] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
}
