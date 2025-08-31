"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDatabase = exports.connectDatabase = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const connectDatabase = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lisk-trustpay';
        await mongoose_1.default.connect(mongoUri, {
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log('MongoDB connected successfully');
    }
    catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};
exports.connectDatabase = connectDatabase;
const disconnectDatabase = async () => {
    try {
        await mongoose_1.default.disconnect();
        console.log('MongoDB disconnected');
    }
    catch (error) {
        console.error('Database disconnection error:', error);
    }
};
exports.disconnectDatabase = disconnectDatabase;
mongoose_1.default.connection.on('error', (error) => {
    console.error('MongoDB connection error:', error);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});
exports.default = mongoose_1.default;
//# sourceMappingURL=database.js.map