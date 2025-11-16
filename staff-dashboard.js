document.addEventListener('DOMContentLoaded', initStaffDashboard);

function initStaffDashboard() {
    checkAuthenticationAndRole();
    setupNavigation();
    setupModals();
    makeStatsCardClickable();
    enhanceReportSearch();
    setupSearch();
    initForms();
    loadPatients(); // Use loadPatients directly

    document.getElementById('new-report-btn')?.addEventListener('click', function () {
        window.location.href = 'index.html';
    });
}

function checkAuthenticationAndRole() {
    const token = localStorage.getItem('token');
    const staffInfoRaw = localStorage.getItem('staffInfo');

    if (!token || !staffInfoRaw) {
        console.log('No authentication found, redirecting to login');
        window.location.href = 'staff-login.html';
        return;
    }

    try {
        const staff = JSON.parse(staffInfoRaw);

        if (staff.role === 'admin') {
            console.log('User is admin, redirecting to admin dashboard');
            window.location.href = 'admin-dashboard.html';
            return;
        }

        document.getElementById('username').textContent = `${staff.first_name} ${staff.last_name}`;
        document.getElementById('user-role').textContent = capitalizeFirstLetter(staff.role);
        document.getElementById('profile-name').textContent = `${staff.first_name} ${staff.last_name}`;
        document.getElementById('profile-role').textContent = capitalizeFirstLetter(staff.role);
        document.getElementById('profile-email').textContent = staff.email || 'Nessuna email';
        document.getElementById('profile-firstname').value = staff.first_name || '';
        document.getElementById('profile-lastname').value = staff.last_name || '';
        document.getElementById('profile-email-input').value = staff.email || '';
        document.getElementById('profile-phone').value = staff.phone_number || '';
        document.getElementById('profile-specialization').value = staff.specialization || '';
        document.getElementById('profile-license').value = staff.license_number || '';
    } catch (error) {
        console.error('Error parsing staff info:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('staffInfo');
        window.location.href = 'staff-login.html';
        return;
    }

    document.getElementById('logout-btn').addEventListener('click', function () {
        window.isLoggingOut = true;
        console.log('Logging out...');
        localStorage.removeItem('token');
        localStorage.removeItem('staffInfo');
        window.location.href = 'staff-login.html';
    });
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    navItems.forEach(item => {
        item.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('data-target');

            if (window.currentFetchController) {
                window.currentFetchController.abort();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(section => section.classList.remove('active'));
            document.getElementById(targetId).classList.add('active');

            if (targetId === 'reports-section') {
                if (!patientsCache) {
                    loadPatients();
                } else {
                    renderReportsTable(patientsCache);
                }
            }
        });
    });
}

function setupSearch() {
    const reportSearch = document.getElementById('report-search');
    if (reportSearch) {
        reportSearch.addEventListener('input', function () {
            // Debounce the search to avoid too many API calls
            clearTimeout(reportSearch.timer);
            reportSearch.timer = setTimeout(filterReports, 500);
        });
    }
}

function initForms() {
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(profileForm);
            const profileData = Object.fromEntries(formData.entries());
            const staffInfo = JSON.parse(localStorage.getItem('staffInfo'));
            const endpoint = `/staff/${staffInfo.id}`;

            fetchWithAuth(`http://localhost:8000${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(profileData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error updating profile');
                    }
                    return response.json();
                })
                .then(data => {
                    const updatedStaffInfo = {...staffInfo, ...profileData};
                    localStorage.setItem('staffInfo', JSON.stringify(updatedStaffInfo));
                    document.getElementById('username').textContent = `${updatedStaffInfo.first_name} ${updatedStaffInfo.last_name}`;
                    document.getElementById('profile-name').textContent = `${updatedStaffInfo.first_name} ${updatedStaffInfo.last_name}`;
                    document.getElementById('profile-email').textContent = updatedStaffInfo.email || 'Nessuna email';
                    showNotification('Profilo aggiornato con successo!', 'success');
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Errore durante l\'aggiornamento del profilo', 'error');
                });
        });
    }

    const passwordForm = document.getElementById('password-form');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showNotification('Le password non corrispondono', 'error');
                return;
            }

            if (!newPassword) {
                showNotification('La nuova password non può essere vuota', 'error');
                return;
            }

            const staffInfo = JSON.parse(localStorage.getItem('staffInfo'));
            const endpoint = `/staff/${staffInfo.id}/change-password`;

            fetchWithAuth(`http://localhost:8000${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    new_password: newPassword
                })
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Error changing password');
                    }
                    return response.json();
                })
                .then(data => {
                    passwordForm.reset();
                    showNotification('Password cambiata con successo!', 'success');
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('Errore durante il cambio password', 'error');
                });
        });
    }
}