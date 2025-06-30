const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Validation functions
const validatePhoneNumber = (phone) => /^[0-9]{7,15}$/.test(phone);
const validatePassword = (password) => /^[A-Za-z0-9]{6,8}$/.test(password);
const validateReferralCode = (code) => /^[0-9]{6}$/.test(code);

// Generate a random 6-digit number
const generateReferralCode = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

// Generate a unique referral code
const generateUniqueReferralCode = async () => {
    let attempts = 0;
    const maxAttempts = 20; // Increased max attempts
    
    while (attempts < maxAttempts) {
        const code = generateReferralCode();
        
        // Skip if code is admin's referral code
        if (code === process.env.ADMIN_REFERRAL) {
            continue;
        }
        
        // Check if code exists
        const existingUser = await User.findOne({ referralCode: code });
        if (!existingUser) {
            return code;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique referral code. Please try again.');
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { username, password, referralCode, phone } = req.body;

    console.log('Registration attempt:', { username, phone, referralCode });

    // Validate input
    if (!username || !password || !referralCode || !phone) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Username validation
    if (!/^[a-zA-Z][a-zA-Z0-9]{5,7}$/.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must start with a letter, be 6-8 characters long, and contain only letters and numbers'
      });
    }

    // Phone validation - accept any valid phone number format
    const cleanedPhone = phone.replace(/[^0-9]/g, '');
    if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be between 7 and 15 digits'
      });
    }

    // Password validation
    if (!/^[A-Za-z0-9]{6,8}$/.test(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be 6-8 characters, letters and numbers only'
      });
    }

    // Referral code validation
    if (!/^[0-9]{6}$/.test(referralCode)) {
      return res.status(400).json({
        success: false,
        error: 'Referral code must be exactly 6 digits, numbers only'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username },
        { phone: cleanedPhone } // Use cleaned phone number
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: existingUser.username === username ? 'Username already taken' : 'Phone number already registered'
      });
    }

    // Special handling for admin referral code
    if (referralCode === process.env.ADMIN_REFERRAL) {
      console.log('Using admin referral code');
    } else {
      // Validate referral code and update referrer's count
      const referringUser = await User.findOne({ referralCode });
      if (!referringUser) {
        console.log('Invalid referral code:', referralCode);
        return res.status(400).json({
          success: false,
          error: 'Invalid referral code'
        });
      }
      console.log('Found referring user:', referringUser.username);
      // Increment referral count for the referring user
      await User.findByIdAndUpdate(referringUser._id, {
        $inc: { referralCount: 1 }
      });
    }

    // Generate unique referral code for new user
    let newReferralCode;
    try {
      newReferralCode = await generateUniqueReferralCode();
      console.log('Generated new referral code:', newReferralCode);
    } catch (error) {
      console.error('Error generating referral code:', error);
      return res.status(500).json({
        success: false,
        error: error.message
      });
    }

    // Create user with cleaned phone number
    const user = await User.create({
      username,
      password,
      phone: cleanedPhone, // Use cleaned phone number
      referralCode: newReferralCode,
      referredBy: referralCode,
      active: false
    });

    console.log('User created successfully:', { id: user._id, username: user.username });

    sendTokenResponse(user, 201, res);
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({
      success: false,
      error: err.message || 'Failed to register user'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
    try {
        const { phone, password } = req.body;
        console.log('Login attempt for phone:', phone);
        // Validate input
        if (!phone || !password) {
            console.log('Missing phone or password');
            return res.status(400).json({
                success: false,
                error: 'Please provide both phone and password'
            });
        }
        // Clean phone number
        const cleanedPhone = phone.replace(/[^0-9]/g, '');
        console.log('Cleaned phone:', cleanedPhone);
        if (cleanedPhone.length < 7 || cleanedPhone.length > 15) {
            console.log('Invalid phone number format');
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }
        // Find user by cleaned phone number
        const user = await User.findOne({ phone: cleanedPhone }).select('+password');
        if (!user) {
            console.log('No user found for phone:', cleanedPhone);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        console.log('User found:', user.phone, 'isAdmin:', user.isAdmin);
        // Check password
        const isMatch = await user.matchPassword(password);
        console.log('Password match result:', isMatch);
        if (!isMatch) {
            console.log('Password mismatch for phone:', cleanedPhone);
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }
        // Generate token
        const token = user.getSignedJwtToken();
        // Remove password from response
        user.password = undefined;
        res.status(200).json({
            success: true,
            token,
            user: {
                _id: user._id,
                username: user.username,
                phone: user.phone,
                isAdmin: user.isAdmin,
                balance: user.balance,
                referralCode: user.referralCode,
                referredBy: user.referredBy,
                referralCount: user.referralCount,
                activePackage: user.activePackage,
                packageAmount: user.packageAmount,
                packageStartDate: user.packageStartDate,
                packageEndDate: user.packageEndDate,
                dailyEarningRate: user.dailyEarningRate,
                level: user.level
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Server error during login'
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user with all necessary fields including package information
      const user = await User.findById(decoded.id)
        .select('+referredBy +activePackage +packageAmount +packageStartDate +packageEndDate');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get referrals (users who used this user's referral code) with package info
      const referrals = await User.find({ referredBy: user.referralCode })
        .select('email username activePackage active');

      // Map referrals without commission
      const referralsWithoutCommission = referrals.map(referral => {
        return {
          email: referral.email,
          username: referral.username,
          activePackage: referral.activePackage,
          active: referral.active
        };
      });

      // Get user's total referral earnings (keep the actual total)
      const totalReferralEarnings = user.referralEarnings || 0;

      let leaderUsername = null;
      let leaderReferralCode = null;
      let leaderPhone = null;

      // Fetch leader information if referredBy exists
      if (user.referredBy) {
          const leader = await User.findOne({ referralCode: user.referredBy }).select('username referralCode phone');
          if (leader) {
              leaderUsername = leader.username;
              leaderReferralCode = leader.referralCode;
              leaderPhone = leader.phone;
          }
      }

      res.status(200).json({
        success: true,
        data: {
          email: user.email,
          username: user.username,
          phone: user.phone,
          balance: user.balance,
          createdAt: user.createdAt,
          referralCode: user.referralCode,
          referralCount: user.referralCount || 0,
          referrals: referralsWithoutCommission,
          referralEarnings: totalReferralEarnings,
          isAdmin: user.isAdmin,
          leaderUsername: leaderUsername,
          leaderReferralCode: leaderReferralCode,
          leaderPhone: leaderPhone,
          level: user.level || 'None',
          activePackage: user.activePackage,
          packageAmount: user.packageAmount,
          packageStartDate: user.packageStartDate,
          packageEndDate: user.packageEndDate
        }
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized to access this route'
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Server Error'
    });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is admin
        if (!user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Create token
        const token = jwt.sign(
            { 
                id: user._id,
                isAdmin: user.isAdmin 
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Admin Login Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

// Get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, isAdmin = false) => {
  // Create token
  const token = jwt.sign(
    { id: user._id, isAdmin: user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      username: user.username,
      balance: user.balance,
      referralCode: user.referralCode,
      isAdmin: user.isAdmin
    }
  });
};

module.exports = {
    register,
    login,
    getMe,
    adminLogin
}; 