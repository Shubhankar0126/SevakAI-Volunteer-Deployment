import { v2 as cloudinary } from "cloudinary";
import { env, features } from "./env.js";

if (features.cloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
  });
}

export { cloudinary };
