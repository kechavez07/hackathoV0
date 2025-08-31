import { Request, Response } from 'express';
import { reputationService } from '../services/reputationService';
import { AuthRequest } from '../middleware/auth';

export class ReputationController {
  
  public async createRating(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { escrowId, rated, score, comment } = req.body;
      const rater = req.userId!;

      if (!escrowId || !rated || !score) {
        res.status(400).json({
          success: false,
          message: 'Escrow ID, rated user, and score are required'
        });
        return;
      }

      if (score < 1 || score > 5 || !Number.isInteger(score)) {
        res.status(400).json({
          success: false,
          message: 'Score must be an integer between 1 and 5'
        });
        return;
      }

      const rating = await reputationService.createRating({
        escrowId,
        rater,
        rated,
        score,
        comment
      });

      res.status(201).json({
        success: true,
        message: 'Rating created successfully',
        data: {
          rating: {
            id: rating._id,
            escrowId: rating.escrowId,
            score: rating.score,
            comment: rating.comment,
            ratingType: rating.ratingType,
            createdAt: rating.createdAt
          }
        }
      });

    } catch (error: any) {
      console.error('Error in createRating:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create rating',
        error: error.message
      });
    }
  }

  public async getUserReputation(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const reputation = await reputationService.getUserReputation(userId);

      res.status(200).json({
        success: true,
        message: 'User reputation retrieved successfully',
        data: {
          reputation: {
            userId: reputation.userId,
            averageRating: parseFloat(reputation.averageRating.toFixed(2)),
            totalRatings: reputation.totalRatings,
            level: reputation.level,
            ratingBreakdown: reputation.ratingBreakdown,
            asBuyer: {
              averageRating: parseFloat(reputation.asBuyer.averageRating.toFixed(2)),
              totalRatings: reputation.asBuyer.totalRatings,
              totalTransactionValue: reputation.asBuyer.totalTransactionValue
            },
            asSeller: {
              averageRating: parseFloat(reputation.asSeller.averageRating.toFixed(2)),
              totalRatings: reputation.asSeller.totalRatings,
              totalTransactionValue: reputation.asSeller.totalTransactionValue
            },
            recentRatings: reputation.recentRatings.map(rating => ({
              id: rating._id,
              score: rating.score,
              comment: rating.comment,
              rater: rating.rater,
              ratingType: rating.ratingType,
              transactionAmount: rating.transactionAmount,
              createdAt: rating.createdAt
            }))
          }
        }
      });

    } catch (error: any) {
      console.error('Error in getUserReputation:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get user reputation',
        error: error.message
      });
    }
  }

  public async getRatingHistory(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
        return;
      }

      const ratings = await reputationService.getRatingHistory(userId, limit);

      res.status(200).json({
        success: true,
        message: 'Rating history retrieved successfully',
        data: {
          ratings: ratings.map(rating => ({
            id: rating._id,
            escrowId: rating.escrowId,
            score: rating.score,
            comment: rating.comment,
            rater: rating.rater,
            ratingType: rating.ratingType,
            transactionAmount: rating.transactionAmount,
            createdAt: rating.createdAt
          })),
          total: ratings.length
        }
      });

    } catch (error: any) {
      console.error('Error in getRatingHistory:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get rating history',
        error: error.message
      });
    }
  }

  public async getEscrowRatings(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;

      if (!escrowId) {
        res.status(400).json({
          success: false,
          message: 'Escrow ID is required'
        });
        return;
      }

      const ratings = await reputationService.getEscrowRatings(escrowId);

      res.status(200).json({
        success: true,
        message: 'Escrow ratings retrieved successfully',
        data: {
          escrowId,
          ratings: ratings.map(rating => ({
            id: rating._id,
            score: rating.score,
            comment: rating.comment,
            rater: rating.rater,
            rated: rating.rated,
            ratingType: rating.ratingType,
            transactionAmount: rating.transactionAmount,
            createdAt: rating.createdAt
          })),
          totalRatings: ratings.length,
          averageScore: ratings.length > 0 ? 
            parseFloat((ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(2)) : 0
        }
      });

    } catch (error: any) {
      console.error('Error in getEscrowRatings:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get escrow ratings',
        error: error.message
      });
    }
  }

  public async checkCanRate(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;
      const userId = req.userId!;

      if (!escrowId) {
        res.status(400).json({
          success: false,
          message: 'Escrow ID is required'
        });
        return;
      }

      const canRateResult = await reputationService.canUserRate(escrowId, userId);

      res.status(200).json({
        success: true,
        message: 'Rating permission checked successfully',
        data: {
          escrowId,
          userId,
          canRate: canRateResult.canRate,
          reason: canRateResult.reason,
          targetUserId: canRateResult.targetUserId
        }
      });

    } catch (error: any) {
      console.error('Error in checkCanRate:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to check rating permission',
        error: error.message
      });
    }
  }

  public async getMyRatings(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const limit = parseInt(req.query.limit as string) || 20;

      const ratings = await reputationService.getRatingHistory(userId, limit);

      res.status(200).json({
        success: true,
        message: 'My ratings retrieved successfully',
        data: {
          ratings: ratings.map(rating => ({
            id: rating._id,
            escrowId: rating.escrowId,
            score: rating.score,
            comment: rating.comment,
            rater: rating.rater,
            rated: rating.rated,
            ratingType: rating.ratingType,
            transactionAmount: rating.transactionAmount,
            createdAt: rating.createdAt
          })),
          total: ratings.length
        }
      });

    } catch (error: any) {
      console.error('Error in getMyRatings:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get ratings',
        error: error.message
      });
    }
  }
}

export const reputationController = new ReputationController();
export default reputationController;