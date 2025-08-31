export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/lisk-trustpay',
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtExpiration: process.env.JWT_EXPIRATION || '24h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  lisk: {
    nodeUrl: process.env.LISK_NODE_URL || 'wss://testnet-service.lisk.com/rpc-ws',
    chainId: process.env.LISK_CHAIN_ID || '04000000',
    networkIdentifier: process.env.LISK_NETWORK_IDENTIFIER || 'testnet'
  },
  
  escrow: {
    confirmationBlocks: parseInt(process.env.CONFIRMATION_BLOCKS || '6', 10),
    disputeTimeoutHours: parseInt(process.env.DISPUTE_TIMEOUT_HOURS || '72', 10),
    escrowFeePercent: parseFloat(process.env.ESCROW_FEE_PERCENT || '1.5')
  },
  
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10)
  }
};

export default config;