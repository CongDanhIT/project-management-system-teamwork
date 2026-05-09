import express from "express";
import { createPhase, getPhases, updatePhase, deletePhase, restorePhase, getDeletedPhases, hardDeletePhase, getPhasesByWorkspace } from "../controllers/phase.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";
import logger from "../utils/logger";

const router = express.Router();

logger.info(">>> LOADING Phase Routes <<<");

// GET /api/v1/phase/project/:projectId
router.get("/project/:projectId", isAuthenticated, getPhases);
router.get("/workspace/:workspaceId", isAuthenticated, getPhasesByWorkspace);

// POST /api/v1/phase
router.post("/", isAuthenticated, createPhase);

// PUT /api/v1/phase/:phaseId
router.put("/:phaseId", isAuthenticated, (req, res, next) => {
    logger.info(`>>> Phase Route: PUT /${req.params.phaseId} detected <<<`);
    updatePhase(req, res, next);
});

// DELETE /api/v1/phase/:phaseId
router.delete("/:phaseId", isAuthenticated, deletePhase);

// POST /api/v1/phase/:phaseId/restore
router.post("/:phaseId/restore", isAuthenticated, restorePhase);

// GET /api/v1/phase/workspace/:workspaceId/deleted
router.get("/workspace/:workspaceId/deleted", isAuthenticated, getDeletedPhases);

// DELETE /api/v1/phase/:phaseId/permanent
router.delete("/:phaseId/permanent", isAuthenticated, hardDeletePhase);

export default router;
