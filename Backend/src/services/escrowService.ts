import { Escrow, IEscrow, EscrowStatus } from '../models/Escrow';
import { Transaction, TransactionStatus, TransactionType } from '../models/Transaction';
import { User } from '../models/User';
import { liskService } from './liskService';
import { config } from '../config/environment';
import { v4 as uuidv4 } from 'uuid';

interface CreateEscrowData {
  buyerId: string;
  sellerId: string;
  amount: string;
  description: string;
  terms: string;
  productInfo?: {
    name: string;
    description: string;
    category: string;
    images?: string[];
  };
  deliveryInfo?: {
    method: string;
    address?: string;
    estimatedDelivery?: Date;
  };
  autoReleaseHours?: number;
}

interface ReleaseEscrowData {
  escrowId: string;
  releasedBy: string;
  reason?: string;
}

export class EscrowService {
  private static instance: EscrowService;

  private constructor() {}

  public static getInstance(): EscrowService {
    if (!EscrowService.instance) {
      EscrowService.instance = new EscrowService();
    }
    return EscrowService.instance;
  }

  public async createEscrow(data: CreateEscrowData): Promise<IEscrow> {
    try {
      // Verify users exist
      const buyer = await User.findById(data.buyerId);
      const seller = await User.findById(data.sellerId);

      if (!buyer || !seller) {
        throw new Error('Buyer or seller not found');
      }

      if (data.buyerId === data.sellerId) {
        throw new Error('Buyer and seller cannot be the same user');
      }

      // Calculate escrow fee
      const amount = BigInt(data.amount);
      const feePercent = config.escrow.escrowFeePercent;
      const fee = (amount * BigInt(Math.floor(feePercent * 100))) / BigInt(10000);

      // Generate unique escrow ID
      const escrowId = `ESC_${this.generateShortId()}`;

      // Create mock contract address (in real implementation, this would be deployed to Lisk)
      const contractAddress = `lsk${this.generateShortId().toLowerCase()}${'0'.repeat(30)}`;

      // Set expiration time
      const expiresAt = data.autoReleaseHours ? 
        new Date(Date.now() + data.autoReleaseHours * 60 * 60 * 1000) : 
        new Date(Date.now() + config.escrow.disputeTimeoutHours * 60 * 60 * 1000);

      // Create escrow record
      const escrow = new Escrow({
        escrowId,
        buyer: data.buyerId,
        seller: data.sellerId,
        amount: data.amount,
        fee: fee.toString(),
        description: data.description,
        terms: data.terms,
        contractAddress,
        status: EscrowStatus.CREATED,
        releaseConditions: {
          requiresBuyerApproval: true,
          requiresSellerConfirmation: true,
          autoReleaseAfterHours: data.autoReleaseHours,
          deliveryConfirmationRequired: true
        },
        timeline: {
          createdAt: new Date(),
          expiresAt
        },
        metadata: {
          productInfo: data.productInfo,
          deliveryInfo: data.deliveryInfo,
          communications: { messages: [] }
        }
      });

      await escrow.save();

      // Create blockchain transaction for escrow creation
      try {
        const liskTx = await liskService.createEscrowTransaction(
          buyer.liskAddress,
          buyer.publicKey,
          {
            amount: data.amount,
            recipientAddress: seller.liskAddress,
            description: data.description,
            terms: data.terms,
            escrowId
          },
          '0' // Mock nonce
        );

        // Submit transaction to Lisk network
        const txHash = await liskService.submitTransaction(liskTx);

        // Record transaction
        const transaction = new Transaction({
          txHash,
          type: TransactionType.ESCROW_CREATE,
          status: TransactionStatus.PENDING,
          amount: data.amount,
          fee: fee.toString(),
          sender: data.buyerId,
          recipient: data.sellerId,
          escrowId: escrow._id,
          metadata: {
            description: `Escrow creation: ${data.description}`,
            contractAddress
          },
          liskData: {
            moduleID: liskTx.moduleID,
            assetID: liskTx.assetID,
            nonce: liskTx.nonce,
            senderPublicKey: liskTx.senderPublicKey,
            signatures: liskTx.signatures
          }
        });

        await transaction.save();
        escrow.liskTransactionId = txHash;
        await escrow.save();

        console.log(`✅ Escrow created successfully: ${escrowId} (TX: ${txHash})`);
        
      } catch (blockchainError) {
        console.error('⚠️ Blockchain transaction failed, escrow created in pending state:', blockchainError);
      }

      return escrow;

    } catch (error) {
      console.error('❌ Error creating escrow:', error);
      throw error;
    }
  }

