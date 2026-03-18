const loginForm = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const errorBanner = document.getElementById('errorBanner');
const successBanner = document.getElementById('successBanner');

const API_URL = '/api';

// ===== PAGE TRANSITION HANDLER =====
function handlePageTransition(url) {
    window.location.href = url;
}

// Intercept navigation links for smooth transitions
document.addEventListener('DOMContentLoaded', function() {
    // Handle Register link in top nav
    const registerLink = document.querySelector('.btn-outline[href="/register"]');
    if (registerLink) {
        registerLink.addEventListener('click', function(e) {
            e.preventDefault();
            handlePageTransition('/register');
        });
    }

    // Handle Register link in footer
    const footerRegisterLink = document.querySelector('.form-footer a[href="/register"]');
    if (footerRegisterLink) {
        footerRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            handlePageTransition('/register');
        });
    }
});

function showLoginError(message) {
    successBanner.style.display = 'none';
    errorBanner.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message;
    errorBanner.style.display = 'block';
    errorBanner.style.animation = 'none';
    errorBanner.offsetHeight;
    errorBanner.style.animation = 'slideIn 0.3s ease';
}

function showSuccess(message) {
    errorBanner.style.display = 'none';
    successBanner.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    successBanner.style.display = 'block';
}

// Check if redirected from registration
const params = new URLSearchParams(window.location.search);
if (params.get('registered') === '1') {
    successBanner.innerHTML = '<i class="fas fa-check-circle"></i> Registration successful! Please login.';
    successBanner.style.display = 'block';
    const presetUser = params.get('user');
    if (presetUser) {
        usernameInput.value = presetUser;
    }
}

// Login form submission
loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    const email = usernameInput.value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
        showLoginError('Email and password are required.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token and doctor info
            localStorage.setItem('token', data.token);
            localStorage.setItem('currentDoctor', JSON.stringify({
                id: data.doctorId,
                name: data.name,
                email: data.email,
                hospital: data.hospital,
                specialization: data.specialization
            }));

            showSuccess('Login successful! Redirecting...');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        } else {
            showLoginError(data.message || 'Invalid credentials. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Server error. Please try again later.');
    }
});
