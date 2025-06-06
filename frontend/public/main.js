// Configuration
const BASE_URL = window.location.hostname.includes('localhost')
    ? 'http://localhost:5000'
    : `https://${window.location.hostname}`;

// Utility function to get full API URL
function getApiUrl(endpoint) {
    return `${BASE_URL}/api${endpoint}`;
}

// Function to show login form
function showLoginForm() {
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
}

// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        const username = document.getElementById('signupUsername').value;
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;
        const referralCode = document.getElementById('referralCode').value;

        // Basic validation
        if (!username || !phone || !password || !referralCode) {
            showError('All fields are required');
            return;
        }

        // Phone validation
        if (!/^[0-9]{7,15}$/.test(phone)) {
            showError('Phone number must be between 7 and 15 digits');
            return;
        }

        // Username validation
        if (!/^[a-zA-Z][a-zA-Z0-9]{5,7}$/.test(username)) {
            showError('Username must start with a letter, be 6-8 characters long');
            return;
        }

        // Password validation
        if (!/^[A-Za-z0-9]{6,8}$/.test(password)) {
            showError('Password must be 6-8 characters, letters and numbers only');
            return;
        }

        // Referral code validation
        if (!/^[0-9]{6}$/.test(referralCode)) {
            showError('Referral code must be exactly 6 digits');
            return;
        }

        const registrationData = {
            username,
            phone,
            password,
            referralCode
        };

        console.log('Sending registration data:', registrationData);

        const response = await fetch(getApiUrl('/auth/register'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();
        console.log('Registration response:', data);

        if (!response.ok) {
            // If we have a specific error message from the server, use it
            if (data && data.error) {
                showError(data.error);
            } else {
                showError('Registration failed. Please try again.');
            }
            return;
        }

        if (data.success) {
            showSuccess('Registration successful! Please login.');
            // Store the phone number for login convenience
            localStorage.setItem('lastRegisteredPhone', phone);
            // Clear the form
            this.reset();
            // Switch to login form
            showLoginForm();
            // Pre-fill the phone number in login form
            const loginPhone = document.getElementById('loginPhone');
            if (loginPhone) {
                loginPhone.value = phone;
            }
        } else {
            showError(data.error || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Error during registration. Please try again.');
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        const phone = document.getElementById('loginPhone').value;
        const password = document.getElementById('loginPassword').value;

        // Basic validation
        if (!phone || !password) {
            showError('Please enter both phone number and password');
            return;
        }

        // Phone validation
        if (!/^[0-9]{7,15}$/.test(phone)) {
            showError('Phone number must be between 7 and 15 digits');
            return;
        }

        // Password validation
        if (!/^[A-Za-z0-9]{6,8}$/.test(password)) {
            showError('Password must be 6-8 characters, letters and numbers only');
            return;
        }

        const loginData = {
            phone,
            password
        };

        console.log('Attempting login with:', { phone, password: '****' });

        const response = await fetch(getApiUrl('/auth/login'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (!response.ok) {
            // If we have a specific error message from the server, use it
            if (data && data.error) {
                showError(data.error);
            } else {
                showError('Login failed. Please check your credentials and try again.');
            }
            return;
        }

        if (data.success) {
            // Store token and user data
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            showSuccess('Login successful! Redirecting...');
            
            // Redirect based on user type after a short delay
            setTimeout(() => {
                if (data.user.isAdmin) {
                    window.location.href = 'admin-user.html';
                } else {
                    window.location.href = 'home.html';
                }
            }, 1500);
        } else {
            showError(data.error || 'Login failed');
        }
    } catch (error) {
        console.error('Login error:', error);
        if (!navigator.onLine) {
            showError('Please check your internet connection and try again.');
        } else {
            showError('Server error. Please try again later.');
        }
    }
}); 