import { Router } from "express";
import { 
    createDraftController, 
    deleteDraftController, 
    getMyDraftsController, 
    promoteToTaskController,
    updateDraftController 
} from "../controllers/inbox.controller";

const inboxRoutes = Router();

inboxRoutes.get("/", getMyDraftsController);
inboxRoutes.post("/", createDraftController);
inboxRoutes.post("/:inboxId/promote", promoteToTaskController);
inboxRoutes.patch("/:inboxId", updateDraftController);
inboxRoutes.delete("/:inboxId", deleteDraftController);

export default inboxRoutes;
