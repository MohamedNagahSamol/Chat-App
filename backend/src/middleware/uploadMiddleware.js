import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const imageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  const videoTypes = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
  if (imageTypes.includes(file.mimetype) || videoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (jpeg, jpg, png, gif, webp) and video files (mp4, webm, ogg, mov, avi) are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

export const uploadImage = upload.single("image");
export const uploadProfileImage = upload.single("pimage");
export const uploadMessageFile = upload.fields([
  { name: "image", maxCount: 1 },
  { name: "video", maxCount: 1 },
]);
