import mongoose from "mongoose";

const busPassSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    pickupStopId: { type: mongoose.Schema.Types.ObjectId, ref: "Stop", default: null },
    status: { type: String, enum: ["pending", "active", "expired", "rejected"], default: "pending" },
    feePaid: { type: Boolean, default: false },
    secret: { type: String, default: () => Math.random().toString(36).substring(2, 10) },
    validFrom: { type: String, default: "2026-07-01" },
    validUntil: { type: String, default: "2026-12-31" },
  },
  { timestamps: true }
);

export default mongoose.model("BusPass", busPassSchema);
