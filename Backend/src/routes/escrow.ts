import { Router } from 'express';
import { 
  createEscrow,
  getEscrow,
  getUserEscrows,
  fundEscrow,
  releaseEscrow,
  addMessage,
  getEscrowMessages,
  getEscrowStats
} from '../controllers/escrowController';

const router = Router();

// POST /api/v1/escrow - Create new escrow
router.post('/', createEscrow);

// GET /api/v1/escrow - Get user's escrows
router.get('/', getUserEscrows);

// GET /api/v1/escrow/stats - Get user's escrow statistics
router.get('/stats', getEscrowStats);

// GET /api/v1/escrow/:escrowId - Get specific escrow
router.get('/:escrowId', getEscrow);

// POST /api/v1/escrow/:escrowId/fund - Fund escrow
router.post('/:escrowId/fund', fundEscrow);

// POST /api/v1/escrow/:escrowId/release - Release escrow funds
router.post('/:escrowId/release', releaseEscrow);

// POST /api/v1/escrow/:escrowId/message - Add message to escrow
router.post('/:escrowId/message', addMessage);

// GET /api/v1/escrow/:escrowId/messages - Get escrow messages
router.get('/:escrowId/messages', getEscrowMessages);

export default router;