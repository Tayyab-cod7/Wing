document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const showLoginLink = document.getElementById('showLogin');
    const showSignupLink = document.getElementById('showSignup');
    const errorMessage = document.getElementById('errorMessage');
    const successMessage = document.getElementById('successMessage');
    const referralCodeInput = document.getElementById('referralCode');

    // Check for referral code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const referralCode = urlParams.get('ref');
    if (referralCode) {
        // Show signup form if we have a referral code
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        // Set the referral code
        if (referralCodeInput) {
            referralCodeInput.value = referralCode;
        }
    }

    // API Base URL
    const API_URL = 'http://localhost:5000';

    // Input validation functions
    const validatePhoneNumber = (phone) => {
        return /^[0-9]{11}$/.test(phone);
    };

    const validatePassword = (password) => {
        return /^[A-Za-z0-9]{6,8}$/.test(password);
    };

    const validateReferralCode = (code) => {
        return /^[0-9]{6}$/.test(code);
    };

    // Helper functions
    const showError = (message) => {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    };

    const showSuccess = (message) => {
        successMessage.textContent = message;
        successMessage.style.display = 'block';
        setTimeout(() => {
            successMessage.style.display = 'none';
        }, 5000);
    };

    const setLoading = (form, isLoading) => {
        const button = form.querySelector('button[type="submit"]');
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };

    // Token management functions
    const setToken = (token, user) => {
        // Store token and user data
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Only set isAdmin flag for admin users
        if (user.phone === '03151251123') {
            localStorage.setItem('isAdmin', 'true');
        }
    };

    const clearTokens = () => {
        // Only clear tokens if we're not in an admin session
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.phone !== '03151251123') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('isAdmin');
        }
    };

    // Setup input restrictions
    const setupInputRestrictions = () => {
        // Phone number input restrictions
        const phoneInputs = document.querySelectorAll('input[type="tel"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 11);
            });
        });

        // Password input restrictions
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').slice(0, 8);
            });
        });

        // Referral code input restrictions
        const referralInput = document.getElementById('referralCode');
        if (referralInput) {
            referralInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
            });
        }
    };

    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', () => {
            const targetId = icon.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    });

    // Toggle between forms
    showSignupLink.addEventListener('click', (e) => {
        e.preventDefault();
        loginForm.style.display = 'none';
        signupForm.style.display = 'block';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    });

    showLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        signupForm.style.display = 'none';
        loginForm.style.display = 'block';
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';
    });

    // Handle Signup
    document.getElementById('signupForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const form = e.target;
        
        const formData = {
            phone: document.getElementById('signupPhone').value.trim(),
            password: document.getElementById('signupPassword').value,
            referralCode: document.getElementById('referralCode').value.trim()
        };

        // Prevent signup with admin phone number
        if (formData.phone === '03151251123') {
            showError('This phone number is reserved for admin use only. Please use a different number.');
            return;
        }

        // Check terms and conditions
        const termsCheckbox = document.getElementById('termsCheckbox');
        if (!termsCheckbox || !termsCheckbox.checked) {
            showError('Please accept the Terms and Conditions');
            return;
        }

        // Basic validation
        if (!formData.phone || !formData.password || !formData.referralCode) {
            showError('All fields are required');
            return;
        }

        // Phone number validation
        if (!validatePhoneNumber(formData.phone)) {
            showError('Phone number must be exactly 11 digits, numbers only');
            return;
        }

        // Password validation
        if (!validatePassword(formData.password)) {
            showError('Password must be 6-8 characters, letters and numbers only');
            return;
        }

        // Referral code validation
        if (!validateReferralCode(formData.referralCode)) {
            showError('Referral code must be exactly 6 digits, numbers only');
            return;
        }

        setLoading(form, true);

        try {
            console.log('Sending registration data:', formData);
            const response = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Registration failed');
            }

            const data = await response.json();
            console.log('Registration response:', data);

            if (data.success) {
                setToken(data.token, data.user);
                showSuccess('Registration successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'basic.html';
                }, 1500);
            } else {
                showError(data.error || 'Registration failed. Please try again.');
            }
        } catch (error) {
            console.error('Registration error:', error);
            if (!navigator.onLine) {
                showError('Please check your internet connection and try again.');
            } else {
                showError(error.message || 'Server error. Please try again later.');
            }
        } finally {
            setLoading(form, false);
        }
    });

    // Handle Login
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('loginPhone').value.trim();
        const password = document.getElementById('loginPassword').value;
        
        // Validate inputs
        if (!validatePhoneNumber(phone)) {
            showError('Please enter a valid 11-digit phone number');
            return;
        }
        
        if (!validatePassword(password)) {
            showError('Password must be 6-8 characters, letters and numbers only');
            return;
        }
        
        setLoading(e.target, true);
        
        try {
            // Check if this is an admin login attempt
            if (phone === '03151251123') {
                if (password !== 'admin123') {
                    showError('Invalid admin credentials');
                    return;
                }

                try {
                    // Admin login through API
                    const response = await fetch(`${API_URL}/api/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ 
                            phone,
                            password,
                            isAdmin: true
                        })
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.message || 'Admin login failed');
                    }

                    // Store admin session data
                    const adminData = {
                        phone: '03151251123',
                        isAdmin: true,
                        name: 'Admin'
                    };

                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(adminData));
                    localStorage.setItem('isAdmin', 'true');

                    showSuccess('Admin login successful! Redirecting...');
                    setTimeout(() => {
                        window.location.href = 'admin-user.html';
                    }, 1500);
                } catch (error) {
                    console.error('Admin login error:', error);
                    showError(error.message || 'Admin login failed');
                }
                return;
            }

            // Regular user login
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ phone, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || data.error || 'Login failed');
            }
            
            if (!data.token) {
                throw new Error('No token received from server');
            }
            
            // Store token and user data for regular users
            setToken(data.token, data.user);
            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = 'basic.html';
            }, 1500);
            
        } catch (error) {
            console.error('Login error:', error);
            showError(error.message || 'Server error. Please try again later.');
        } finally {
            setLoading(e.target, false);
        }
    });

    // Initialize input restrictions
    setupInputRestrictions();
}); 