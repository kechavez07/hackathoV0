import mongoose, { Schema, Document } from 'mongoose';

export enum DisputeStatus {
  OPEN = 'open',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum DisputeType {
  DELIVERY_ISSUE = 'delivery_issue',
  PRODUCT_MISMATCH = 'product_mismatch',
  PAYMENT_DISPUTE = 'payment_dispute',
  COMMUNICATION_ISSUE = 'communication_issue',
  QUALITY_ISSUE = 'quality_issue',
  OTHER = 'other'
}

export enum DisputeResolution {
  FAVOR_BUYER = 'favor_buyer',
  FAVOR_SELLER = 'favor_seller',
  PARTIAL_REFUND = 'partial_refund',
  MEDIATED_AGREEMENT = 'mediated_agreement',
  NO_RESOLUTION = 'no_resolution'
}

export interface IDisputeMessage {
  _id?: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  senderRole: 'buyer' | 'seller' | 'admin';
  message: string;
  attachments?: string[];
  timestamp: Date;
  isInternal: boolean;
}

export interface IDispute extends Document {
  _id: mongoose.Types.ObjectId;
  disputeId: string;
  escrowId: string;
  initiator: mongoose.Types.ObjectId;
  initiatorRole: 'buyer' | 'seller';
  respondent: mongoose.Types.ObjectId;
  respondentRole: 'buyer' | 'seller';
  type: DisputeType;
  status: DisputeStatus;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  description: string;
  evidence: {
    files: string[];
    screenshots: string[];
    documents: string[];
    notes: string;
  };
  timeline: {
    createdAt: Date;
    firstResponseAt?: Date;
    escalatedAt?: Date;
    resolvedAt?: Date;
    closedAt?: Date;
    lastActivityAt: Date;
  };
  resolution?: {
    type: DisputeResolution;
    description: string;
    refundAmount?: string;
    additionalTerms?: string;
    resolvedBy: mongoose.Types.ObjectId;
    resolvedAt: Date;
  };
  messages: IDisputeMessage[];
  assignedTo?: mongoose.Types.ObjectId;
  metadata: {
    transactionAmount: string;
    escrowStatus: string;
    communicationHistory: number;
    previousDisputes: number;
    riskLevel: 'low' | 'medium' | 'high';
  };
  flags: {
    urgent: boolean;
    escalated: boolean;
    requiresAdmin: boolean;
    fraudSuspected: boolean;
    autoResolvable: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  addMessage(messageData: Partial<IDisputeMessage>): Promise<IDispute>;
  resolve(resolutionData: any): Promise<IDispute>;
  escalate(): Promise<IDispute>;
}

const DisputeMessageSchema = new Schema<IDisputeMessage>({
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Message sender is required']
  },
  senderRole: {
    type: String,
    required: [true, 'Sender role is required'],
    enum: ['buyer', 'seller', 'admin']
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    maxlength: [2000, 'Message cannot exceed 2000 characters'],
    trim: true
  },
  attachments: [{
    type: String,
    validate: {
      validator: function(v: string) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Invalid attachment URL format'
    }
  }],
  timestamp: {
    type: Date,
    default: Date.now
  },
  isInternal: {
    type: Boolean,
    default: false
  }
});

const DisputeSchema: Schema<IDispute> = new Schema({
  disputeId: {
    type: String,
    required: [true, 'Dispute ID is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^DSP_[A-Z0-9]{8}$/.test(v);
      },
      message: 'Invalid dispute ID format'
    }
  },
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
  initiator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dispute initiator is required']
  },
  initiatorRole: {
    type: String,
    required: [true, 'Initiator role is required'],
    enum: ['buyer', 'seller']
  },
  respondent: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Dispute respondent is required']
  },
  respondentRole: {
    type: String,
    required: [true, 'Respondent role is required'],
    enum: ['buyer', 'seller']
  },
  type: {
    type: String,
    required: [true, 'Dispute type is required'],
    enum: Object.values(DisputeType)
  },
  status: {
    type: String,
    required: [true, 'Dispute status is required'],
    enum: Object.values(DisputeStatus),
    default: DisputeStatus.OPEN
  },
  priority: {
    type: String,
    required: [true, 'Priority is required'],
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  subject: {
    type: String,
    required: [true, 'Dispute subject is required'],
    maxlength: [200, 'Subject cannot exceed 200 characters'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Dispute description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    trim: true
  },
  evidence: {
    files: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid file URL format'
      }
    }],
    screenshots: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v);
        },
        message: 'Invalid screenshot URL format'
      }
    }],
    documents: [{
      type: String,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(pdf|doc|docx|txt)$/i.test(v);
        },
        message: 'Invalid document URL format'
      }
    }],
    notes: {
      type: String,
      maxlength: [1000, 'Evidence notes cannot exceed 1000 characters']
    }
  },
  timeline: {
    createdAt: {
      type: Date,
      default: Date.now
    },
    firstResponseAt: Date,
    escalatedAt: Date,
    resolvedAt: Date,
    closedAt: Date,
    lastActivityAt: {
      type: Date,
      default: Date.now
    }
  },
  resolution: {
    type: {
      type: String,
      enum: Object.values(DisputeResolution)
    },
    description: {
      type: String,
      maxlength: [1000, 'Resolution description cannot exceed 1000 characters']
    },
    refundAmount: {
      type: String,
      validate: {
        validator: function(v: string) {
          return !v || (/^\d+$/.test(v) && BigInt(v) >= 0);
        },
        message: 'Refund amount must be a valid non-negative number'
      }
    },
    additionalTerms: {
      type: String,
      maxlength: [500, 'Additional terms cannot exceed 500 characters']
    },
    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date
  },
  messages: [DisputeMessageSchema],
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    transactionAmount: {
      type: String,
      required: [true, 'Transaction amount is required'],
      validate: {
        validator: function(v: string) {
          return /^\d+$/.test(v) && BigInt(v) > 0;
        },
        message: 'Transaction amount must be a valid positive number'
      }
    },
    escrowStatus: {
      type: String,
      required: [true, 'Escrow status is required']
    },
    communicationHistory: {
      type: Number,
      default: 0,
      min: [0, 'Communication history cannot be negative']
    },
    previousDisputes: {
      type: Number,
      default: 0,
      min: [0, 'Previous disputes cannot be negative']
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'low'
    }
  },
  flags: {
    urgent: {
      type: Boolean,
      default: false
    },
    escalated: {
      type: Boolean,
      default: false
    },
    requiresAdmin: {
      type: Boolean,
      default: false
    },
    fraudSuspected: {
      type: Boolean,
      default: false
    },
    autoResolvable: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

DisputeSchema.pre('save', function(next) {
  if (this.initiator.toString() === this.respondent.toString()) {
    next(new Error('Initiator and respondent cannot be the same user'));
  } else {
    this.timeline.lastActivityAt = new Date();
    next();
  }
});

DisputeSchema.pre('save', function(next) {
  const amount = BigInt(this.metadata.transactionAmount);
  
  if (amount > BigInt('10000000000000')) {
    this.priority = 'urgent';
    this.flags.requiresAdmin = true;
  } else if (amount > BigInt('1000000000000')) {
    this.priority = 'high';
  } else if (amount > BigInt('100000000000')) {
    this.priority = 'medium';
  } else {
    this.priority = 'low';
  }

  if (this.metadata.previousDisputes > 2) {
    this.metadata.riskLevel = 'high';
    this.flags.requiresAdmin = true;
  } else if (this.metadata.previousDisputes > 0) {
    this.metadata.riskLevel = 'medium';
  }

  next();
});

DisputeSchema.methods.addMessage = function(messageData: Partial<IDisputeMessage>) {
  this.messages.push(messageData);
  this.timeline.lastActivityAt = new Date();
  
  if (!this.timeline.firstResponseAt && messageData.senderRole !== this.initiatorRole) {
    this.timeline.firstResponseAt = new Date();
  }
  
  return this.save();
};

DisputeSchema.methods.resolve = function(resolutionData: any) {
  this.status = DisputeStatus.RESOLVED;
  this.resolution = {
    ...resolutionData,
    resolvedAt: new Date()
  };
  this.timeline.resolvedAt = new Date();
  this.timeline.lastActivityAt = new Date();
  
  return this.save();
};

DisputeSchema.methods.escalate = function() {
  this.flags.escalated = true;
  this.flags.requiresAdmin = true;
  this.priority = this.priority === 'urgent' ? 'urgent' : 'high';
  this.timeline.escalatedAt = new Date();
  this.timeline.lastActivityAt = new Date();
  
  return this.save();
};

DisputeSchema.index({ disputeId: 1 });
DisputeSchema.index({ escrowId: 1 });
DisputeSchema.index({ initiator: 1, createdAt: -1 });
DisputeSchema.index({ respondent: 1, createdAt: -1 });
DisputeSchema.index({ status: 1, priority: -1 });
DisputeSchema.index({ assignedTo: 1, status: 1 });
DisputeSchema.index({ 'flags.urgent': 1, createdAt: -1 });
DisputeSchema.index({ 'timeline.lastActivityAt': -1 });

export const Dispute = mongoose.model<IDispute>('Dispute', DisputeSchema);
export default Dispute;