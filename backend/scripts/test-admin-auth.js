const fetch = require('node-fetch');
require('dotenv').config();

async function testAdminAuth() {
  try {
    // Admin credentials
    const adminPhone = '03151251123';
    const adminPassword = 'admin123';
    const API_URL = 'http://localhost:5000';
    
    console.log('Testing admin authentication...');
    
    // Step 1: Login as admin using the real login endpoint
    console.log('Step 1: Logging in as admin...');
    
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: adminPhone, password: adminPassword })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    if (!loginResponse.ok) {
      const loginError = await loginResponse.json().catch(e => ({ error: e.message }));
      console.error('Admin login failed:', loginError.message || 'Unknown error');
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful:', loginData.success);
    console.log('User data:', loginData.user);
    console.log('Token received:', loginData.token ? 'Yes (token hidden for security)' : 'No');
    
    if (!loginData.token) {
      console.error('No token received from login endpoint');
      return;
    }
    
    // Step 2: Try to access admin users endpoint with the real token
    console.log('\nStep 2: Accessing admin users endpoint with real token...');
    
    const response = await fetch(`${API_URL}/api/admin/users`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${loginData.token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json().catch(e => ({ error: e.message }));
    
    if (response.ok) {
      console.log('Admin authentication successful!');
      console.log('Number of users retrieved:', data.users ? data.users.length : 0);
    } else {
      console.error('Admin authentication failed:', data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAdminAuth(); 