import { asyncHandler } from "../utils/async-handler.js";
import { sendSuccess } from "../utils/response.js";
import {
  cleanupOrphanedAssets,
  deleteImageAsset,
  replaceImageAsset,
  uploadImageAsset,
} from "../services/upload.service.js";

export const uploadImage = asyncHandler(async (request, response) => {
  const asset = await uploadImageAsset(request.file);
  sendSuccess(response, asset, "Upload complete.", 201);
});

export const replaceImage = asyncHandler(async (request, response) => {
  const asset = await replaceImageAsset(request.body.publicId, request.file);
  sendSuccess(response, asset, "Upload replaced successfully.");
});

export const deleteImage = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await deleteImageAsset(request.body.publicId),
    "Upload deleted successfully.",
  );
});

export const cleanupUploads = asyncHandler(async (request, response) => {
  sendSuccess(
    response,
    await cleanupOrphanedAssets(request.body.publicIds),
    "Upload cleanup completed.",
  );
});
