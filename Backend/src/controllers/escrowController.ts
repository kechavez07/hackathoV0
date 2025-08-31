import { Request, Response } from 'express';
import { escrowService } from '../services/escrowService';
import { EscrowStatus } from '../models/Escrow';

export const createEscrow = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const {
      sellerId,
      amount,
      description,
      terms,
      productInfo,
      deliveryInfo,
      autoReleaseHours
    } = req.body;

    // Validate required fields
    if (!sellerId || !amount || !description || !terms) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sellerId, amount, description, terms'
      });
    }

    // Validate amount format
    if (!/^\d+$/.test(amount) || BigInt(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount format. Must be positive integer in beddows.'
      });
    }

    const escrow = await escrowService.createEscrow({
      buyerId: userId,
      sellerId,
      amount,
      description,
      terms,
      productInfo,
      deliveryInfo,
      autoReleaseHours
    });

    res.status(201).json({
      success: true,
      message: 'Escrow created successfully',
      data: {
        escrow: {
          id: escrow._id,
          escrowId: escrow.escrowId,
          buyer: escrow.buyer,
          seller: escrow.seller,
          amount: escrow.amount,
          fee: escrow.fee,
          status: escrow.status,
          description: escrow.description,
          terms: escrow.terms,
          contractAddress: escrow.contractAddress,
          liskTransactionId: escrow.liskTransactionId,
          releaseConditions: escrow.releaseConditions,
          timeline: escrow.timeline,
          metadata: escrow.metadata,
          createdAt: escrow.createdAt
        }
      }
    });

  } catch (error) {
    console.error('L Create escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create escrow',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getEscrow = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }
    const userId = (req as any).user?.userId;

    const escrow = await escrowService.getEscrow(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    // Verify user is buyer or seller
    const isBuyer = escrow.buyer._id.toString() === userId;
    const isSeller = escrow.seller._id.toString() === userId;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this escrow.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        escrow: {
          id: escrow._id,
          escrowId: escrow.escrowId,
          buyer: escrow.buyer,
          seller: escrow.seller,
          amount: escrow.amount,
          fee: escrow.fee,
          status: escrow.status,
          description: escrow.description,
          terms: escrow.terms,
          contractAddress: escrow.contractAddress,
          liskTransactionId: escrow.liskTransactionId,
          releaseConditions: escrow.releaseConditions,
          timeline: escrow.timeline,
          metadata: escrow.metadata,
          disputeInfo: escrow.disputeInfo,
          createdAt: escrow.createdAt,
          updatedAt: escrow.updatedAt
        },
        userRole: isBuyer ? 'buyer' : 'seller'
      }
    });

  } catch (error) {
    console.error('L Get escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getUserEscrows = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { status, page = 1, limit = 10 } = req.query;

    let escrowStatus: EscrowStatus | undefined;
    if (status && Object.values(EscrowStatus).includes(status as EscrowStatus)) {
      escrowStatus = status as EscrowStatus;
    }

    const escrows = await escrowService.getUserEscrows(userId, escrowStatus);

    // Simple pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedEscrows = escrows.slice(startIndex, endIndex);

    res.status(200).json({
      success: true,
      message: 'User escrows retrieved successfully',
      data: {
        escrows: paginatedEscrows.map(escrow => ({
          id: escrow._id,
          escrowId: escrow.escrowId,
          buyer: escrow.buyer,
          seller: escrow.seller,
          amount: escrow.amount,
          fee: escrow.fee,
          status: escrow.status,
          description: escrow.description,
          timeline: escrow.timeline,
          userRole: escrow.buyer._id.toString() === userId ? 'buyer' : 'seller',
          createdAt: escrow.createdAt
        })),
        pagination: {
          total: escrows.length,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(escrows.length / Number(limit))
        }
      }
    });

  } catch (error) {
    console.error('L Get user escrows error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user escrows',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const fundEscrow = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }
    const userId = (req as any).user?.userId;

    const escrow = await escrowService.fundEscrow(escrowId, userId);

    res.status(200).json({
      success: true,
      message: 'Escrow funded successfully',
      data: {
        escrow: {
          id: escrow._id,
          escrowId: escrow.escrowId,
          status: escrow.status,
          amount: escrow.amount,
          timeline: escrow.timeline
        }
      }
    });

  } catch (error) {
    console.error('L Fund escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fund escrow',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const releaseEscrow = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }
    const userId = (req as any).user?.userId;
    const { reason } = req.body;

    const escrow = await escrowService.releaseEscrow({
      escrowId,
      releasedBy: userId,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Escrow released successfully',
      data: {
        escrow: {
          id: escrow._id,
          escrowId: escrow.escrowId,
          status: escrow.status,
          amount: escrow.amount,
          timeline: escrow.timeline
        }
      }
    });

  } catch (error) {
    console.error('L Release escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release escrow',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const addMessage = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }
    const userId = (req as any).user?.userId;
    const { message } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty'
      });
    }

    const escrow = await escrowService.addMessage(escrowId, userId, message.trim());

    res.status(200).json({
      success: true,
      message: 'Message added successfully',
      data: {
        escrowId: escrow.escrowId,
        messageCount: escrow.metadata.communications.messages.length,
        lastMessage: escrow.metadata.communications.messages[escrow.metadata.communications.messages.length - 1]
      }
    });

  } catch (error) {
    console.error('L Add message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getEscrowMessages = async (req: Request, res: Response) => {
  try {
    const { escrowId } = req.params;
    if (!escrowId) {
      return res.status(400).json({
        success: false,
        message: 'Escrow ID is required'
      });
    }
    const userId = (req as any).user?.userId;

    const escrow = await escrowService.getEscrow(escrowId);
    if (!escrow) {
      return res.status(404).json({
        success: false,
        message: 'Escrow not found'
      });
    }

    // Verify user is buyer or seller
    const isBuyer = escrow.buyer._id.toString() === userId;
    const isSeller = escrow.seller._id.toString() === userId;
    
    if (!isBuyer && !isSeller) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this escrow.'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        escrowId: escrow.escrowId,
        messages: escrow.metadata.communications.messages.map(msg => ({
          sender: msg.sender,
          message: msg.message,
          timestamp: msg.timestamp,
          read: msg.read
        }))
      }
    });

  } catch (error) {
    console.error('L Get escrow messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow messages',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getEscrowStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    // Get all escrows for the user
    const allEscrows = await escrowService.getUserEscrows(userId);
    
    const stats = {
      total: allEscrows.length,
      created: allEscrows.filter(e => e.status === EscrowStatus.CREATED).length,
      funded: allEscrows.filter(e => e.status === EscrowStatus.FUNDED).length,
      completed: allEscrows.filter(e => e.status === EscrowStatus.COMPLETED).length,
      disputed: allEscrows.filter(e => e.status === EscrowStatus.DISPUTED).length,
      refunded: allEscrows.filter(e => e.status === EscrowStatus.REFUNDED).length,
      asBuyer: allEscrows.filter(e => e.buyer._id.toString() === userId).length,
      asSeller: allEscrows.filter(e => e.seller._id.toString() === userId).length,
      totalValue: allEscrows.reduce((sum, e) => sum + BigInt(e.amount), BigInt(0)).toString()
    };

    res.status(200).json({
      success: true,
      message: 'Escrow statistics retrieved successfully',
      data: { stats }
    });

  } catch (error) {
    console.error('L Get escrow stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get escrow statistics',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};