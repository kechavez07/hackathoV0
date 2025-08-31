import mongoose from 'mongoose';

export const connectDatabase = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lisk-trustpay';
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    
    await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
    });

    console.log('✅ MongoDB Atlas connected successfully!');
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.log('💡 Verificar:');
    console.log('   - Acceso de red en MongoDB Atlas (0.0.0.0/0)');
    console.log('   - Usuario y contraseña correctos');
    console.log('   - Cluster activo (no pausado)');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Database disconnection error:', error);
  }
};

mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

export default mongoose;