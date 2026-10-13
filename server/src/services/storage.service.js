import fs from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

function normalizeStorageKey(storageKey) {
  const normalized = String(storageKey).replace(/\\/g, "/");

  if (
    !normalized ||
    normalized.includes("..") ||
    normalized.startsWith("/") ||
    normalized.includes("\0")
  ) {
    throw new Error("Invalid storage key.");
  }

  return normalized;
}

export function createStorageService(config) {
  const rootDir = path.resolve(config.uploadDir);
  const tempDir = path.join(rootDir, "tmp");

  async function ensureDirectories() {
    await fs.mkdir(rootDir, { recursive: true });
    await fs.mkdir(tempDir, { recursive: true });
  }

  function resolveAbsolutePath(storageKey) {
    const safeKey = normalizeStorageKey(storageKey);
    const absolutePath = path.resolve(rootDir, safeKey);

    if (!absolutePath.startsWith(rootDir)) {
      throw new Error("Path traversal blocked.");
    }

    return absolutePath;
  }

  function generateStorageKey(userId) {
    const randomPart = randomBytes(24).toString("hex");
    return `users/${userId}/${randomPart}`;
  }

  async function saveBuffer(buffer, storageKey) {
    await ensureDirectories();
    const absolutePath = resolveAbsolutePath(storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.writeFile(absolutePath, buffer);
    return storageKey;
  }

  async function moveTempFile(tempPath, storageKey) {
    await ensureDirectories();
    const absolutePath = resolveAbsolutePath(storageKey);
    await fs.mkdir(path.dirname(absolutePath), { recursive: true });
    await fs.rename(tempPath, absolutePath);
    return storageKey;
  }

  async function deleteObject(storageKey) {
    try {
      const absolutePath = resolveAbsolutePath(storageKey);
      await fs.unlink(absolutePath);
      return { deleted: true };
    } catch (error) {
      if (error?.code === "ENOENT") {
        return { deleted: false, reason: "not_found" };
      }

      return { deleted: false, reason: error.message };
    }
  }

  function createReadStreamForKey(storageKey) {
    const absolutePath = resolveAbsolutePath(storageKey);
    return createReadStream(absolutePath);
  }

  async function readBuffer(storageKey) {
    const absolutePath = resolveAbsolutePath(storageKey);
    return fs.readFile(absolutePath);
  }

  async function exists(storageKey) {
    try {
      const absolutePath = resolveAbsolutePath(storageKey);
      await fs.access(absolutePath);
      return true;
    } catch {
      return false;
    }
  }

  function getTempDir() {
    return tempDir;
  }

  return {
    rootDir,
    getTempDir,
    generateStorageKey,
    saveBuffer,
    moveTempFile,
    deleteObject,
    createReadStreamForKey,
    readBuffer,
    exists,
    resolveAbsolutePath,
  };
}
