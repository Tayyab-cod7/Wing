const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Admin authentication middleware
module.exports = async (req, res, next) => {
    try {
        console.log('Admin auth middleware - Request path:', req.path);
        console.log('Admin auth middleware - Headers:', JSON.stringify(req.headers));
        
        // Get token from header
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader);
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('No Bearer token found');
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing or invalid format'
            });
        }
        
        const token = authHeader.split(' ')[1];
        console.log('Token extracted:', token ? `${token.substring(0, 10)}...` : 'none');
        
        if (!token) {
            console.log('Token is empty');
            return res.status(401).json({
                success: false,
                message: 'Authentication token missing'
            });
        }
        
        // Verify token
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0);
        
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded successfully:', decoded);
            
            // Check if user exists
            const user = await User.findById(decoded.id);
            console.log('User found:', user ? `Yes (ID: ${user._id})` : 'No');
            
            if (!user) {
                console.log('User not found');
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            // Check if user is admin
            console.log('User is admin:', user.isAdmin);
            if (!user.isAdmin) {
                console.log('User is not admin');
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Admin privileges required.'
                });
            }
            
            // Add user to request object
            req.user = user;
            console.log('Admin auth successful');
            
            next();
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError);
            return res.status(401).json({
                success: false,
                message: jwtError.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Admin auth error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
}; 