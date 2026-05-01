import express from "express";
import { 
    getUploadUrl, 
    confirmUpload, 
    createFolder, 
    listAssets, 
    deleteAsset, 
    deleteFolder,
    updateFolder,
    updateAsset
} from "../controllers/asset.controller";

const router = express.Router();

// GET /api/v1/asset/project/:projectId
router.get("/project/:projectId", listAssets);

// POST /api/v1/asset/presigned-url
router.post("/presigned-url", getUploadUrl);

// POST /api/v1/asset/confirm
router.post("/confirm", confirmUpload);

// POST /api/v1/asset/folder
router.post("/folder", createFolder);

// PATCH /api/v1/asset/folder/:folderId
router.patch("/folder/:folderId", updateFolder);

// PATCH /api/v1/asset/:assetId
router.patch("/:assetId", updateAsset);

// DELETE /api/v1/asset/folder/:folderId
router.delete("/folder/:folderId", deleteFolder);

// DELETE /api/v1/asset/:assetId
router.delete("/:assetId", deleteAsset);

export default router;
