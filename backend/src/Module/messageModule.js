import mongoose from "mongoose";

const messageSchema = mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String },
    message: { type: String },
    image: { type: String },
    video: { type: String },
    seen: { type: Boolean, default: false },
  },
  { timestamps: true },
);


const messageModule = mongoose.models.Message || mongoose.model("Message", messageSchema);
export default messageModule;
