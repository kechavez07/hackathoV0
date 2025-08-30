import mongoose, { Schema, Document } from 'mongoose';

export enum EscrowStatus {
  CREATED = 'created',
  FUNDED = 'funded',
  DISPUTED = 'disputed',
  COMPLETED = 'completed',
  REFUNDED = 'refunded',
  EXPIRED = 'expired'
}

export interface IEscrow extends Document {
  _id: mongoose.Types.ObjectId;
  escrowId: string;
  buyer: mongoose.Types.ObjectId;
  seller: mongoose.Types.ObjectId;
  amount: string;
  fee: string;
  status: EscrowStatus;
  description: string;
  terms: string;
  contractAddress: string;
  liskTransactionId?: string;
  releaseConditions: {
    requiresBuyerApproval: boolean;
    requiresSellerConfirmation: boolean;
    autoReleaseAfterHours?: number;
    deliveryConfirmationRequired: boolean;
  };
  timeline: {
    createdAt: Date;
    fundedAt?: Date;
    disputedAt?: Date;
    completedAt?: Date;
    refundedAt?: Date;
    expiresAt?: Date;
  };
  disputeInfo?: {
    disputeId: mongoose.Types.ObjectId;
    reason: string;
    initiator: 'buyer' | 'seller';
    status: 'open' | 'investigating' | 'resolved';
    createdAt: Date;
  };
  metadata: {
    productInfo?: {
      name: string;
      description: string;
      category: string;
      images?: string[];
    };
    deliveryInfo?: {
      method: string;
      address?: string;
      trackingNumber?: string;
      estimatedDelivery?: Date;
    };
    communications: {
      messages: Array<{
        sender: 'buyer' | 'seller';
        message: string;
        timestamp: Date;
        read: boolean;
      }>;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const EscrowSchema: Schema<IEscrow> = new Schema({
  escrowId: {
    type: String,
    required: [true, 'Escrow ID is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^ESC_[A-Z0-9]{8}$/.test(v);
      },
      message: 'Invalid escrow ID format'
    }
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Buyer is required']
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Seller is required']
  },
  amount: {
    type: String,
    required: [true, 'Escrow amount is required'],
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v) && BigInt(v) > 0;
      },
      message: 'Amount must be a valid positive number in beddows'
    }
  },
  fee: {
    type: String,
    required: [true, 'Escrow fee is required'],
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v) && BigInt(v) >= 0;
      },
      message: 'Fee must be a valid number in beddows'
    }
  },
  status: {
    type: String,
    required: [true, 'Escrow status is required'],
    enum: Object.values(EscrowStatus),
    default: EscrowStatus.CREATED
  },
  description: {
    type: String,
    required: [true, 'Escrow description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  terms: {
    type: String,
    required: [true, 'Escrow terms are required'],
    maxlength: [2000, 'Terms cannot exceed 2000 characters']
  },
  contractAddress: {
    type: String,
    required: [true, 'Contract address is required'],
    validate: {
      validator: function(v: string) {
        return /^lsk[a-z2-9]{38}$/.test(v);
      },
      message: 'Invalid contract address format'
    }
  },
  liskTransactionId: {
    type: String,
    validate: {
      validator: function(v: string) {
        return !v || /^[a-f0-9]{64}$/.test(v);
      },
      message: 'Invalid transaction ID format'
    }
  },
  releaseConditions: {
    requiresBuyerApproval: {
      type: Boolean,
      default: true
    },
    requiresSellerConfirmation: {
      type: Boolean,
      default: true
    },
    autoReleaseAfterHours: {
      type: Number,
      min: [1, 'Auto-release time must be at least 1 hour'],
      max: [8760, 'Auto-release time cannot exceed 1 year'] // 365 * 24
    },
    deliveryConfirmationRequired: {
      type: Boolean,
      default: false
    }
  },
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    fundedAt: Date,
    disputedAt: Date,
    completedAt: Date,
    refundedAt: Date,
    expiresAt: Date
  },
  disputeInfo: {
    disputeId: {
      type: Schema.Types.ObjectId,
      ref: 'Dispute'
    },
    reason: String,
    initiator: {
      type: String,
      enum: ['buyer', 'seller']
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved'],
      default: 'open'
    },
    createdAt: Date
  },
  metadata: {
    productInfo: {
      name: {
        type: String,
        maxlength: [200, 'Product name cannot exceed 200 characters']
      },
      description: {
        type: String,
        maxlength: [1000, 'Product description cannot exceed 1000 characters']
      },
      category: {
        type: String,
        maxlength: [50, 'Category cannot exceed 50 characters']
      },
      images: [{
        type: String,
        validate: {
          validator: function(v: string) {
            return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
          },
          message: 'Invalid image URL format'
        }
      }]
    },
    deliveryInfo: {
      method: {
        type: String,
        maxlength: [100, 'Delivery method cannot exceed 100 characters']
      },
      address: {
        type: String,
        maxlength: [500, 'Address cannot exceed 500 characters']
      },
      trackingNumber: {
        type: String,
        maxlength: [100, 'Tracking number cannot exceed 100 characters']
      },
      estimatedDelivery: Date
    },
    communications: {
      messages: [{
        sender: {
          type: String,
          enum: ['buyer', 'seller'],
          required: true
        },
        message: {
          type: String,
          required: true,
          maxlength: [1000, 'Message cannot exceed 1000 characters']
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        read: {
          type: Boolean,
          default: false
        }
      }]
    }
  }
}, {
  timestamps: true
});

// Validation to ensure buyer and seller are different
EscrowSchema.pre('save', function(next) {
  if (this.buyer.toString() === this.seller.toString()) {
    next(new Error('Buyer and seller cannot be the same user'));
  } else {
    next();
  }
});

// Indexes for efficient querying
EscrowSchema.index({ escrowId: 1 });
EscrowSchema.index({ buyer: 1, createdAt: -1 });
EscrowSchema.index({ seller: 1, createdAt: -1 });
EscrowSchema.index({ status: 1 });
EscrowSchema.index({ contractAddress: 1 });
EscrowSchema.index({ liskTransactionId: 1 });
EscrowSchema.index({ 'timeline.expiresAt': 1 });

export const Escrow = mongoose.model<IEscrow>('Escrow', EscrowSchema);
export default Escrow;