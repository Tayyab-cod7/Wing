const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const auth = require('../middleware/auth');

// Submit a contact request
router.post('/', auth, async (req, res) => {
    try {
        const { subject, message } = req.body;
        
        if (!subject || !message) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both subject and message'
            });
        }

        const contact = new Contact({
            userId: req.user.id,
            subject,
            message
        });

        await contact.save();

        res.json({
            success: true,
            message: 'Contact request submitted successfully'
        });
    } catch (error) {
        console.error('Error in contact submission:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Get all contact requests (admin only)
router.get('/', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const contacts = await Contact.find()
            .populate('userId', 'name email phone')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            contacts
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Update contact status (admin only)
router.patch('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const { status } = req.body;
        if (!status || !['pending', 'responded', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const contact = await Contact.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact request not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact status updated successfully',
            contact
        });
    } catch (error) {
        console.error('Error updating contact status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

// Delete contact request (admin only)
router.delete('/:id', auth, async (req, res) => {
    try {
        if (!req.user.isAdmin) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const contact = await Contact.findByIdAndDelete(req.params.id);

        if (!contact) {
            return res.status(404).json({
                success: false,
                message: 'Contact request not found'
            });
        }

        res.json({
            success: true,
            message: 'Contact request deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

module.exports = router; 