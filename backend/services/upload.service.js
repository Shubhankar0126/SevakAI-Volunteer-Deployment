import { Readable } from "node:stream";
import { ApiError } from "../utils/api-error.js";
import { cloudinary } from "../config/cloudinary.js";
import { features } from "../config/env.js";
import { logger } from "../utils/logger.js";

const uploadLogger = logger.child({ component: "uploads" });

function ensureCloudinaryConfigured() {
  if (!features.cloudinary) {
    throw new ApiError(503, "Cloudinary is not configured.");
  }
}

function ensureImageUpload(file) {
  if (!file) {
    throw new ApiError(400, "A file upload is required.");
  }

  if (!file.mimetype?.startsWith("image/")) {
    throw new ApiError(400, "Only image uploads are supported.");
  }
}

export async function uploadImageAsset(file) {
  ensureCloudinaryConfigured();
  ensureImageUpload(file);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sevakai/uploads",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(new ApiError(500, "Cloudinary upload failed.", error));
          return;
        }

        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      },
    );

    Readable.from([file.buffer]).pipe(stream);
  });
}

export async function deleteImageAsset(publicId) {
  ensureCloudinaryConfigured();

  const result = await cloudinary.uploader.destroy(publicId, {
    resource_type: "image",
  });

  uploadLogger.info("Cloudinary asset deleted.", { publicId, result: result.result });
  return {
    publicId,
    result: result.result,
  };
}

export async function replaceImageAsset(publicId, file) {
  ensureCloudinaryConfigured();
  ensureImageUpload(file);

  const nextAsset = await uploadImageAsset(file);
  if (publicId) {
    await deleteImageAsset(publicId);
  }

  return nextAsset;
}

export async function cleanupOrphanedAssets(publicIds) {
  ensureCloudinaryConfigured();

  const results = await Promise.all(
    publicIds.map(async (publicId) => {
      try {
        return await deleteImageAsset(publicId);
      } catch (error) {
        uploadLogger.warn("Failed to delete orphaned asset.", {
          publicId,
          error,
        });
        return {
          publicId,
          result: "error",
        };
      }
    }),
  );

  return {
    deleted: results.filter((entry) => entry.result === "ok").length,
    results,
  };
}
