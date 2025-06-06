const User = require('../models/User'); // adjust path as needed
const Task = require('../models/Task'); // Add Task model import

exports.upgradeVip = async (req, res) => {
    try {
        const userId = req.user.id;
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

        // Delete all existing tasks for this user
        await Task.deleteMany({ userId: userId });

        // Calculate package dates
        const packageStartDate = new Date();
        const packageEndDate = new Date();
        packageEndDate.setDate(packageEndDate.getDate() + 30); // 30 days validity

        // Deduct balance and upgrade VIP
        user.balance -= price;
        user.vip = { currentPlan: package };
        user.level = package;
        user.activePackage = package;
        user.packageAmount = price;
        user.packageStartDate = packageStartDate;
        user.packageEndDate = packageEndDate;
        user.dailyEarningRate = package === 'Basic Plane 01' ? 0.66 :
                               package === 'Basic Plane 02' ? 1.2 :
                               package === 'Basic Plane 03' ? 2.5 :
                               package === 'Pro Plane 01' ? 6 :
                               package === 'Pro Plane 02' ? 10 :
                               package === 'Pro Plane 03' ? 20 :
                               package === 'Premium Plane 01' ? 50 :
                               package === 'Premium Plane 02' ? 200 : 0;
        await user.save();

        return res.json({ 
            success: true, 
            message: 'VIP upgraded', 
            balance: user.balance, 
            level: user.level,
            activePackage: user.activePackage,
            packageDetails: {
                startDate: user.packageStartDate,
                endDate: user.packageEndDate,
                dailyEarningRate: user.dailyEarningRate
            }
        });
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
        
        // Reset all package-related fields
        user.vip = null;
        user.level = 'None';
        user.activePackage = null;
        user.packageAmount = 0;
        user.packageStartDate = null;
        user.packageEndDate = null;
        user.dailyEarningRate = 0;
        
        // Delete all tasks for this user
        await Task.deleteMany({ userId: userId });
        
        await user.save();
        
        return res.json({ 
            success: true, 
            message: 'VIP package cancelled',
            shouldClearTasks: true // Flag to tell frontend to clear tasks
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
}; 