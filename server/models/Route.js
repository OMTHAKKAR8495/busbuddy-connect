import mongoose from "mongoose";

const routeSchema = new mongoose.Schema(
  {
    routeNumber: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    polyline: { type: [[Number]], default: [] }, // [[lat, lng], [lat, lng]]
    departureTime: { type: String, default: "07:30 AM" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Route", routeSchema);
