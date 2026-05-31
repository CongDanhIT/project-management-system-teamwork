import { Router } from "express";
import {
    getWorkflows,
    getWorkflowById,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    testWorkflowTrigger
} from "../controllers/workflow.controller";
import { isAuthenticated } from "../middlewares/isAuthenticated.middleware";

const router = Router();

router.use(isAuthenticated);

router.get("/project/:projectId", getWorkflows);
router.get("/:id", getWorkflowById);
router.post("/", createWorkflow);
router.put("/:id", updateWorkflow);
router.delete("/:id", deleteWorkflow);
router.post("/test", testWorkflowTrigger);

export default router;
