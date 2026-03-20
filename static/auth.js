// Authentication Logic V2 - Smart Predict POS
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Auto-check on protected pages
    if (window.location.pathname !== '/login') {
        checkAuth();
    }
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('loginError');
    
    const btn = e.target.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Authenticating...';
    btn.disabled = true;
    if (errorDiv) errorDiv.style.display = 'none';

    fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    })
    .then(res => {
        if (res.ok) return res.json();
        throw new Error('Access Denied: Invalid Credentials');
    })
    .then(data => {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', email);
        window.location.href = '/dashboard';
    })
    .catch(err => {
        if (errorDiv) {
            errorDiv.style.display = 'block';
            errorDiv.textContent = err.message;
        } else {
            alert(err.message);
        }
        btn.innerHTML = originalText;
        btn.disabled = false;
    });
}

function checkAuth() {
    if (localStorage.getItem('isLoggedIn') !== 'true') {
        window.location.href = '/login';
    }
}

function logout() {
    fetch('/api/logout').then(() => {
        localStorage.clear();
        window.location.href = '/login';
    });
}

// Global logout exposure
window.logout = logout;