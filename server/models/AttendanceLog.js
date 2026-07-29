import mongoose from "mongoose";

const attendanceLogSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    routeId: { type: mongoose.Schema.Types.ObjectId, ref: "Route", required: true },
    stopId: { type: mongoose.Schema.Types.ObjectId, ref: "Stop", required: true },
    scanTime: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceLog", attendanceLogSchema);