  public async fundEscrow(escrowId: string, fundedBy: string): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId }).populate('buyer seller');
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.CREATED) {
        throw new Error('Escrow is not in created state');
      }

      // Verify funding user is the buyer
      if (escrow.buyer._id.toString() !== fundedBy) {
        throw new Error('Only buyer can fund the escrow');
      }

      // Update escrow status
      escrow.status = EscrowStatus.FUNDED;
      escrow.timeline.fundedAt = new Date();
      await escrow.save();

      console.log(`💰 Escrow funded successfully: ${escrowId}`);
      return escrow;

    } catch (error) {
      console.error('❌ Error funding escrow:', error);
      throw error;
    }
  }

  public async releaseEscrow(data: ReleaseEscrowData): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId: data.escrowId }).populate('buyer seller');
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      if (escrow.status !== EscrowStatus.FUNDED) {
        throw new Error('Escrow is not funded');
      }

      const user = await User.findById(data.releasedBy);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify user can release escrow (buyer or seller)
      const isBuyer = escrow.buyer._id.toString() === data.releasedBy;
      const isSeller = escrow.seller._id.toString() === data.releasedBy;
      
      if (!isBuyer && !isSeller) {
        throw new Error('Only buyer or seller can release escrow');
      }

      // Create blockchain transaction for escrow release
      try {
        const liskTx = await liskService.releaseEscrowTransaction(
          user.liskAddress,
          user.publicKey,
          data.escrowId,
          '1' // Mock nonce
        );

        const txHash = await liskService.submitTransaction(liskTx);

        // Record release transaction
        const transaction = new Transaction({
          txHash,
          type: TransactionType.ESCROW_RELEASE,
          status: TransactionStatus.PENDING,
          amount: escrow.amount,
          fee: await liskService.estimateFee(liskTx.assetID),
          sender: data.releasedBy,
          recipient: isBuyer ? escrow.seller._id : escrow.buyer._id,
          escrowId: escrow._id,
          metadata: {
            description: `Escrow release: ${data.reason || 'Transaction completed'}`,
            releasedBy: isBuyer ? 'buyer' : 'seller'
          },
          liskData: {
            moduleID: liskTx.moduleID,
            assetID: liskTx.assetID,
            nonce: liskTx.nonce,
            senderPublicKey: liskTx.senderPublicKey,
            signatures: liskTx.signatures
          }
        });

        await transaction.save();

        // Update escrow status
        escrow.status = EscrowStatus.COMPLETED;
        escrow.timeline.completedAt = new Date();
        await escrow.save();

        // Update user transaction counts
        await this.updateUserTransactionStats(escrow.buyer._id.toString(), escrow.seller._id.toString(), true);

        console.log(`🔓 Escrow released successfully: ${data.escrowId} by ${isBuyer ? 'buyer' : 'seller'}`);
        
      } catch (blockchainError) {
        console.error('⚠️ Blockchain release failed:', blockchainError);
        throw new Error('Failed to release escrow on blockchain');
      }

      return escrow;

    } catch (error) {
      console.error('❌ Error releasing escrow:', error);
      throw error;
    }
  }

  public async getEscrow(escrowId: string): Promise<IEscrow | null> {
    try {
      const escrow = await Escrow.findOne({ escrowId })
        .populate('buyer', 'username email liskAddress reputationScore')
        .populate('seller', 'username email liskAddress reputationScore');
      
      return escrow;
    } catch (error) {
      console.error('❌ Error getting escrow:', error);
      throw error;
    }
  }

  public async getUserEscrows(userId: string, status?: EscrowStatus): Promise<IEscrow[]> {
    try {
      const filter: any = {
        $or: [
          { buyer: userId },
          { seller: userId }
        ]
      };

      if (status) {
        filter.status = status;
      }

      const escrows = await Escrow.find(filter)
        .populate('buyer', 'username email liskAddress reputationScore')
        .populate('seller', 'username email liskAddress reputationScore')
        .sort({ createdAt: -1 });

      return escrows;
    } catch (error) {
      console.error('❌ Error getting user escrows:', error);
      throw error;
    }
  }

  public async addMessage(escrowId: string, sender: string, message: string): Promise<IEscrow> {
    try {
      const escrow = await Escrow.findOne({ escrowId });
      if (!escrow) {
        throw new Error('Escrow not found');
      }

      // Verify sender is buyer or seller
      const isBuyer = escrow.buyer.toString() === sender;
      const isSeller = escrow.seller.toString() === sender;
      
      if (!isBuyer && !isSeller) {
        throw new Error('Only buyer or seller can add messages');
      }

      escrow.metadata.communications.messages.push({
        sender: isBuyer ? 'buyer' : 'seller',
        message,
        timestamp: new Date(),
        read: false
      });

      await escrow.save();
      
      console.log(`💬 Message added to escrow ${escrowId}`);
      return escrow;
      
    } catch (error) {
      console.error('❌ Error adding message:', error);
      throw error;
    }
  }

  private async updateUserTransactionStats(buyerId: string, sellerId: string, completed: boolean): Promise<void> {
    try {
      // Update buyer stats
      await User.findByIdAndUpdate(buyerId, {
        $inc: {
          totalTransactions: 1,
          completedTransactions: completed ? 1 : 0
        }
      });

      // Update seller stats
      await User.findByIdAndUpdate(sellerId, {
        $inc: {
          totalTransactions: 1,
          completedTransactions: completed ? 1 : 0
        }
      });

      console.log(`📊 Updated transaction stats for users`);
    } catch (error) {
      console.error('❌ Error updating user stats:', error);
    }
  }

  private generateShortId(): string {
    return uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
  }
}

export const escrowService = EscrowService.getInstance();
export default escrowService;