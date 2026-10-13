import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { User } from "../models/User.js";
import { RefreshSession } from "../models/RefreshSession.js";
import { ReminderSetting } from "../models/ReminderSetting.js";
import { ApiError } from "../utils/ApiError.js";
import { normalizeEmail } from "../utils/normalizeEmail.js";
import { generateOpaqueToken, hashToken } from "../utils/hash.js";
import { signAccessToken } from "../utils/tokens.js";
import { toPublicUser } from "../utils/userProfile.js";

const BCRYPT_ROUNDS = 12;

function getRefreshExpiryDate(days) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
}

function isDuplicateKeyError(error) {
  return error?.code === 11000;
}

export async function registerUser(
  { name, email, password },
  { refreshTokenExpiresInDays }
) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  let user;

  try {
    user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      preferredLanguage: "en",
      timezone: "Asia/Kolkata",
    });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throw new ApiError(409, "EMAIL_ALREADY_EXISTS", "Email is already registered.");
    }
    throw error;
  }

  await ReminderSetting.create({ userId: user._id });

  const session = await createRefreshSession(user._id, {
    refreshTokenExpiresInDays,
  });

  return {
    user,
    refreshToken: session.refreshToken,
    csrfToken: session.csrfToken,
  };
}

export async function loginUser(
  { email, password },
  { refreshTokenExpiresInDays }
) {
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+passwordHash"
  );

  if (!user || !user.isActive) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password."
    );
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Invalid email or password."
    );
  }

  const session = await createRefreshSession(user._id, {
    refreshTokenExpiresInDays,
  });

  return {
    user,
    refreshToken: session.refreshToken,
    csrfToken: session.csrfToken,
  };
}

async function createRefreshSession(userId, { refreshTokenExpiresInDays }) {
  const refreshToken = generateOpaqueToken();
  const csrfToken = generateOpaqueToken();
  const familyId = randomUUID();
  const tokenHash = hashToken(refreshToken);

  await RefreshSession.create({
    userId,
    tokenHash,
    familyId,
    expiresAt: getRefreshExpiryDate(refreshTokenExpiresInDays),
  });

  return { refreshToken, csrfToken, familyId };
}

export async function refreshAuthSession(
  refreshToken,
  { refreshTokenExpiresInDays }
) {
  const tokenHash = hashToken(refreshToken);
  const existingSession = await RefreshSession.findOne({ tokenHash });

  if (!existingSession) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Authentication required.");
  }

  if (existingSession.revokedAt) {
    await RefreshSession.updateMany(
      { familyId: existingSession.familyId },
      { $set: { revokedAt: new Date() } }
    );
    throw new ApiError(401, "REFRESH_TOKEN_REUSE", "Authentication required.");
  }

  if (existingSession.expiresAt.getTime() <= Date.now()) {
    existingSession.revokedAt = new Date();
    await existingSession.save();
    throw new ApiError(401, "REFRESH_TOKEN_EXPIRED", "Authentication required.");
  }

  const user = await User.findById(existingSession.userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, "INVALID_REFRESH_TOKEN", "Authentication required.");
  }

  const newRefreshToken = generateOpaqueToken();
  const newCsrfToken = generateOpaqueToken();
  const newTokenHash = hashToken(newRefreshToken);

  existingSession.revokedAt = new Date();
  existingSession.replacedByTokenHash = newTokenHash;
  await existingSession.save();

  await RefreshSession.create({
    userId: user._id,
    tokenHash: newTokenHash,
    familyId: existingSession.familyId,
    expiresAt: getRefreshExpiryDate(refreshTokenExpiresInDays),
  });

  return {
    user,
    refreshToken: newRefreshToken,
    csrfToken: newCsrfToken,
  };
}

export async function logoutUser(refreshToken) {
  if (!refreshToken) {
    return;
  }

  const tokenHash = hashToken(refreshToken);
  const session = await RefreshSession.findOne({ tokenHash });

  if (!session) {
    return;
  }

  await RefreshSession.updateMany(
    { familyId: session.familyId },
    { $set: { revokedAt: new Date() } }
  );
}

export function buildAuthResponse(user, config) {
  const accessToken = signAccessToken(
    { userId: user._id.toString() },
    {
      secret: config.jwtSecret,
      expiresIn: config.jwtExpiresIn,
      issuer: config.jwtIssuer,
      audience: config.jwtAudience,
    }
  );

  return {
    user: toPublicUser(user),
    accessToken,
    expiresIn: config.jwtExpiresIn,
  };
}

export async function getUserById(userId) {
  const user = await User.findById(userId);

  if (!user || !user.isActive) {
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
  }

  return user;
}
