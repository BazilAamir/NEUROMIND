const registerForm = document.getElementById('registerForm');
const errorBanner = document.getElementById('errorBanner');
const successBanner = document.getElementById('successBanner');

const API_URL = '/api';

// ===== PAGE TRANSITION HANDLER =====
function handlePageTransition(url) {
    window.location.href = url;
}

// Intercept navigation links for smooth transitions
document.addEventListener('DOMContentLoaded', function() {
    // Handle Login link in top nav
    const loginLink = document.querySelector('.btn-outline[href="/login"]');
    if (loginLink) {
        loginLink.addEventListener('click', function(e) {
            e.preventDefault();
            handlePageTransition('/login');
        });
    }
});

function showError(message) {
    successBanner.style.display = 'none';
    errorBanner.innerHTML = '<i class="fas fa-exclamation-circle"></i> ' + message;
    errorBanner.style.display = 'block';
}

function showSuccess(message) {
    errorBanner.style.display = 'none';
    successBanner.innerHTML = '<i class="fas fa-check-circle"></i> ' + message;
    successBanner.style.display = 'block';
}

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const doctorName = document.getElementById('doctorName').value.trim();
    const hospital = document.getElementById('hospital').value.trim();
    const username = document.getElementById('username').value.trim(); // Used as email
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!doctorName || !hospital || !username || !password || !confirmPassword) {
        showError('All required fields must be filled.');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters.');
        return;
    }

    if (password !== confirmPassword) {
        showError('Password and confirm password do not match.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: doctorName,
                email: username,
                password: password,
                hospital: hospital
            })
        });

        const data = await response.json();

        if (response.ok) {
            showSuccess('Registration successful! Redirecting to login...');
            setTimeout(function () {
                handlePageTransition('/login?registered=1&user=' + encodeURIComponent(username));
            }, 1200);
        } else {
            showError(data.message || data.errors?.[0]?.msg || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Server error. Please try again later.');
    }
});
