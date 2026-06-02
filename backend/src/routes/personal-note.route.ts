import { Router } from "express";
import {
    getNotesByWorkspaceController,
    createNoteController,
    updateNoteController,
    deleteNoteController
} from "../controllers/personal-note.controller";

const personalNoteRoutes = Router();

personalNoteRoutes.get("/workspace/:workspaceId", getNotesByWorkspaceController);
personalNoteRoutes.post("/", createNoteController);
personalNoteRoutes.patch("/:id", updateNoteController);
personalNoteRoutes.delete("/:id", deleteNoteController);

export default personalNoteRoutes;
