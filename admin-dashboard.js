document.addEventListener('DOMContentLoaded', initAdminDashboard);

function initAdminDashboard() {
    console.log("Initializing admin dashboard");
    checkAuthenticationAndRole();

    // Wrap navigation setup in a short timeout to ensure DOM is ready
    setTimeout(function () {
        setupNavigation();
        setupModals();
        makeStatsCardClickable();
        enhanceReportSearch();
        setupSearch();
        initForms();
        loadPatients();
        loadStaffData();
    }, 100);

    // Add direct event listeners for specific buttons
    const newReportBtn = document.getElementById('new-report-btn');
    if (newReportBtn) {
        newReportBtn.addEventListener('click', function () {
            window.location.href = 'index.html';
        });
    }

    const newStaffBtn = document.getElementById('new-staff-btn');
    if (newStaffBtn) {
        newStaffBtn.addEventListener('click', showNewStaffModal);
    }
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

        if (staff.role !== 'admin') {
            console.log('User is not admin, redirecting to staff dashboard');
            window.location.href = 'staff-dashboard.html';
            return;
        }

        document.getElementById('username').textContent = `${staff.first_name} ${staff.last_name}`;
        document.getElementById('user-role').textContent = 'Amministratore';
        document.getElementById('profile-name').textContent = `${staff.first_name} ${staff.last_name}`;
        document.getElementById('profile-role').textContent = 'Amministratore';
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

    console.log("Setting up navigation with", navItems.length, "items");

    navItems.forEach(item => {
        const targetId = item.getAttribute('data-target');
        console.log(`Setting up nav item for ${targetId}`);

        // Make sure the target section exists
        const targetSection = document.getElementById(targetId);
        if (!targetSection) {
            console.error(`Target section #${targetId} not found in DOM`);
            return; // Skip this iteration
        }

        item.addEventListener('click', function (e) {
            console.log(`Clicked on nav item for ${targetId}`);
            e.preventDefault();
            e.stopPropagation(); // Prevent event bubbling

            if (window.currentFetchController) {
                window.currentFetchController.abort();
            }

            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            contentSections.forEach(section => section.classList.remove('active'));
            targetSection.classList.add('active');

            if (targetId === 'reports-section') {
                if (!patientsCache) {
                    loadPatients();
                } else {
                    renderReportsTable(patientsCache);
                }
            } else if (targetId === 'staff-section') {
                console.log("Loading staff section data");
                if (!staffCache) {
                    loadStaffData();
                } else {
                    renderStaffTable(staffCache);
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

    const staffSearch = document.getElementById('staff-search');
    if (staffSearch) {
        staffSearch.addEventListener('input', filterStaff);
    }

    const staffFilterRole = document.getElementById('staff-filter-role');
    const staffFilterStatus = document.getElementById('staff-filter-status');

    if (staffFilterRole) {
        staffFilterRole.addEventListener('change', filterStaff);
    }

    if (staffFilterStatus) {
        staffFilterStatus.addEventListener('change', filterStaff);
    }
}

function filterStaff() {
    if (!staffCache) return;

    const searchTerm = document.getElementById('staff-search').value.toLowerCase();
    const roleFilter = document.getElementById('staff-filter-role').value;
    const statusFilter = document.getElementById('staff-filter-status').value;

    let filteredStaff = staffCache.filter(staff => {
        const matchesSearch =
            staff.username?.toLowerCase().includes(searchTerm) ||
            staff.email?.toLowerCase().includes(searchTerm) ||
            (staff.first_name + ' ' + staff.last_name)?.toLowerCase().includes(searchTerm);

        const matchesRole = !roleFilter || staff.role === roleFilter;
        const matchesStatus = !statusFilter || staff.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    renderStaffTable(filteredStaff);
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

    // Admin-specific: Staff form
    const staffForm = document.getElementById('staff-form');
    if (staffForm) {
        staffForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const formData = new FormData(staffForm);
            const staffData = Object.fromEntries(formData.entries());
            const isUpdate = staffData.id ? true : false;
            const staffId = staffData.id;

            if (isUpdate) {
                delete staffData.id;
            }

            if (isUpdate && !staffData.password) {
                delete staffData.password;
            }

            const endpoint = isUpdate ? `/staff/${staffId}` : '/staff/';
            const method = isUpdate ? 'PUT' : 'POST';

            fetchWithAuth(`http://localhost:8000${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(staffData)
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error ${isUpdate ? 'updating' : 'creating'} staff member`);
                    }
                    return response.json();
                })
                .then(data => {
                    document.getElementById('staff-modal').style.display = 'none';
                    staffCache = null;
                    loadStaffData();
                    showNotification(`Membro staff ${isUpdate ? 'aggiornato' : 'creato'} con successo!`, 'success');
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification(`Errore durante ${isUpdate ? 'l\'aggiornamento' : 'la creazione'} del membro staff`, 'error');
                });
        });
    }
}

function loadStaffData() {
    if (isDataLoading) {
        return;
    }

    const staffTableBody = document.querySelector('#staff-table tbody');
    staffTableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">Caricamento dati...</td></tr>';

    if (staffCache) {
        renderStaffTable(staffCache);
        return;
    }

    isDataLoading = true;

    fetchWithAuth('http://localhost:8000/staff/')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch staff data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            staffCache = data;
            updateDashboardCounters();
            renderStaffTable(data);
            isDataLoading = false;
        })
        .catch(error => {
            console.error('Error loading staff data:', error);
            staffTableBody.innerHTML = '<tr><td colspan="7" class="error-cell">Errore durante il caricamento dei dati</td></tr>';
            isDataLoading = false;
        });
}

function renderStaffTable(data) {
    const staffTableBody = document.querySelector('#staff-table tbody');

    if (!data || data.length === 0) {
        staffTableBody.innerHTML = '<tr><td colspan="7" class="empty-cell">Nessun membro staff disponibile</td></tr>';
        return;
    }

    let html = '';
    data.forEach(staff => {
        html += `
            <tr>
                <td>${staff.id || 'N/A'}</td>
                <td>${staff.first_name || 'N/A'}</td>
                <td>${staff.last_name || 'N/A'}</td>
                <td>${formatRole(staff.role) || 'N/A'}</td>
                <td>${staff.email || 'N/A'}</td>
                <td><span class="status-badge ${staff.status}">${formatStatus(staff.status)}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon view-action" onclick="viewStaff(${staff.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit-action" onclick="editStaff(${staff.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete-action" onclick="deleteStaff(${staff.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    staffTableBody.innerHTML = html;
}

function showNewStaffModal() {
    const staffForm = document.getElementById('staff-form');
    if (staffForm) staffForm.reset();

    const staffIdField = document.getElementById('staff-id');
    if (staffIdField) staffIdField.value = '';

    const modalTitle = document.getElementById('staff-modal-title');
    if (modalTitle) modalTitle.textContent = 'Nuovo Membro Staff';

    const passwordField = document.querySelector('.password-field');
    if (passwordField) {
        passwordField.style.display = 'block';
        document.getElementById('staff-password').required = true;
    }

    const staffModal = document.getElementById('staff-modal');
    if (staffModal) staffModal.style.display = 'block';
}

function viewStaff(staffId) {
    if (!staffId) {
        showNotification('ID staff non valido', 'error');
        return;
    }

    const staff = staffCache ? staffCache.find(s => s.id === staffId) : null;

    if (staff) {
        alert(`Dettagli staff ID ${staffId}:\n\nNome: ${staff.first_name} ${staff.last_name}\nEmail: ${staff.email || 'N/A'}\nRuolo: ${formatRole(staff.role)}\nTelefono: ${staff.phone_number || 'N/A'}\nStato: ${formatStatus(staff.status)}`);
    } else {
        fetchWithAuth(`http://localhost:8000/staff/${staffId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch staff details');
                }
                return response.json();
            })
            .then(staff => {
                alert(`Dettagli staff ID ${staffId}:\n\nNome: ${staff.first_name} ${staff.last_name}\nEmail: ${staff.email || 'N/A'}\nRuolo: ${formatRole(staff.role)}\nTelefono: ${staff.phone_number || 'N/A'}\nStato: ${formatStatus(staff.status)}`);
            })
            .catch(error => {
                console.error('Error viewing staff:', error);
                showNotification('Errore durante il caricamento dei dettagli dello staff', 'error');
            });
    }
}

