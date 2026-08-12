const DEV_JWT_SECRET = "dev-secret-change-me";

const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET ?? DEV_JWT_SECRET;
const isDevLike = nodeEnv === "development" || nodeEnv === "test";

if (!isDevLike && (!process.env.JWT_SECRET || jwtSecret === DEV_JWT_SECRET)) {
  throw new Error(
    "JWT_SECRET must be set to a secure value in non-development environments",
  );
}

export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv,
  mongoUri: process.env.MONGO_URI ?? "",
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "15d",
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 10,
};
