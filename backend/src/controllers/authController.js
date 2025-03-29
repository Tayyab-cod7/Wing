const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Validation functions
const validatePhoneNumber = (phone) => /^[0-9]{11}$/.test(phone);
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
    const { phone, password, referralCode } = req.body;

    // Validate input
    if (!phone || !password || !referralCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide all required fields'
      });
    }

    // Phone number validation
    if (!validatePhoneNumber(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Phone number must be exactly 11 digits, numbers only'
      });
    }

    // Password validation
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        error: 'Password must be 6-8 characters, letters and numbers only'
      });
    }

    // Referral code validation
    if (!validateReferralCode(referralCode)) {
      return res.status(400).json({
        success: false,
        error: 'Referral code must be exactly 6 digits, numbers only'
      });
    }

    // Check if trying to register with admin phone number
    if (phone === process.env.ADMIN_PHONE) {
      return res.status(403).json({
        success: false,
        error: 'This phone number is reserved and cannot be used for registration'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Phone number already registered'
      });
    }

    // Validate referral code and update referrer's count
    let referringUser = null;
    if (referralCode !== process.env.ADMIN_REFERRAL) {
      referringUser = await User.findOne({ referralCode });
      if (!referringUser) {
        return res.status(400).json({
          success: false,
          error: 'Invalid referral code'
        });
      }
      // Increment referral count for the referring user
      await User.findByIdAndUpdate(referringUser._id, {
        $inc: { referralCount: 1 }
      });
    }

    // Generate unique referral code for new user
    let newReferralCode;
    try {
        newReferralCode = await generateUniqueReferralCode();
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }

    // Create user with the generated referral code and referredBy
    const user = await User.create({
      phone,
      password,
      referralCode: newReferralCode,
      referredBy: referralCode // Save the referral code of the person who referred
    });

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
        console.log('Login function called with body:', JSON.stringify(req.body));
        const { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            console.log('Missing phone or password');
            return res.status(400).json({ success: false, message: 'Please provide phone and password' });
        }

        console.log('Looking for user with phone:', phone);
        // Check if user exists
        const user = await User.findOne({ phone }).select('+password');
        if (!user) {
            console.log('User not found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log('User found:', { id: user._id, isAdmin: user.isAdmin });
        
        // Check if password matches
        console.log('Comparing passwords...');
        try {
            const isMatch = await bcrypt.compare(password, user.password);
            console.log('Password match result:', isMatch);
            
            if (!isMatch) {
                console.log('Password does not match');
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (bcryptError) {
            console.error('bcrypt error:', bcryptError);
            throw new Error('Password comparison failed: ' + bcryptError.message);
        }

        // Generate JWT token
        console.log('Generating JWT token...');
        try {
            const token = jwt.sign(
                { id: user._id, isAdmin: user.isAdmin },
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );
            console.log('Token generated successfully');
            
            // Return token and user data (excluding password)
            const userData = {
                _id: user._id,
                phone: user.phone,
                name: user.name,
                balance: user.balance,
                referralCode: user.referralCode,
                isAdmin: user.isAdmin
            };

            console.log('Sending successful response');
            return res.status(200).json({
                success: true,
                token,
                user: userData
            });
        } catch (jwtError) {
            console.error('JWT error:', jwtError);
            throw new Error('Token generation failed: ' + jwtError.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
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

      // Get user with all necessary fields
      const user = await User.findById(decoded.id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      // Get referrals (users who used this user's referral code) with package info
      const referrals = await User.find({ referredBy: user.referralCode })
        .select('phone activePackage packageAmount');

      // Map referrals without commission
      const referralsWithoutCommission = referrals.map(referral => {
        return {
          phone: referral.phone,
          activePackage: referral.activePackage,
          packageAmount: referral.packageAmount || 0
        };
      });

      // Get user's total referral earnings (keep the actual total)
      const totalReferralEarnings = user.referralEarnings || 0;

      res.status(200).json({
        success: true,
        data: {
          phone: user.phone,
          createdAt: user.createdAt,
          referralCode: user.referralCode,
          referralCount: user.referralCount || 0,
          referrals: referralsWithoutCommission,
          referralEarnings: totalReferralEarnings,
          isAdmin: user.phone === process.env.ADMIN_PHONE
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
        const { phone, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ phone });
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
                phone: user.phone,
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
      phone: user.phone,
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