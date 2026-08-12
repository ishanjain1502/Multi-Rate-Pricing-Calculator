import { Schema, model, type InferSchemaType, type Types } from "mongoose";

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export type IUser = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const User = model("User", userSchema);
