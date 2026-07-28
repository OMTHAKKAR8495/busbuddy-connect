import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    alertType: { type: String, enum: ["breakdown", "traffic_delay", "route_change", "other"], required: true },
    message: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Alert", alertSchema);
