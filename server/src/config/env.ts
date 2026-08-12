export const env = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI ?? "",
};
