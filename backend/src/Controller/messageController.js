import messageModule from "../Module/messageModule.js";
import authModule from "../Module/authModule.js";
import { getReceiverSocketId, io } from "../Config/socket.js";
import { uploadToCloudinary } from "../Config/uploadImage.js";

const getUser = async (req, res) => {
  try {
    const user = await authModule.find({ _id: { $ne: req.user._id } }).select("-password");
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const conversations = await messageModule.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id },
      ],
    });
    if (!conversations || conversations.length === 0) {
      return res.status(200).json({ success: true, conversations: [] });
    }
    const newConversations = conversations.map((conversation) => {
      const convObj = conversation.toObject();
      return {
        ...convObj,
        message: convObj.message || convObj.text,
      };
    });
    res.status(200).json({ success: true, conversations: newConversations });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message, text, image, video } = req.body;
    const senderId = req.user._id;
    const receiverId = req.params.userId;
    let imageUrl = image || undefined;
    let videoUrl = video || undefined;

    const imageFile = req.files?.image?.[0];
    const videoFile = req.files?.video?.[0];

    if (imageFile) {
      imageUrl = await uploadToCloudinary(imageFile.buffer, imageFile.mimetype, "chat_app/messages");
    } else if (image && image.startsWith("data:image")) {
      const buffer = Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64");
      imageUrl = await uploadToCloudinary(buffer, "image/png", "chat_app/messages");
    }

    if (videoFile) {
      videoUrl = await uploadToCloudinary(videoFile.buffer, videoFile.mimetype, "chat_app/messages");
    } else if (video && video.startsWith("data:video")) {
      const buffer = Buffer.from(video.replace(/^data:video\/\w+;base64,/, ""), "base64");
      videoUrl = await uploadToCloudinary(buffer, "video/mp4", "chat_app/messages");
    }

    const newMessage = new messageModule({
      senderId,
      receiverId,
      message: message || text,
      text: text || message,
      image: imageUrl,
      video: videoUrl,
    });
    await newMessage.save();

    // Socket.io Real-time emission
    const messageData = newMessage.toObject();
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", messageData);
    }

    res.status(200).json({ success: true, newMessage });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const seenMessage = async (req, res) => {
  try {
    const user = await authModule.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Mark all messages sent from the target user to me as seen
    await messageModule.updateMany(
      { senderId: req.params.userId, receiverId: req.user._id, seen: false },
      { $set: { seen: true } }
    );
    res.status(200).json({ success: true, message: "Messages marked as seen" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const user = await authModule.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Delete all messages between current user and target user
    await messageModule.deleteMany({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id }
      ]
    });
    res.status(200).json({ success: true, message: "Conversation deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export { getUser, getConversations, sendMessage, seenMessage, deleteMessage };

