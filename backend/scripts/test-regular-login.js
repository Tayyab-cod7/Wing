const fetch = require('node-fetch');
require('dotenv').config();

async function testRegularLogin() {
  try {
    const API_URL = 'http://localhost:5000';
    const phone = '03151251123';
    const password = 'admin123';
    
    console.log('Testing regular login endpoint with admin credentials...');
    
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone, password })
    });
    
    console.log('Response status:', response.status);
    
    const data = await response.json();
    console.log('Response data:', data);
    
    if (response.ok) {
      console.log('Login successful!');
      console.log('User is admin:', data.user && data.user.isAdmin);
    } else {
      console.error('Login failed:', data.message || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRegularLogin(); 