import mongoose, { Schema } from "mongoose";

const groupSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      index: true,
    },

    event: {
      type: Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    publicKey: {
      type: String,
      required: true,
      unique: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    isLive: {
      type: Boolean,
      default: false,
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Group ||
  mongoose.model("Group", groupSchema);
