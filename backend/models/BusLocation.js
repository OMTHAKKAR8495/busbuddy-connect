import mongoose from "mongoose";

const busLocationSchema = new mongoose.Schema(
  {
    busId: { type: mongoose.Schema.Types.ObjectId, ref: "Bus", required: true },
    tripId: { type: String, default: null },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    speed: { type: Number, default: 0 }, // km/h
    heading: { type: Number, default: 0 },
    recordedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

busLocationSchema.index({ busId: 1, recordedAt: -1 });

export default mongoose.model("BusLocation", busLocationSchema);
