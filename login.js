document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('.login-form');
    const statusMessage = document.getElementById('status-message');
    const loginButton = document.getElementById('login-button');

    const currentUrl = window.location.pathname;

    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                showMessage('Per favore, inserisci nome utente e password.', 'error');
                return;
            }

            loginButton.disabled = true;
            loginButton.textContent = 'Accesso in corso...';

            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: formData.toString()
            })
                .then(response => {
                    if (!response.ok) {
                        return response.json().then(data => {
                            throw new Error(data.detail || 'Errore di autenticazione');
                        });
                    }
                    return response.json();
                })
                .then(tokenData => {
                    const token = tokenData.access_token;
                    localStorage.setItem('token', token);

                    return fetch('http://localhost:8000/staff/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Errore nel recupero informazioni utente');
                    }
                    return response.json();
                })
                .then(staffInfo => {
                    localStorage.setItem('staffInfo', JSON.stringify(staffInfo));

                    if (staffInfo.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'staff-dashboard.html';
                    }
                })
                .catch(error => {
                    console.error('Login error:', error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('staffInfo');
                    showMessage(error.message || 'Nome utente o password non corretti.', 'error');
                    loginButton.disabled = false;
                    loginButton.textContent = 'Accedi';
                });
        });
    }

    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', function (e) {
            e.preventDefault();
            showMessage('Per reimpostare la password, contatta l\'amministratore di sistema.', 'info');
        });
    }

    const token = localStorage.getItem('token');
    const staffInfoRaw = localStorage.getItem('staffInfo');

    if (token && staffInfoRaw && currentUrl.includes('login')) {
        try {
            const staffInfo = JSON.parse(staffInfoRaw);
            if (staffInfo.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
            } else {
                window.location.href = 'staff-dashboard.html';
            }
        } catch (e) {
            localStorage.removeItem('token');
            localStorage.removeItem('staffInfo');
        }
    }
});

function showMessage(message, type) {
    const statusMessage = document.getElementById('status-message');
    if (!statusMessage) return;

    statusMessage.textContent = message;
    statusMessage.style.display = 'block';

    if (type === 'error') {
        statusMessage.style.backgroundColor = '#ffebee';
        statusMessage.style.color = '#c62828';
        statusMessage.style.border = '1px solid #ef9a9a';
    } else if (type === 'success') {
        statusMessage.style.backgroundColor = '#e8f5e9';
        statusMessage.style.color = '#2e7d32';
        statusMessage.style.border = '1px solid #a5d6a7';
    } else {
        statusMessage.style.backgroundColor = '#e3f2fd';
        statusMessage.style.color = '#1565c0';
        statusMessage.style.border = '1px solid #90caf9';
    }
}