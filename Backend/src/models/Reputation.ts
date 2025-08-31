import mongoose, { Schema, Document } from 'mongoose';

export enum ReputationEventType {
  TRANSACTION_COMPLETED = 'transaction_completed',
  TRANSACTION_DISPUTED = 'transaction_disputed',
  DISPUTE_RESOLVED = 'dispute_resolved',
  REVIEW_RECEIVED = 'review_received',
  VERIFICATION_COMPLETED = 'verification_completed',
  PENALTY_APPLIED = 'penalty_applied'
}

export interface IReputationEvent {
  type: ReputationEventType;
  impact: number;
  description: string;
  relatedTransaction?: mongoose.Types.ObjectId;
  relatedDispute?: mongoose.Types.ObjectId;
  metadata: {
    reviewRating?: number;
    disputeOutcome?: 'buyer_favor' | 'seller_favor' | 'split';
    verificationLevel?: 'email' | 'phone' | 'identity' | 'address';
    penaltyReason?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

export interface IReputation extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  currentScore: number;
  historicalHighScore: number;
  historicalLowScore: number;
  level: string;
  stats: {
    totalTransactions: number;
    completedTransactions: number;
    disputedTransactions: number;
    wonDisputes: number;
    lostDisputes: number;
    averageRating: number;
    totalReviews: number;
    responseTimeHours: number;
  };
  events: IReputationEvent[];
  achievements: Array<{
    type: string;
    name: string;
    description: string;
    unlockedAt: Date;
    icon?: string;
  }>;
  penalties: Array<{
    reason: string;
    impact: number;
    appliedAt: Date;
    expiresAt?: Date;
    isActive: boolean;
  }>;
  verifications: {
    email: { verified: boolean; verifiedAt?: Date; };
    phone: { verified: boolean; verifiedAt?: Date; };
    identity: { verified: boolean; verifiedAt?: Date; level?: 'basic' | 'advanced'; };
    address: { verified: boolean; verifiedAt?: Date; };
  };
  trustMetrics: {
    reliabilityScore: number;
    communicationScore: number;
    deliveryScore: number;
    qualityScore: number;
  };
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReputationEventSchema = new Schema<IReputationEvent>({
  type: {
    type: String,
    required: [true, 'Event type is required'],
    enum: Object.values(ReputationEventType)
  },
  impact: {
    type: Number,
    required: [true, 'Impact value is required'],
    min: [-100, 'Impact cannot be less than -100'],
    max: [100, 'Impact cannot be more than 100']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  relatedTransaction: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction'
  },
  relatedDispute: {
    type: Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  metadata: {
    reviewRating: {
      type: Number,
      min: [1, 'Rating cannot be less than 1'],
      max: [5, 'Rating cannot be more than 5']
    },
    disputeOutcome: {
      type: String,
      enum: ['buyer_favor', 'seller_favor', 'split']
    },
    verificationLevel: {
      type: String,
      enum: ['email', 'phone', 'identity', 'address']
    },
    penaltyReason: String
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ReputationSchema: Schema<IReputation> = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required'],
    unique: true
  },
  currentScore: {
    type: Number,
    required: [true, 'Current score is required'],
    default: 100,
    min: [0, 'Score cannot be negative'],
    max: [1000, 'Score cannot exceed 1000']
  },
  historicalHighScore: {
    type: Number,
    default: 100,
    min: [0, 'Score cannot be negative'],
    max: [1000, 'Score cannot exceed 1000']
  },
  historicalLowScore: {
    type: Number,
    default: 100,
    min: [0, 'Score cannot be negative'],
    max: [1000, 'Score cannot exceed 1000']
  },
  level: {
    type: String,
    default: 'Newcomer',
    enum: ['Newcomer', 'Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Elite']
  },
  stats: {
    totalTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Total transactions cannot be negative']
    },
    completedTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Completed transactions cannot be negative']
    },
    disputedTransactions: {
      type: Number,
      default: 0,
      min: [0, 'Disputed transactions cannot be negative']
    },
    wonDisputes: {
      type: Number,
      default: 0,
      min: [0, 'Won disputes cannot be negative']
    },
    lostDisputes: {
      type: Number,
      default: 0,
      min: [0, 'Lost disputes cannot be negative']
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Average rating cannot be negative'],
      max: [5, 'Average rating cannot exceed 5']
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative']
    },
    responseTimeHours: {
      type: Number,
      default: 0,
      min: [0, 'Response time cannot be negative']
    }
  },
  events: [ReputationEventSchema],
  achievements: [{
    type: {
      type: String,
      required: [true, 'Achievement type is required']
    },
    name: {
      type: String,
      required: [true, 'Achievement name is required']
    },
    description: {
      type: String,
      required: [true, 'Achievement description is required']
    },
    unlockedAt: {
      type: Date,
      default: Date.now
    },
    icon: String
  }],
  penalties: [{
    reason: {
      type: String,
      required: [true, 'Penalty reason is required']
    },
    impact: {
      type: Number,
      required: [true, 'Penalty impact is required'],
      max: [0, 'Penalty impact must be negative or zero']
    },
    appliedAt: {
      type: Date,
      default: Date.now
    },
    expiresAt: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  verifications: {
    email: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    phone: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    },
    identity: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date,
      level: {
        type: String,
        enum: ['basic', 'advanced']
      }
    },
    address: {
      verified: { type: Boolean, default: false },
      verifiedAt: Date
    }
  },
  trustMetrics: {
    reliabilityScore: {
      type: Number,
      default: 100,
      min: [0, 'Reliability score cannot be negative'],
      max: [100, 'Reliability score cannot exceed 100']
    },
    communicationScore: {
      type: Number,
      default: 100,
      min: [0, 'Communication score cannot be negative'],
      max: [100, 'Communication score cannot exceed 100']
    },
    deliveryScore: {
      type: Number,
      default: 100,
      min: [0, 'Delivery score cannot be negative'],
      max: [100, 'Delivery score cannot exceed 100']
    },
    qualityScore: {
      type: Number,
      default: 100,
      min: [0, 'Quality score cannot be negative'],
      max: [100, 'Quality score cannot exceed 100']
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update historical scores and level
ReputationSchema.pre('save', function(next) {
  if (this.currentScore > this.historicalHighScore) {
    this.historicalHighScore = this.currentScore;
  }
  if (this.currentScore < this.historicalLowScore) {
    this.historicalLowScore = this.currentScore;
  }
  
  // Update level based on current score
  if (this.currentScore >= 900) this.level = 'Elite';
  else if (this.currentScore >= 800) this.level = 'Diamond';
  else if (this.currentScore >= 700) this.level = 'Platinum';
  else if (this.currentScore >= 600) this.level = 'Gold';
  else if (this.currentScore >= 400) this.level = 'Silver';
  else if (this.currentScore >= 200) this.level = 'Bronze';
  else this.level = 'Newcomer';
  
  this.lastUpdated = new Date();
  next();
});

// Method to add reputation event
ReputationSchema.methods.addEvent = function(event: Partial<IReputationEvent>) {
  this.events.push(event);
  this.currentScore = Math.max(0, Math.min(1000, this.currentScore + event.impact!));
  return this.save();
};

// Method to calculate trust score
ReputationSchema.methods.calculateTrustScore = function(): number {
  const { reliabilityScore, communicationScore, deliveryScore, qualityScore } = this.trustMetrics;
  return Math.round((reliabilityScore + communicationScore + deliveryScore + qualityScore) / 4);
};

// Indexes for efficient querying
ReputationSchema.index({ user: 1 });
ReputationSchema.index({ currentScore: -1 });
ReputationSchema.index({ level: 1 });
ReputationSchema.index({ lastUpdated: -1 });
ReputationSchema.index({ 'stats.totalTransactions': -1 });
ReputationSchema.index({ 'stats.averageRating': -1 });

export const Reputation = mongoose.model<IReputation>('Reputation', ReputationSchema);
export default Reputation;