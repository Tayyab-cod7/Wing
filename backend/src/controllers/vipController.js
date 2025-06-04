const User = require('../models/User'); // adjust path as needed

exports.upgradeVip = async (req, res) => {
    try {
        const userId = req.user.id; // or however you get the user
        const { package } = req.body;

        // Find the package price (you may have a package list or DB)
        const packagePrices = {
            'Basic Plane 01': 20,
            'Basic Plane 02': 30,
            'Basic Plane 03': 50,
            'Pro Plane 01': 100,
            'Pro Plane 02': 150,
            'Pro Plane 03': 200,
            'Premium Plane 01': 300,
            'Premium Plane 02': 500
        };
        const price = packagePrices[package];
        if (!price) return res.status(400).json({ success: false, message: 'Invalid package' });

        // Get user
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check balance
        if (user.balance < price) {
            return res.status(400).json({ success: false, message: 'Insufficient balance' });
        }

        // Deduct balance and upgrade VIP
        user.balance -= price;
        user.vip = { currentPlan: package, /* ...other VIP info... */ };
        user.level = package;
        await user.save();

        return res.json({ success: true, message: 'VIP upgraded', balance: user.balance, level: user.level });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.cancelVip = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        user.vip = null;
        user.level = 'None';
        await user.save();
        return res.json({ success: true, message: 'VIP package cancelled' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}; 