import { config } from './environment';

export interface LiskConfig {
  nodeUrl: string;
  chainId: string;
  networkIdentifier: string;
}

export const liskConfig: LiskConfig = {
  nodeUrl: config.lisk.nodeUrl,
  chainId: config.lisk.chainId,
  networkIdentifier: config.lisk.networkIdentifier
};

// Simplified Lisk client for hackathon - will implement full client later
export const createLiskClient = async () => {
  try {
    console.log('✅ Lisk configuration loaded successfully');
    console.log(`🌐 Node URL: ${liskConfig.nodeUrl}`);
    console.log(`🔗 Chain ID: ${liskConfig.chainId}`);
    // TODO: Implement actual Lisk client connection in service layer
    return { config: liskConfig };
  } catch (error) {
    console.error('❌ Failed to load Lisk configuration:', error);
    throw error;
  }
};

export const LISK_CONSTANTS = {
  MIN_FEE: '1000000',
  ESCROW_MODULE_ID: 1000,
  REPUTATION_MODULE_ID: 1001,
  DISPUTE_MODULE_ID: 1002,
  
  TRANSACTION_TYPES: {
    CREATE_ESCROW: 0,
    RELEASE_ESCROW: 1,
    DISPUTE_ESCROW: 2,
    UPDATE_REPUTATION: 3
  },
  
  ESCROW_STATUS: {
    CREATED: 0,
    FUNDED: 1,
    DISPUTED: 2,
    COMPLETED: 3,
    REFUNDED: 4
  }
};

export default liskConfig;