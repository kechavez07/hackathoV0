import { Request, Response } from 'express';
import { disputeService } from '../services/disputeService';
import { DisputeType, DisputeStatus, DisputeResolution } from '../models/Dispute';
import { AuthRequest } from '../middleware/auth';

export class DisputeController {

  public async createDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { escrowId, type, subject, description, evidence } = req.body;
      const initiatorId = req.userId!;

      if (!escrowId || !type || !subject || !description) {
        res.status(400).json({
          success: false,
          message: 'Escrow ID, type, subject, and description are required'
        });
        return;
      }

      if (!Object.values(DisputeType).includes(type)) {
        res.status(400).json({
          success: false,
          message: 'Invalid dispute type',
          validTypes: Object.values(DisputeType)
        });
        return;
      }

      const dispute = await disputeService.createDispute({
        escrowId,
        initiatorId,
        type,
        subject,
        description,
        evidence
      });

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        data: {
          dispute: {
            disputeId: dispute.disputeId,
            escrowId: dispute.escrowId,
            type: dispute.type,
            status: dispute.status,
            subject: dispute.subject,
            description: dispute.description,
            initiatorRole: dispute.initiatorRole,
            priority: dispute.priority,
            createdAt: dispute.createdAt,
            flags: dispute.flags
          }
        }
      });

    } catch (error: any) {
      console.error('Error in createDispute:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to create dispute',
        error: error.message
      });
    }
  }

  public async getDispute(req: Request, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;

      if (!disputeId) {
        res.status(400).json({
          success: false,
          message: 'Dispute ID is required'
        });
        return;
      }

      const dispute = await disputeService.getDispute(disputeId);

      if (!dispute) {
        res.status(404).json({
          success: false,
          message: 'Dispute not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: 'Dispute retrieved successfully',
        data: {
          dispute: {
            disputeId: dispute.disputeId,
            escrowId: dispute.escrowId,
            type: dispute.type,
            status: dispute.status,
            priority: dispute.priority,
            subject: dispute.subject,
            description: dispute.description,
            initiator: dispute.initiator,
            respondent: dispute.respondent,
            initiatorRole: dispute.initiatorRole,
            respondentRole: dispute.respondentRole,
            evidence: dispute.evidence,
            timeline: dispute.timeline,
            resolution: dispute.resolution,
            messages: dispute.messages.map(msg => ({
              id: msg._id,
              sender: msg.sender,
              senderRole: msg.senderRole,
              message: msg.message,
              attachments: msg.attachments,
              timestamp: msg.timestamp,
              isInternal: msg.isInternal
            })),
            metadata: dispute.metadata,
            flags: dispute.flags,
            assignedTo: dispute.assignedTo,
            createdAt: dispute.createdAt,
            updatedAt: dispute.updatedAt
          }
        }
      });

    } catch (error: any) {
      console.error('Error in getDispute:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get dispute',
        error: error.message
      });
    }
  }

  public async getUserDisputes(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.userId!;
      const status = req.query.status as DisputeStatus;

      if (status && !Object.values(DisputeStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: 'Invalid status filter',
          validStatuses: Object.values(DisputeStatus)
        });
        return;
      }

      const disputes = await disputeService.getUserDisputes(userId, status);

      res.status(200).json({
        success: true,
        message: 'User disputes retrieved successfully',
        data: {
          disputes: disputes.map(dispute => ({
            disputeId: dispute.disputeId,
            escrowId: dispute.escrowId,
            type: dispute.type,
            status: dispute.status,
            priority: dispute.priority,
            subject: dispute.subject,
            initiator: dispute.initiator,
            respondent: dispute.respondent,
            initiatorRole: dispute.initiatorRole,
            respondentRole: dispute.respondentRole,
            timeline: dispute.timeline,
            metadata: dispute.metadata,
            flags: dispute.flags,
            messageCount: dispute.messages.length,
            createdAt: dispute.createdAt
          })),
          total: disputes.length
        }
      });

    } catch (error: any) {
      console.error('Error in getUserDisputes:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get user disputes',
        error: error.message
      });
    }
  }

  public async getEscrowDisputes(req: Request, res: Response): Promise<void> {
    try {
      const { escrowId } = req.params;

      if (!escrowId) {
        res.status(400).json({
          success: false,
          message: 'Escrow ID is required'
        });
        return;
      }

      const disputes = await disputeService.getEscrowDisputes(escrowId);

      res.status(200).json({
        success: true,
        message: 'Escrow disputes retrieved successfully',
        data: {
          escrowId,
          disputes: disputes.map(dispute => ({
            disputeId: dispute.disputeId,
            type: dispute.type,
            status: dispute.status,
            priority: dispute.priority,
            subject: dispute.subject,
            initiator: dispute.initiator,
            respondent: dispute.respondent,
            initiatorRole: dispute.initiatorRole,
            timeline: dispute.timeline,
            resolution: dispute.resolution,
            flags: dispute.flags,
            messageCount: dispute.messages.length,
            createdAt: dispute.createdAt
          })),
          total: disputes.length
        }
      });

    } catch (error: any) {
      console.error('Error in getEscrowDisputes:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to get escrow disputes',
        error: error.message
      });
    }
  }

  public async addMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const { message, attachments, isInternal } = req.body;
      const sender = req.userId!;

      if (!disputeId || !message) {
        res.status(400).json({
          success: false,
          message: 'Dispute ID and message are required'
        });
        return;
      }

      if (message.length > 2000) {
        res.status(400).json({
          success: false,
          message: 'Message cannot exceed 2000 characters'
        });
        return;
      }

      const dispute = await disputeService.addMessage({
        disputeId,
        sender,
        message,
        attachments,
        isInternal
      });

      res.status(200).json({
        success: true,
        message: 'Message added successfully',
        data: {
          disputeId: dispute.disputeId,
          messageCount: dispute.messages.length,
          lastActivity: dispute.timeline.lastActivityAt
        }
      });

    } catch (error: any) {
      console.error('Error in addMessage:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to add message',
        error: error.message
      });
    }
  }

  public async resolveDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const { resolutionType, description, refundAmount, additionalTerms } = req.body;
      const resolvedBy = req.userId!;

      if (!disputeId || !resolutionType || !description) {
        res.status(400).json({
          success: false,
          message: 'Dispute ID, resolution type, and description are required'
        });
        return;
      }

      if (!Object.values(DisputeResolution).includes(resolutionType)) {
        res.status(400).json({
          success: false,
          message: 'Invalid resolution type',
          validResolutions: Object.values(DisputeResolution)
        });
        return;
      }

      const dispute = await disputeService.resolveDispute({
        disputeId,
        resolutionType,
        description,
        refundAmount,
        additionalTerms,
        resolvedBy
      });

      res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully',
        data: {
          disputeId: dispute.disputeId,
          status: dispute.status,
          resolution: dispute.resolution,
          resolvedAt: dispute.timeline.resolvedAt
        }
      });

    } catch (error: any) {
      console.error('Error in resolveDispute:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to resolve dispute',
        error: error.message
      });
    }
  }

  public async escalateDispute(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { disputeId } = req.params;
      const { reason } = req.body;
      const userId = req.userId!;

      if (!disputeId || !reason) {
        res.status(400).json({
          success: false,
          message: 'Dispute ID and reason are required'
        });
        return;
      }

      const dispute = await disputeService.escalateDispute(disputeId, userId, reason);

      res.status(200).json({
        success: true,
        message: 'Dispute escalated successfully',
        data: {
          disputeId: dispute.disputeId,
          status: dispute.status,
          priority: dispute.priority,
          flags: dispute.flags,
          escalatedAt: dispute.timeline.escalatedAt
        }
      });

    } catch (error: any) {
      console.error('Error in escalateDispute:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to escalate dispute',
        error: error.message
      });
    }
  }

  public async checkCanCreateDispute(req: AuthRequest, res: Response): Promise<void> {
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

      const canCreateResult = await disputeService.canUserCreateDispute(escrowId, userId);

      res.status(200).json({
        success: true,
        message: 'Dispute creation permission checked successfully',
        data: {
          escrowId,
          userId,
          canCreate: canCreateResult.canCreate,
          reason: canCreateResult.reason
        }
      });

    } catch (error: any) {
      console.error('Error in checkCanCreateDispute:', error);
      res.status(400).json({
        success: false,
        message: 'Failed to check dispute creation permission',
        error: error.message
      });
    }
  }

  public async getDisputeTypes(req: Request, res: Response): Promise<void> {
    try {
      const disputeTypes = Object.values(DisputeType).map(type => ({
        value: type,
        label: type.split('_').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ')
      }));

      res.status(200).json({
        success: true,
        message: 'Dispute types retrieved successfully',
        data: {
          types: disputeTypes,
          resolutionTypes: Object.values(DisputeResolution).map(type => ({
            value: type,
            label: type.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
          })),
          statuses: Object.values(DisputeStatus)
        }
      });

    } catch (error: any) {
      console.error('Error in getDisputeTypes:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dispute types',
        error: error.message
      });
    }
  }
}

export const disputeController = new DisputeController();
export default disputeController;