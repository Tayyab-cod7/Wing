const User = require('../models/User');

// @desc    Get bonus claimed status for the logged-in user
// @route   GET /api/bonus/status
// @access  Private
exports.getBonusStatus = async (req, res) => {
  try {
    // User is available via req.user from the protect middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      claimed: user.bonusClaimed
    });

  } catch (error) {
    console.error('Error getting bonus status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Claim registration bonus
// @route   POST /api/bonus/claim
// @access  Private
exports.claimBonus = async (req, res) => {
  try {
    // User is available via req.user from the protect middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if bonus is already claimed
    if (user.bonusClaimed) {
      return res.status(400).json({
        success: false,
        error: 'Bonus already claimed'
      });
    }

    // Amount to add (adjust as needed)
    const bonusAmount = 1.00;

    // Update user's balance and mark bonus as claimed
    user.balance += bonusAmount;
    user.bonusClaimed = true;
    
    try {
      await user.save();
      console.log('User data saved successfully to database.');
    } catch (saveError) {
      console.error('Error saving user data to database:', saveError);
      // Depending on the error, you might want to revert the changes or send a specific error response
      return res.status(500).json({
        success: false,
        message: 'Failed to save bonus claim to database.',
        error: saveError.message
      });
    }

    res.status(200).json({
      success: true,
      message: 'Bonus claimed successfully!',
      newBalance: user.balance // Return the new balance
    });

  } catch (error) {
    console.error('Error claiming bonus:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
}; 