function editStaff(staffId) {
    if (!staffId) {
        showNotification('ID staff non valido', 'error');
        return;
    }

    const getStaffData = () => {
        if (staffCache) {
            return Promise.resolve(staffCache.find(s => s.id === staffId));
        } else {
            return fetchWithAuth(`http://localhost:8000/staff/${staffId}`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to fetch staff details');
                    }
                    return response.json();
                });
        }
    };

    getStaffData()
        .then(staff => {
            if (!staff) {
                throw new Error('Staff member not found');
            }

            const staffForm = document.getElementById('staff-form');
            if (staffForm) {
                document.getElementById('staff-id').value = staff.id;
                document.getElementById('staff-username').value = staff.username;
                document.getElementById('staff-firstname').value = staff.first_name || '';
                document.getElementById('staff-lastname').value = staff.last_name || '';
                document.getElementById('staff-email').value = staff.email || '';
                document.getElementById('staff-phone').value = staff.phone_number || '';
                document.getElementById('staff-role').value = staff.role || 'staff';
                document.getElementById('staff-status').value = staff.status || 'active';
                document.getElementById('staff-specialization').value = staff.specialization || '';
                document.getElementById('staff-license').value = staff.license_number || '';

                const passwordField = document.querySelector('.password-field');
                if (passwordField) {
                    passwordField.style.display = 'block';
                    document.getElementById('staff-password').required = false;
                }

                document.getElementById('staff-modal-title').textContent = 'Modifica Membro Staff';
                document.getElementById('staff-modal').style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error preparing staff edit:', error);
            showNotification('Errore durante il caricamento dei dati dello staff', 'error');
        });
}

function deleteStaff(staffId) {
    if (!staffId) {
        showNotification('ID staff non valido', 'error');
        return;
    }

    const currentUserInfo = JSON.parse(localStorage.getItem('staffInfo'));
    if (currentUserInfo && currentUserInfo.id === staffId) {
        showNotification('Non puoi eliminare il tuo account', 'error');
        return;
    }

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');

    if (confirmModal && confirmTitle && confirmMessage && confirmActionBtn) {
        confirmTitle.textContent = 'Conferma Eliminazione';
        confirmMessage.textContent = `Sei sicuro di voler eliminare questo membro dello staff? Questa azione non può essere annullata.`;

        confirmActionBtn.onclick = function () {
            fetchWithAuth(`http://localhost:8000/staff/${staffId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete staff member');
                    }

                    confirmModal.style.display = 'none';
                    if (staffCache) {
                        staffCache = staffCache.filter(s => s.id !== staffId);
                    }
                    renderStaffTable(staffCache);
                    showNotification('Membro staff eliminato con successo', 'success');
                })
                .catch(error => {
                    console.error('Error deleting staff:', error);
                    showNotification('Errore durante l\'eliminazione del membro staff', 'error');
                });
        };

        confirmModal.style.display = 'block';
    }
}