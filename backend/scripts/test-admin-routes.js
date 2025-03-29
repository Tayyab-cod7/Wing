const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testAdminRoutes() {
  try {
    const API_URL = 'http://localhost:5000';
    const adminPhone = process.env.ADMIN_PHONE || '03151251123';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    console.log('Testing admin routes...');
    console.log('Step 1: Login as admin');

    // Login as admin
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: adminPhone, password: adminPassword })
    });

    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.json();
      console.error('Admin login failed:', loginError);
      return;
    }

    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.success);
    
    if (!loginData.token) {
      console.error('No token received from login');
      return;
    }

    const token = loginData.token;
    console.log('Token received:', token.substring(0, 10) + '...');

    // Step 2: Get all users
    console.log('\nStep 2: Get all users');
    const usersResponse = await fetch(`${API_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Users response status:', usersResponse.status);
    
    if (!usersResponse.ok) {
      const usersError = await usersResponse.json();
      console.error('Failed to get users:', usersError);
      return;
    }

    const usersData = await usersResponse.json();
    console.log('Users retrieved successfully');
    console.log('Number of users:', usersData.users.length);
    
    // Print user details
    usersData.users.forEach((user, index) => {
      console.log(`User ${index + 1}:`, {
        id: user._id,
        phone: user.phone,
        isAdmin: user.isAdmin,
        referralCode: user.referralCode
      });
    });

    // Step 3: Try to delete admin user (should fail)
    const adminUser = usersData.users.find(user => user.isAdmin && user._id);
    
    if (adminUser && adminUser._id) {
      console.log('\nStep 3: Try to delete admin user (should fail)');
      console.log('Admin user ID:', adminUser._id);
      
      const deleteAdminResponse = await fetch(`${API_URL}/api/admin/users/${adminUser._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Delete admin response status:', deleteAdminResponse.status);
      const deleteAdminData = await deleteAdminResponse.json();
      console.log('Delete admin response:', deleteAdminData);
      
      if (deleteAdminResponse.status === 403) {
        console.log('✅ Admin protection working correctly!');
      } else {
        console.log('❌ Admin protection not working!');
      }
    } else {
      console.log('\nCannot test admin deletion protection - admin user has no ID or not found');
      console.log('Creating a test to verify admin protection in the controller...');
      
      // Create a direct test for the admin controller
      console.log('\nStep 3b: Testing admin protection directly');
      
      // Get the admin phone number from the .env file
      const adminPhone = process.env.ADMIN_PHONE || '03151251123';
      
      // Find a user with the admin phone number
      const adminUserByPhone = usersData.users.find(user => user.phone === adminPhone);
      
      if (adminUserByPhone && adminUserByPhone._id) {
        console.log('Found admin user by phone:', adminUserByPhone.phone);
        console.log('Admin user ID:', adminUserByPhone._id);
        
        const deleteAdminResponse = await fetch(`${API_URL}/api/admin/users/${adminUserByPhone._id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Delete admin response status:', deleteAdminResponse.status);
        const deleteAdminData = await deleteAdminResponse.json();
        console.log('Delete admin response:', deleteAdminData);
        
        if (deleteAdminResponse.status === 403) {
          console.log('✅ Admin protection working correctly!');
        } else {
          console.log('❌ Admin protection not working!');
        }
      } else {
        console.log('Could not find admin user by phone number');
      }
    }

  } catch (error) {
    console.error('Error testing admin routes:', error);
  }
}

// Run the test
testAdminRoutes(); 