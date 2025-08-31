import { Rating, ReputationSummary, IRating, IReputationSummary, RatingType } from '../models/Reputation';
import { Escrow, EscrowStatus } from '../models/Escrow';
import { User } from '../models/User';

interface CreateRatingData {
  escrowId: string;
  rater: string;
  rated: string;
  score: number;
  comment?: string;
}

interface ReputationStats {
  userId: string;
  averageRating: number;
  totalRatings: number;
  level: string;
  ratingBreakdown: {
    five: number;
    four: number;
    three: number;
    two: number;
    one: number;
  };
  asBuyer: {
    averageRating: number;
    totalRatings: number;
    totalTransactionValue: string;
  };
  asSeller: {
    averageRating: number;
    totalRatings: number;
    totalTransactionValue: string;
  };
  recentRatings: IRating[];
}

export class ReputationService {
  private static instance: ReputationService;

  private constructor() {}

  public static getInstance(): ReputationService {
    if (!ReputationService.instance) {
      ReputationService.instance = new ReputationService();
    }
    return ReputationService.instance;
  }

  public async createRating(data: CreateRatingData): Promise<IRating> {
    try {
      const escrow = await Escrow.findOne({ escrowId: data.escrowId }).populate('buyer seller');
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.COMPLETED) {
        throw new Error('Can only rate completed escrows');
      }

      const rater = await User.findById(data.rater);
      const rated = await User.findById(data.rated);

      if (!rater || !rated) {
        throw new Error('Rater or rated user not found');
      }

      if (data.rater === data.rated) {
        throw new Error('Users cannot rate themselves');
      }

      const isBuyer = escrow.buyer._id.toString() === data.rater;
      const isSeller = escrow.seller._id.toString() === data.rater;

      if (!isBuyer && !isSeller) {
        throw new Error('Only escrow participants can rate each other');
      }

      if (isBuyer && escrow.seller._id.toString() !== data.rated) {
        throw new Error('Buyer can only rate the seller');
      }

      if (isSeller && escrow.buyer._id.toString() !== data.rated) {
        throw new Error('Seller can only rate the buyer');
      }

      const ratingType = isBuyer ? RatingType.BUYER_TO_SELLER : RatingType.SELLER_TO_BUYER;

      const existingRating = await Rating.findOne({
        escrowId: data.escrowId,
        ratingType
      });

      if (existingRating) {
        throw new Error(`${isBuyer ? 'Buyer' : 'Seller'} has already rated this escrow`);
      }

      const rating = new Rating({
        escrowId: data.escrowId,
        rater: data.rater,
        rated: data.rated,
        ratingType,
        score: data.score,
        comment: data.comment,
        transactionAmount: escrow.amount
      });

      await rating.save();

      await this.updateReputationSummary(data.rated, escrow.amount, ratingType);

      console.log(`⭐ Rating created: ${data.score} stars for user ${data.rated} on escrow ${data.escrowId}`);
      return rating;

    } catch (error) {
      console.error('❌ Error creating rating:', error);
      throw error;
    }
  }

  public async getUserReputation(userId: string): Promise<ReputationStats> {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let reputationSummary: any = await ReputationSummary.findOne({ userId });

      if (!reputationSummary) {
        reputationSummary = await this.createReputationSummary(userId);
      }

      const recentRatings = await Rating.find({ rated: userId })
        .populate('rater', 'username')
        .sort({ createdAt: -1 })
        .limit(10);

      const stats: ReputationStats = {
        userId,
        averageRating: reputationSummary.averageRating,
        totalRatings: reputationSummary.totalRatings,
        level: reputationSummary.level,
        ratingBreakdown: reputationSummary.ratingBreakdown,
        asBuyer: reputationSummary.asBuyer,
        asSeller: reputationSummary.asSeller,
        recentRatings
      };

      return stats;

    } catch (error) {
      console.error('❌ Error getting user reputation:', error);
      throw error;
    }
  }

  public async getRatingHistory(userId: string, limit: number = 20): Promise<IRating[]> {
    try {
      const ratings = await Rating.find({ rated: userId })
        .populate('rater', 'username')
        .populate('rated', 'username')
        .sort({ createdAt: -1 })
        .limit(limit);

      return ratings;
    } catch (error) {
      console.error('❌ Error getting rating history:', error);
      throw error;
    }
  }

  public async getEscrowRatings(escrowId: string): Promise<IRating[]> {
    try {
      const ratings = await Rating.find({ escrowId })
        .populate('rater', 'username')
        .populate('rated', 'username')
        .sort({ createdAt: -1 });

      return ratings;
    } catch (error) {
      console.error('❌ Error getting escrow ratings:', error);
      throw error;
    }
  }

  public async canUserRate(escrowId: string, userId: string): Promise<{ canRate: boolean; reason?: string; targetUserId?: string }> {
    try {
      const escrow = await Escrow.findOne({ escrowId }).populate('buyer seller');
      if (!escrow) {
        return { canRate: false, reason: 'Escrow not found' };
      }

      if (escrow.status !== EscrowStatus.COMPLETED) {
        return { canRate: false, reason: 'Escrow must be completed to rate' };
      }

      const isBuyer = escrow.buyer._id.toString() === userId;
      const isSeller = escrow.seller._id.toString() === userId;

      if (!isBuyer && !isSeller) {
        return { canRate: false, reason: 'Only escrow participants can rate' };
      }

      const ratingType = isBuyer ? RatingType.BUYER_TO_SELLER : RatingType.SELLER_TO_BUYER;
      const targetUserId = isBuyer ? escrow.seller._id.toString() : escrow.buyer._id.toString();

      const existingRating = await Rating.findOne({
        escrowId,
        ratingType
      });

      if (existingRating) {
        return { canRate: false, reason: 'Already rated this escrow', targetUserId };
      }

      return { canRate: true, targetUserId };

    } catch (error) {
      console.error('❌ Error checking if user can rate:', error);
      return { canRate: false, reason: 'Error checking rating permission' };
    }
  }

  private async updateReputationSummary(userId: string, transactionAmount: string, ratingType: RatingType): Promise<void> {
    try {
      let reputationSummary: any = await ReputationSummary.findOne({ userId });

      if (!reputationSummary) {
        reputationSummary = await this.createReputationSummary(userId);
      }

      const allRatings = await Rating.find({ rated: userId });
      const totalRatings = allRatings.length;

      if (totalRatings === 0) {
        return;
      }

      const averageRating = allRatings.reduce((sum, rating) => sum + rating.score, 0) / totalRatings;
      const totalTransactionValue = allRatings.reduce((sum, rating) => sum + BigInt(rating.transactionAmount), BigInt(0));

      const ratingBreakdown = {
        five: allRatings.filter(r => r.score === 5).length,
        four: allRatings.filter(r => r.score === 4).length,
        three: allRatings.filter(r => r.score === 3).length,
        two: allRatings.filter(r => r.score === 2).length,
        one: allRatings.filter(r => r.score === 1).length
      };

      const buyerRatings = allRatings.filter(r => r.ratingType === RatingType.SELLER_TO_BUYER);
      const sellerRatings = allRatings.filter(r => r.ratingType === RatingType.BUYER_TO_SELLER);

      const asBuyer = {
        averageRating: buyerRatings.length > 0 ? buyerRatings.reduce((sum, r) => sum + r.score, 0) / buyerRatings.length : 0,
        totalRatings: buyerRatings.length,
        totalTransactionValue: buyerRatings.reduce((sum, r) => sum + BigInt(r.transactionAmount), BigInt(0)).toString()
      };

      const asSeller = {
        averageRating: sellerRatings.length > 0 ? sellerRatings.reduce((sum, r) => sum + r.score, 0) / sellerRatings.length : 0,
        totalRatings: sellerRatings.length,
        totalTransactionValue: sellerRatings.reduce((sum, r) => sum + BigInt(r.transactionAmount), BigInt(0)).toString()
      };

      reputationSummary.averageRating = averageRating;
      reputationSummary.totalRatings = totalRatings;
      reputationSummary.totalTransactionValue = totalTransactionValue.toString();
      reputationSummary.ratingBreakdown = ratingBreakdown;
      reputationSummary.asBuyer = asBuyer;
      reputationSummary.asSeller = asSeller;

      await reputationSummary.save();

      await User.findByIdAndUpdate(userId, {
        reputationScore: Math.round(averageRating * 20)
      });

      console.log(`📊 Updated reputation summary for user ${userId}: ${averageRating.toFixed(2)}/5.0 (${totalRatings} ratings)`);

    } catch (error) {
      console.error('❌ Error updating reputation summary:', error);
      throw error;
    }
  }

  private async createReputationSummary(userId: string): Promise<any> {
    try {
      const reputationSummary = new ReputationSummary({
        userId,
        averageRating: 0,
        totalRatings: 0,
        totalTransactionValue: '0',
        ratingBreakdown: {
          five: 0, four: 0, three: 0, two: 0, one: 0
        },
        asBuyer: {
          averageRating: 0, totalRatings: 0, totalTransactionValue: '0'
        },
        asSeller: {
          averageRating: 0, totalRatings: 0, totalTransactionValue: '0'
        },
        level: 'Newcomer'
      });

      await reputationSummary.save();
      console.log(`✨ Created reputation summary for user ${userId}`);
      return reputationSummary;

    } catch (error) {
      console.error('❌ Error creating reputation summary:', error);
      throw error;
    }
  }

  public async onEscrowCompleted(escrowId: string): Promise<void> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      if (!escrow) {
        console.log(`⚠️ Escrow ${escrowId} not found for reputation update`);
        return;
      }

      const buyerId = escrow.buyer.toString();
      const sellerId = escrow.seller.toString();

      let buyerSummary = await ReputationSummary.findOne({ userId: buyerId });
      let sellerSummary = await ReputationSummary.findOne({ userId: sellerId });

      if (!buyerSummary) {
        buyerSummary = await this.createReputationSummary(buyerId);
      }

      if (!sellerSummary) {
        sellerSummary = await this.createReputationSummary(sellerId);
      }

      console.log(`🎯 Reputation tracking initialized for escrow ${escrowId} completion`);

    } catch (error) {
      console.error('❌ Error handling escrow completion for reputation:', error);
    }
  }
}

export const reputationService = ReputationService.getInstance();
export default reputationService;