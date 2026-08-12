import { User } from "../models/User.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { ConflictError, UnauthorizedError } from "../errors/HttpError.js";

function toDTO(user: { _id: { toString(): string }; email: string }) {
  return { id: user._id.toString(), email: user.email };
}

export async function signup(email: string, password: string) {
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ConflictError("Email already registered");

  const passwordHash = await hashPassword(password);
  const user = await User.create({ email: email.toLowerCase(), passwordHash });
  const token = signToken({ sub: user._id.toString(), email: user.email });
  return { user: toDTO(user), token };
}

export async function login(email: string, password: string) {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new UnauthorizedError("Invalid credentials");

  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) throw new UnauthorizedError("Invalid credentials");

  const token = signToken({ sub: user._id.toString(), email: user.email });
  return { user: toDTO(user), token };
}
