import cloud from "cloudinary";
const cloudinary = cloud.v2;

cloudinary.config({
  cloud_name: process.env.cloud_Name,
  api_key: process.env.API_key,
  api_secret: process.env.API_secret,
});

export default cloudinary;  
