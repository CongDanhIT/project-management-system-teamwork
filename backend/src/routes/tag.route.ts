import { Router } from "express";
import * as TagController from "../controllers/tag.controller";

const tagRoutes = Router({ mergeParams: true });

// Sẽ được mount vào app.use('/api/v1/workspace/:workspaceId/tags', tagRoutes)
tagRoutes.get("/", TagController.getTags);
tagRoutes.post("/", TagController.createTag);
tagRoutes.put("/:tagId", TagController.updateTag);
tagRoutes.delete("/:tagId", TagController.deleteTag);

export default tagRoutes;
