import mongoose from "mongoose";


let isListenersAttached = false;

const attachConnectionListeners = () => {
  if (isListenersAttached) return;
  isListenersAttached = true;

  mongoose.connection.on("connected", () => {
    console.log("[MongoDB] Connection established successfully.");
  });

  mongoose.connection.on("error", (err) => {
    console.error("[MongoDB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[MongoDB] Connection lost. Waiting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[MongoDB] Connection re-established.");
  });
};

const connectDB = async (retries = 5, baseDelay = 1000) => {
  attachConnectionListeners();

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[MongoDB] Connecting to database (attempt ${attempt}/${retries})...`);
      await mongoose.connect(process.env.MONGO_URL);
      console.log("database is connected");
      return;
    } catch (err) {
      console.error(`[MongoDB] Connection attempt ${attempt} failed: ${err.message}`);
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[MongoDB] Retrying connection in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        console.error("[MongoDB] Maximum connection retries reached. Database unavailable.");
      }
    }
  }
};
export default connectDB;