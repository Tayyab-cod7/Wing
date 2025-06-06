const mongoose = require('mongoose');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin user exists
        const adminPhone = process.env.ADMIN_PHONE || '03151251123';
        const existingAdmin = await User.findOne({ phone: adminPhone });

        if (existingAdmin) {
            console.log('Admin user already exists');
            if (!existingAdmin.isAdmin) {
                existingAdmin.isAdmin = true;
                await existingAdmin.save();
                console.log('Updated existing user to admin');
            }
        } else {
            // Create admin user
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', salt);

            const adminUser = await User.create({
                username: process.env.ADMIN_USERNAME || 'admin12',
                phone: adminPhone,
                password: hashedPassword,
                isAdmin: true,
                referralCode: process.env.ADMIN_REFERRAL || '000000',
                referredBy: process.env.ADMIN_REFERRAL || '000000',
                active: true
            });

            console.log('Admin user created successfully:', {
                username: adminUser.username,
                phone: adminUser.phone,
                referralCode: adminUser.referralCode
            });
        }

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createAdmin(); 