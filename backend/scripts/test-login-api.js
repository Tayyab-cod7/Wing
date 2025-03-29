const fetch = require('node-fetch');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function testLoginAPI() {
  try {
    const API_URL = 'http://localhost:5000';
    const adminPhone = '03151251123';
    const adminPassword = 'admin123';

    console.log('Testing login API endpoint...');
    console.log('- URL:', `${API_URL}/api/auth/login`);
    console.log('- Phone:', adminPhone);
    console.log('- Password:', adminPassword);

    // Make the login request
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ phone: adminPhone, password: adminPassword })
    });

    console.log('\nResponse status:', response.status);
    
    // Try to parse the response body
    try {
      const data = await response.json();
      console.log('Response data:', data);
    } catch (parseError) {
      console.error('Error parsing response:', parseError);
      const text = await response.text();
      console.log('Response text:', text);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testLoginAPI(); 