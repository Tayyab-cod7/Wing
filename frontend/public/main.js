// Handle signup form submission
document.getElementById('signupForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    try {
        const phone = document.getElementById('signupPhone').value;
        const password = document.getElementById('signupPassword').value;
        const referredBy = document.getElementById('referralCode').value;

        const registrationData = {
            phone,
            password,
            referredBy  // Changed from referralCode to referredBy
        };

        console.log('Sending registration data:', registrationData);

        const response = await fetch(`${API_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Registration successful! Please login.');
            // Clear the form
            this.reset();
            // Switch to login form
            showLoginForm();
        } else {
            showError(data.message || 'Registration failed');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Error during registration. Please try again.');
    }
}); 