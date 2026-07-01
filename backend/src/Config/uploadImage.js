import cloudinary from "./cloudinary.js";

const uploadBuffer = (buffer, mimetype, folder) => {
  return new Promise((resolve, reject) => {
    const isVideo = mimetype.startsWith("video/");
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder || "chat_app",
        resource_type: isVideo ? "video" : "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export const uploadToCloudinary = (buffer, mimetype, folder) => {
  return uploadBuffer(buffer, mimetype, folder);
};

export const uploadProfileImage = (buffer, mimetype) => {
  return uploadBuffer(buffer, mimetype, "chat_app/profiles");
};
