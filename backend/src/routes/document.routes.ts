// backend/src/routes/document.routes.ts
import express from 'express';
import { 
  extractDocument, 
  getExtractionHistory, 
  incrementUsage 
} from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/document/extract
 * Extract data from uploaded documents
 */
router.post('/extract', extractDocument);

/**
 * GET /api/document/history
 * Get extraction history
 */
router.get('/history', getExtractionHistory);

/**
 * POST /api/usage/increment
 * Update usage count
 */
router.post('/usage/increment', incrementUsage);

export default router;
