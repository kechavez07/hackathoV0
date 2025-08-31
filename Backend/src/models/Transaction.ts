import mongoose, { Schema, Document } from 'mongoose';

export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum TransactionType {
  ESCROW_CREATE = 'escrow_create',
  ESCROW_RELEASE = 'escrow_release',
  ESCROW_REFUND = 'escrow_refund',
  REPUTATION_UPDATE = 'reputation_update',
  DISPUTE_CREATE = 'dispute_create',
  DISPUTE_RESOLVE = 'dispute_resolve'
}

export interface ITransaction extends Document {
  _id: mongoose.Types.ObjectId;
  txHash: string;
  blockHeight?: number;
  type: TransactionType;
  status: TransactionStatus;
  amount: string;
  fee: string;
  sender: mongoose.Types.ObjectId;
  recipient?: mongoose.Types.ObjectId;
  escrowId?: mongoose.Types.ObjectId;
  disputeId?: mongoose.Types.ObjectId;
  metadata: {
    description?: string;
    contractAddress?: string;
    gasUsed?: number;
    confirmations?: number;
    [key: string]: any;
  };
  liskData: {
    moduleID: number;
    assetID: number;
    nonce: string;
    senderPublicKey: string;
    signatures: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema({
  txHash: {
    type: String,
    required: [true, 'Transaction hash is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^[a-f0-9]{64}$/.test(v);
      },
      message: 'Invalid transaction hash format'
    }
  },
  blockHeight: {
    type: Number,
    min: [0, 'Block height cannot be negative']
  },
  type: {
    type: String,
    required: [true, 'Transaction type is required'],
    enum: Object.values(TransactionType)
  },
  status: {
    type: String,
    required: [true, 'Transaction status is required'],
    enum: Object.values(TransactionStatus),
    default: TransactionStatus.PENDING
  },
  amount: {
    type: String,
    required: [true, 'Transaction amount is required'],
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v) && BigInt(v) >= 0;
      },
      message: 'Amount must be a valid positive number in beddows'
    }
  },
  fee: {
    type: String,
    required: [true, 'Transaction fee is required'],
    validate: {
      validator: function(v: string) {
        return /^\d+$/.test(v) && BigInt(v) >= 0;
      },
      message: 'Fee must be a valid positive number in beddows'
    }
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  escrowId: {
    type: Schema.Types.ObjectId,
    ref: 'Escrow'
  },
  disputeId: {
    type: Schema.Types.ObjectId,
    ref: 'Dispute'
  },
  metadata: {
    description: String,
    contractAddress: String,
    gasUsed: Number,
    confirmations: {
      type: Number,
      default: 0
    }
  },
  liskData: {
    moduleID: {
      type: Number,
      required: [true, 'Module ID is required']
    },
    assetID: {
      type: Number,
      required: [true, 'Asset ID is required']
    },
    nonce: {
      type: String,
      required: [true, 'Nonce is required']
    },
    senderPublicKey: {
      type: String,
      required: [true, 'Sender public key is required'],
      validate: {
        validator: function(v: string) {
          return /^[a-f0-9]{64}$/.test(v);
        },
        message: 'Invalid public key format'
      }
    },
    signatures: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^[a-f0-9]{128}$/.test(v);
        },
        message: 'Invalid signature format'
      }
    }]
  },
  confirmedAt: {
    type: Date
  }
}, {
  timestamps: true
});

TransactionSchema.index({ txHash: 1 });
TransactionSchema.index({ sender: 1, createdAt: -1 });
TransactionSchema.index({ recipient: 1, createdAt: -1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ escrowId: 1 });
TransactionSchema.index({ blockHeight: 1 });

TransactionSchema.pre('save', function(next) {
  if (this.status === TransactionStatus.CONFIRMED && !this.confirmedAt) {
    this.confirmedAt = new Date();
  }
  next();
});

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;