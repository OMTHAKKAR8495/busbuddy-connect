import mongoose from "mongoose";

const busSchema = new mongoose.Schema(
  {
    busNumber: { type: String, required: true },
    plate: { type: String, required: true },
    capacity: { type: Number, default: 40 },
    active: { type: Boolean, default: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", default: null },
  },
  { timestamps: true }
);

export default mongoose.model("Bus", busSchema);
