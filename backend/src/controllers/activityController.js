exports.getRecentActivities = async (req, res) => {
    try {
        res.json({
            success: true,
            data: [] // No activities for now
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
}; 