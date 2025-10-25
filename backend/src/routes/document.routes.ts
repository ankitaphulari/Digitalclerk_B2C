// backend/src/routes/document.routes.ts
import express from 'express';
import { 
  extractDocument, 
  getExtractionHistory, 
  incrementUsage 
} from '../controllers/documentController';
import { authMiddleware } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/document/extract
 * Extract data from uploaded documents
 * Used by Chrome Extension
 */
router.post('/extract', 
  rateLimiter({ max: 100, windowMs: 60 * 1000 }), // 100 requests per minute
  extractDocument
);

/**
 * GET /api/document/history
 * Get extraction history for current user
 */
router.get('/history', getExtractionHistory);

/**
 * POST /api/usage/increment
 * Update document usage count
 */
router.post('/usage/increment', incrementUsage);

export default router;
