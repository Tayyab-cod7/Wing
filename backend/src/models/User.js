const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Function to generate random 6-digit code
function generateReferralCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true,
    minlength: [6, 'Username must be at least 6 characters'],
    maxlength: [8, 'Username cannot be more than 8 characters'],
    match: [/^[a-zA-Z][a-zA-Z0-9]*$/, 'Username must start with a letter and contain only letters and numbers']
  },
  phone: {
    type: String,
    required: [true, 'Please add a phone number'],
    unique: true,
    trim: true,
    match: [/^[0-9]{7,15}$/, 'Phone number must be between 7 and 15 digits']
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    select: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  referralCode: {
    type: String,
    unique: true,
    default: generateReferralCode
  },
  referredBy: {
    type: String,
    required: false,
    default: '000000'
  },
  referralCount: {
    type: Number,
    default: 0
  },
  commissionHistory: [{
    amount: Number,
    date: {
      type: Date,
      default: Date.now
    },
    packageAmount: Number
  }],
  programEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  referralEarnings: {
    type: Number,
    default: 0,
    min: 0
  },
  totalEarnings: {
    type: Number,
    default: 50,
    min: 50
  },
  lastEarnTime: {
    type: Number,
    default: 0
  },
  // Add package-related fields
  activePackage: {
    type: String,
    default: null
  },
  packageAmount: {
    type: Number,
    default: 0
  },
  packagePurchaseDate: {
    type: Date,
    default: null
  },
  dailyEarningRate: {
    type: Number,
    default: 0
  },
  packageValidity: {
    type: Number,
    default: 30 // Default 30 days validity
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  packageStartDate: {
    type: Date,
    default: null
  },
  packageEndDate: {
    type: Date,
    default: null
  },
  bonusClaimed: {
    type: Boolean,
    default: false
  },
  level: {
    type: String,
    default: 'None'
  },
  activities: [{
    type: {
      type: String,
      enum: ['package_purchase', 'task_complete', 'referral', 'withdrawal', 'deposit'],
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Create indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ referralCode: 1 }, { unique: true });

// Pre-save middleware
userSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Handle referral code
  if (this.isNew) {
    // If referralCode is provided in the request, use it as referredBy
    if (this._doc.referralCode && !this.referredBy) {
      this.referredBy = this._doc.referralCode;
    }

    // Generate unique referral code
    while (true) {
      try {
        const existingUser = await mongoose.model('User').findOne({ referralCode: this.referralCode });
        if (!existingUser) break;
        this.referralCode = generateReferralCode();
      } catch (err) {
        break;
      }
    }

    // Validate referredBy code if it's not the admin code
    if (this.referredBy !== '000000') {
      const referrer = await mongoose.model('User').findOne({ referralCode: this.referredBy });
      if (!referrer) {
        this.referredBy = '000000'; // Default to admin code if invalid
      }
    }
  }

  next();
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, isAdmin: this.isAdmin },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE
    }
  );
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema); 