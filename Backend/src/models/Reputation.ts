import mongoose, { Schema, Document } from 'mongoose';

export enum RatingType {
  BUYER_TO_SELLER = 'buyer_to_seller',
  SELLER_TO_BUYER = 'seller_to_buyer'
}

export interface IRating extends Document {
  _id: mongoose.Types.ObjectId;
  escrowId: string;
  rater: mongoose.Types.ObjectId;
  rated: mongoose.Types.ObjectId;
  ratingType: RatingType;
  score: number;
  comment?: string;
  transactionAmount: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReputationSummary extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  averageRating: number;
  totalRatings: number;
  totalTransactionValue: string;
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
  level: string;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RatingSchema: Schema<IRating> = new Schema({
  escrowId: {
    type: String,
    required: [true, 'Escrow ID is required'],
    validate: {
      validator: function(v: string) {
        return /^ESC_[A-Z0-9]{8}$/.test(v);
      },
      message: 'Invalid escrow ID format'
    }
  },
  rater: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rater is required']
  },
  rated: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Rated user is required']
  },
  ratingType: {
    type: String,
    required: [true, 'Rating type is required'],
    enum: Object.values(RatingType)
  },
  score: {
    type: Number,
    required: [true, 'Rating score is required'],
    min: [1, 'Rating must be at least 1 star'],
    max: [5, 'Rating cannot exceed 5 stars'],
    validate: {
      validator: Number.isInteger,
      message: 'Rating must be a whole number'
    }
  },
  comment: {
    type: String,
    maxlength: [500, 'Comment cannot exceed 500 characters'],
    trim: true
  },
  transactionAmount: {
    type: String,
    required: [true, 'Transaction amount is required'],
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v) && BigInt(v) > 0;
      },
      message: 'Transaction amount must be a valid positive number'
    }
  }
}, {
  timestamps: true
});

const ReputationSummarySchema: Schema<IReputationSummary> = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  averageRating: {
    type: Number,
    default: 0,
    min: [0, 'Average rating cannot be negative'],
    max: [5, 'Average rating cannot exceed 5']
  },
  totalRatings: {
    type: Number,
    default: 0,
    min: [0, 'Total ratings cannot be negative']
  },
  totalTransactionValue: {
    type: String,
    default: '0',
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v);
      },
      message: 'Total transaction value must be a valid number'
    }
  },
  ratingBreakdown: {
    five: { type: Number, default: 0, min: 0 },
    four: { type: Number, default: 0, min: 0 },
    three: { type: Number, default: 0, min: 0 },
    two: { type: Number, default: 0, min: 0 },
    one: { type: Number, default: 0, min: 0 }
  },
  asBuyer: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    totalTransactionValue: { type: String, default: '0' }
  },
  asSeller: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalRatings: { type: Number, default: 0, min: 0 },
    totalTransactionValue: { type: String, default: '0' }
  },
  level: {
    type: String,
    default: 'Newcomer',
    enum: ['Newcomer', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite']
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

RatingSchema.pre('save', function(next) {
  if (this.rater.toString() === this.rated.toString()) {
    next(new Error('Users cannot rate themselves'));
  } else {
    next();
  }
});

ReputationSummarySchema.pre('save', function(next) {
  if (this.averageRating >= 4.8) this.level = 'Elite';
  else if (this.averageRating >= 4.5) this.level = 'Diamond';
  else if (this.averageRating >= 4.2) this.level = 'Platinum';
  else if (this.averageRating >= 3.8) this.level = 'Gold';
  else if (this.averageRating >= 3.0) this.level = 'Silver';
  else if (this.averageRating >= 2.0) this.level = 'Bronze';
  else this.level = 'Newcomer';
  
  this.lastUpdated = new Date();
  next();
});

RatingSchema.index({ escrowId: 1 });
RatingSchema.index({ rater: 1, rated: 1 });
RatingSchema.index({ rated: 1, createdAt: -1 });
RatingSchema.index({ escrowId: 1, ratingType: 1 }, { unique: true });

ReputationSummarySchema.index({ userId: 1 });
ReputationSummarySchema.index({ averageRating: -1 });
ReputationSummarySchema.index({ totalRatings: -1 });

export const Rating = mongoose.model<IRating>('Rating', RatingSchema);
export const ReputationSummary = mongoose.model<IReputationSummary>('ReputationSummary', ReputationSummarySchema);

export default { Rating, ReputationSummary };