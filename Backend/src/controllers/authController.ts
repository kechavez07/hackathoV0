import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { ReputationSummary } from '../models/Reputation';
import { config } from '../config/environment';
import { liskService } from '../services/liskService';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, username, liskAddress, publicKey } = req.body;

    // Validate Lisk address
    const isValidAddress = await liskService.validateAddress(liskAddress);
    if (!isValidAddress) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Lisk address format'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { liskAddress }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email, username, or Lisk address already exists'
      });
    }

    // Get account info from Lisk network
    let accountInfo;
    try {
      accountInfo = await liskService.getAccountInfo(liskAddress);
    } catch (error) {
      console.log('� Could not fetch Lisk account info, proceeding with registration');
      accountInfo = { balance: '0' };
    }

    // Create new user
    const user = new User({
      email,
      password,
      username,
      liskAddress,
      publicKey
    });

    await user.save();

    // Create reputation profile for new user
    const reputation = new ReputationSummary({
      userId: user._id
    });
    await reputation.save();

    // Generate JWT token
    const token = (jwt as any).sign(
      { 
        userId: user._id,
        email: user.email,
        liskAddress: user.liskAddress,
        publicKey: user.publicKey
      },
      config.jwtSecret || 'default-secret',
      { expiresIn: config.jwtExpiration || '24h' }
    );

    console.log(` User registered successfully: ${username} (${liskAddress})`);

    res.status(201).json({
      success: true,
      message: 'User registered successfully with blockchain integration',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          liskAddress: user.liskAddress,
          publicKey: user.publicKey,
          reputationScore: user.reputationScore,
          isVerified: user.isVerified,
          accountBalance: accountInfo.balance
        },
        token,
        blockchain: {
          network: liskService.getNetworkInfo(),
          accountInfo
        }
      }
    });

  } catch (error) {
    console.error('L Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Get fresh account info from Lisk
    let accountInfo;
    try {
      accountInfo = await liskService.getAccountInfo(user.liskAddress);
    } catch (error) {
      console.log('� Could not fetch Lisk account info during login');
      accountInfo = { balance: '0' };
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = (jwt as any).sign(
      { 
        userId: user._id,
        email: user.email,
        liskAddress: user.liskAddress,
        publicKey: user.publicKey
      },
      config.jwtSecret || 'default-secret',
      { expiresIn: config.jwtExpiration || '24h' }
    );

    console.log(` User login successful: ${user.username} (${user.liskAddress})`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          liskAddress: user.liskAddress,
          publicKey: user.publicKey,
          reputationScore: user.reputationScore,
          isVerified: user.isVerified,
          lastLogin: user.lastLogin,
          totalTransactions: user.totalTransactions,
          completedTransactions: user.completedTransactions
        },
        token,
        blockchain: {
          network: liskService.getNetworkInfo(),
          accountInfo
        }
      }
    });

  } catch (error) {
    console.error('L Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's reputation data
    const reputation = await ReputationSummary.findOne({ userId: userId });

    // Get fresh blockchain account info
    let accountInfo;
    try {
      accountInfo = await liskService.getAccountInfo(user.liskAddress);
    } catch (error) {
      console.log('� Could not fetch Lisk account info for profile');
      accountInfo = { balance: '0' };
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          liskAddress: user.liskAddress,
          publicKey: user.publicKey,
          reputationScore: user.reputationScore,
          totalTransactions: user.totalTransactions,
          completedTransactions: user.completedTransactions,
          disputedTransactions: user.disputedTransactions,
          isVerified: user.isVerified,
          profile: user.profile,
          createdAt: user.createdAt
        },
        reputation: reputation ? {
          averageRating: reputation.averageRating,
          totalRatings: reputation.totalRatings,
          level: reputation.level,
          ratingBreakdown: reputation.ratingBreakdown,
          asBuyer: reputation.asBuyer,
          asSeller: reputation.asSeller
        } : null,
        blockchain: {
          network: liskService.getNetworkInfo(),
          accountInfo,
          isConnected: liskService.isServiceConnected()
        }
      }
    });

  } catch (error) {
    console.error('L Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { firstName, lastName, phone, bio } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update profile fields
    if (firstName !== undefined) user.profile.firstName = firstName;
    if (lastName !== undefined) user.profile.lastName = lastName;
    if (phone !== undefined) user.profile.phone = phone;
    if (bio !== undefined) user.profile.bio = bio;

    await user.save();

    console.log(` Profile updated for user: ${user.username}`);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          liskAddress: user.liskAddress,
          profile: user.profile
        }
      }
    });

  } catch (error) {
    console.error('L Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const getWalletInfo = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get detailed wallet info from Lisk
    const accountInfo = await liskService.getAccountInfo(user.liskAddress);
    const blockHeight = await liskService.getBlockHeight();

    res.status(200).json({
      success: true,
      message: 'Wallet information retrieved successfully',
      data: {
        wallet: {
          address: user.liskAddress,
          publicKey: user.publicKey,
          balance: accountInfo.balance,
          nonce: accountInfo.nonce,
          transactions: accountInfo.transactions
        },
        network: {
          ...liskService.getNetworkInfo(),
          currentBlockHeight: blockHeight,
          isConnected: liskService.isServiceConnected()
        }
      }
    });

  } catch (error) {
    console.error('L Get wallet info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet information',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    // In a JWT-based system, logout is handled client-side by removing the token
    // Here we just confirm the logout
    console.log(' User logout successful');
    
    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('L Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
};