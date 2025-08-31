import { Dispute, IDispute, DisputeStatus, DisputeType, DisputeResolution } from '../models/Dispute';
import { Escrow, EscrowStatus } from '../models/Escrow';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';

interface CreateDisputeData {
  escrowId: string;
  initiatorId: string;
  type: DisputeType;
  subject: string;
  description: string;
  evidence?: {
    files?: string[];
    screenshots?: string[];
    documents?: string[];
    notes?: string;
  };
}

interface ResolveDisputeData {
  disputeId: string;
  resolutionType: DisputeResolution;
  description: string;
  refundAmount?: string;
  additionalTerms?: string;
  resolvedBy: string;
}

interface AddMessageData {
  disputeId: string;
  sender: string;
  message: string;
  attachments?: string[];
  isInternal?: boolean;
}

export class DisputeService {
  private static instance: DisputeService;

  private constructor() {}

  public static getInstance(): DisputeService {
    if (!DisputeService.instance) {
      DisputeService.instance = new DisputeService();
    }
    return DisputeService.instance;
  }

  public async createDispute(data: CreateDisputeData): Promise<IDispute> {
    try {
      const escrow = await Escrow.findOne({ escrowId: data.escrowId }).populate('buyer seller');
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status === EscrowStatus.COMPLETED) {
        throw new Error('Cannot dispute completed escrows');
      }

      if (escrow.status === EscrowStatus.CREATED) {
        throw new Error('Cannot dispute unfunded escrows');
      }

      const initiator = await User.findById(data.initiatorId);
      if (!initiator) {
        throw new Error('Initiator user not found');
      }

      const isBuyer = escrow.buyer._id.toString() === data.initiatorId;
      const isSeller = escrow.seller._id.toString() === data.initiatorId;

      if (!isBuyer && !isSeller) {
        throw new Error('Only escrow participants can create disputes');
      }

      const existingDispute = await Dispute.findOne({
        escrowId: data.escrowId,
        status: { $in: [DisputeStatus.OPEN, DisputeStatus.INVESTIGATING] }
      });

      if (existingDispute) {
        throw new Error('An active dispute already exists for this escrow');
      }

      const disputeId = `DSP_${this.generateShortId()}`;
      const initiatorRole = isBuyer ? 'buyer' : 'seller';
      const respondentRole = isBuyer ? 'seller' : 'buyer';
      const respondent = isBuyer ? escrow.seller._id : escrow.buyer._id;

      const previousDisputes = await this.getPreviousDisputeCount(data.initiatorId);

      const dispute = new Dispute({
        disputeId,
        escrowId: data.escrowId,
        initiator: data.initiatorId,
        initiatorRole,
        respondent,
        respondentRole,
        type: data.type,
        status: DisputeStatus.OPEN,
        subject: data.subject,
        description: data.description,
        evidence: data.evidence || {
          files: [],
          screenshots: [],
          documents: [],
          notes: ''
        },
        messages: [{
          sender: data.initiatorId,
          senderRole: initiatorRole,
          message: `Dispute created: ${data.subject}`,
          timestamp: new Date(),
          isInternal: false
        }],
        metadata: {
          transactionAmount: escrow.amount,
          escrowStatus: escrow.status,
          communicationHistory: escrow.metadata.communications.messages.length,
          previousDisputes,
          riskLevel: previousDisputes > 2 ? 'high' : previousDisputes > 0 ? 'medium' : 'low'
        },
        flags: {
          urgent: false,
          escalated: false,
          requiresAdmin: previousDisputes > 2,
          fraudSuspected: false,
          autoResolvable: data.type === DisputeType.COMMUNICATION_ISSUE
        }
      });

      await dispute.save();

      await Escrow.findOneAndUpdate(
        { escrowId: data.escrowId },
        {
          status: EscrowStatus.DISPUTED,
          'timeline.disputedAt': new Date(),
          'disputeInfo': {
            disputeId: dispute._id,
            reason: data.subject,
            initiator: initiatorRole,
            status: 'open',
            createdAt: new Date()
          }
        }
      );

      console.log(`⚖️ Dispute created: ${disputeId} for escrow ${data.escrowId} by ${initiatorRole}`);
      return dispute;

    } catch (error) {
      console.error('❌ Error creating dispute:', error);
      throw error;
    }
  }

  public async getDispute(disputeId: string): Promise<IDispute | null> {
    try {
      const dispute = await Dispute.findOne({ disputeId })
        .populate('initiator', 'username email')
        .populate('respondent', 'username email')
        .populate('assignedTo', 'username email')
        .populate('messages.sender', 'username');

      return dispute;
    } catch (error) {
      console.error('❌ Error getting dispute:', error);
      throw error;
    }
  }

  public async getUserDisputes(userId: string, status?: DisputeStatus): Promise<IDispute[]> {
    try {
      const filter: any = {
        $or: [
          { initiator: userId },
          { respondent: userId }
        ]
      };

      if (status) {
        filter.status = status;
      }

      const disputes = await Dispute.find(filter)
        .populate('initiator', 'username email')
        .populate('respondent', 'username email')
        .populate('assignedTo', 'username email')
        .sort({ 'timeline.lastActivityAt': -1 });

      return disputes;
    } catch (error) {
      console.error('❌ Error getting user disputes:', error);
      throw error;
    }
  }

  public async getEscrowDisputes(escrowId: string): Promise<IDispute[]> {
    try {
      const disputes = await Dispute.find({ escrowId })
        .populate('initiator', 'username email')
        .populate('respondent', 'username email')
        .populate('assignedTo', 'username email')
        .sort({ createdAt: -1 });

      return disputes;
    } catch (error) {
      console.error('❌ Error getting escrow disputes:', error);
      throw error;
    }
  }

  public async addMessage(data: AddMessageData): Promise<IDispute> {
    try {
      const dispute = await Dispute.findOne({ disputeId: data.disputeId })
        .populate('initiator respondent');

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (dispute.status === DisputeStatus.CLOSED || dispute.status === DisputeStatus.RESOLVED) {
        throw new Error('Cannot add messages to closed or resolved disputes');
      }

      const sender = await User.findById(data.sender);
      if (!sender) {
        throw new Error('Sender not found');
      }

      const isInitiator = dispute.initiator._id.toString() === data.sender;
      const isRespondent = dispute.respondent._id.toString() === data.sender;
      const isAdmin = false; // For hackathon, no admin users

      if (!isInitiator && !isRespondent && !isAdmin) {
        throw new Error('Only dispute participants can add messages');
      }

      const senderRole = isInitiator ? dispute.initiatorRole : 
                        isRespondent ? dispute.respondentRole : 'admin';

      await dispute.addMessage({
        sender: data.sender as any,
        senderRole,
        message: data.message,
        attachments: data.attachments || [],
        timestamp: new Date(),
        isInternal: data.isInternal || false
      });

      console.log(`💬 Message added to dispute ${data.disputeId} by ${senderRole}`);
      return dispute;

    } catch (error) {
      console.error('❌ Error adding message to dispute:', error);
      throw error;
    }
  }

  public async resolveDispute(data: ResolveDisputeData): Promise<IDispute> {
    try {
      const dispute = await Dispute.findOne({ disputeId: data.disputeId })
        .populate('initiator respondent');

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.CLOSED) {
        throw new Error('Dispute is already resolved or closed');
      }

      const resolver = await User.findById(data.resolvedBy);
      if (!resolver) {
        throw new Error('Resolver user not found');
      }

      const escrow = await Escrow.findOne({ escrowId: dispute.escrowId });
      if (!escrow) {
        throw new Error('Associated escrow not found');
      }

      await dispute.resolve({
        type: data.resolutionType,
        description: data.description,
        refundAmount: data.refundAmount,
        additionalTerms: data.additionalTerms,
        resolvedBy: data.resolvedBy
      });

      let newEscrowStatus: EscrowStatus;
      switch (data.resolutionType) {
        case DisputeResolution.FAVOR_BUYER:
        case DisputeResolution.PARTIAL_REFUND:
          newEscrowStatus = EscrowStatus.REFUNDED;
          break;
        case DisputeResolution.FAVOR_SELLER:
          newEscrowStatus = EscrowStatus.COMPLETED;
          break;
        case DisputeResolution.MEDIATED_AGREEMENT:
          newEscrowStatus = EscrowStatus.COMPLETED;
          break;
        default:
          newEscrowStatus = EscrowStatus.DISPUTED;
      }

      await Escrow.findOneAndUpdate(
        { escrowId: dispute.escrowId },
        {
          status: newEscrowStatus,
          'disputeInfo.status': 'resolved'
        }
      );

      await dispute.addMessage({
        sender: data.resolvedBy as any,
        senderRole: 'admin',
        message: `Dispute resolved: ${data.resolutionType} - ${data.description}`,
        timestamp: new Date(),
        isInternal: false
      });

      console.log(`✅ Dispute resolved: ${data.disputeId} with resolution ${data.resolutionType}`);
      return dispute;

    } catch (error) {
      console.error('❌ Error resolving dispute:', error);
      throw error;
    }
  }

  public async escalateDispute(disputeId: string, userId: string, reason: string): Promise<IDispute> {
    try {
      const dispute = await Dispute.findOne({ disputeId })
        .populate('initiator respondent');

      if (!dispute) {
        throw new Error('Dispute not found');
      }

      const isParticipant = dispute.initiator._id.toString() === userId ||
                           dispute.respondent._id.toString() === userId;

      if (!isParticipant) {
        throw new Error('Only dispute participants can escalate');
      }

      if (dispute.flags.escalated) {
        throw new Error('Dispute is already escalated');
      }

      await dispute.escalate();

      await dispute.addMessage({
        sender: userId as any,
        senderRole: dispute.initiator._id.toString() === userId ? dispute.initiatorRole : dispute.respondentRole,
        message: `Dispute escalated: ${reason}`,
        timestamp: new Date(),
        isInternal: false
      });

      console.log(`🔺 Dispute escalated: ${disputeId} by user ${userId}`);
      return dispute;

    } catch (error) {
      console.error('❌ Error escalating dispute:', error);
      throw error;
    }
  }

  public async canUserCreateDispute(escrowId: string, userId: string): Promise<{ canCreate: boolean; reason?: string }> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      if (!escrow) {
        return { canCreate: false, reason: 'Escrow not found' };
      }

      const isBuyer = escrow.buyer.toString() === userId;
      const isSeller = escrow.seller.toString() === userId;

      if (!isBuyer && !isSeller) {
        return { canCreate: false, reason: 'Only escrow participants can create disputes' };
      }

      if (escrow.status === EscrowStatus.COMPLETED) {
        return { canCreate: false, reason: 'Cannot dispute completed escrows' };
      }

      if (escrow.status === EscrowStatus.CREATED) {
        return { canCreate: false, reason: 'Cannot dispute unfunded escrows' };
      }

      const existingDispute = await Dispute.findOne({
        escrowId,
        status: { $in: [DisputeStatus.OPEN, DisputeStatus.INVESTIGATING] }
      });

      if (existingDispute) {
        return { canCreate: false, reason: 'An active dispute already exists for this escrow' };
      }

      return { canCreate: true };

    } catch (error) {
      console.error('❌ Error checking if user can create dispute:', error);
      return { canCreate: false, reason: 'Error checking dispute permission' };
    }
  }

  private async getPreviousDisputeCount(userId: string): Promise<number> {
    try {
      const count = await Dispute.countDocuments({
        $or: [
          { initiator: userId },
          { respondent: userId }
        ]
      });
      return count;
    } catch (error) {
      console.error('❌ Error getting previous dispute count:', error);
      return 0;
    }
  }

  private generateShortId(): string {
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  }
}

export const disputeService = DisputeService.getInstance();
export default disputeService;