import mongoose from "mongoose";

const stopSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    name: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    stopOrder: { type: Number, required: true },
    scheduledTime: { type: String, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Stop", stopSchema);
