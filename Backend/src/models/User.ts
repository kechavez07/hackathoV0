import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  username: string;
  liskAddress: string;
  publicKey: string;
  reputationScore: number;
  totalTransactions: number;
  completedTransactions: number;
  disputedTransactions: number;
  isVerified: boolean;
  isActive: boolean;
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long']
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [20, 'Username cannot exceed 20 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores']
  },
  liskAddress: {
    type: String,
    required: [true, 'Lisk address is required'],
    unique: true,
    validate: {
      validator: function(v: string) {
        return /^lsk[a-z2-9]{38}$/.test(v);
      },
      message: 'Invalid Lisk address format'
    }
  },
  publicKey: {
    type: String,
    required: [true, 'Public key is required'],
    validate: {
      validator: function(v: string) {
        return /^[a-f0-9]{64}$/.test(v);
      },
      message: 'Invalid public key format'
    }
  },
  reputationScore: {
    type: Number,
    default: 100,
    min: [0, 'Reputation score cannot be negative'],
    max: [1000, 'Reputation score cannot exceed 1000']
  },
  totalTransactions: {
    type: Number,
    default: 0,
    min: [0, 'Total transactions cannot be negative']
  },
  completedTransactions: {
    type: Number,
    default: 0,
    min: [0, 'Completed transactions cannot be negative']
  },
  disputedTransactions: {
    type: Number,
    default: 0,
    min: [0, 'Disputed transactions cannot be negative']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profile: {
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, 'First name cannot exceed 50 characters']
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, 'Last name cannot exceed 50 characters']
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, 'Please provide a valid phone number']
    },
    avatar: {
      type: String,
      trim: true
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters']
    }
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc: any, ret: any) {
      delete ret.password;
      return ret;
    }
  }
});

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ liskAddress: 1 });
UserSchema.index({ reputationScore: -1 });

export const User = mongoose.model<IUser>('User', UserSchema);
export default User;