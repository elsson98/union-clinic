let patientsCache = null;
let staffCache = null;
let currentPage = 1;
let itemsPerPage = 10;
let isDataLoading = false;

function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    if (!token && !window.isLoggingOut) {
        localStorage.removeItem('token');
        localStorage.removeItem('staffInfo');
        window.location.href = 'staff-login.html';
        return Promise.reject(new Error('No authentication token'));
    }

    const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    return fetch(url, {...options, headers})
        .then(response => {
            if (response.status === 401) {
                if (!window.isLoggingOut) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('staffInfo');
                    window.location.href = 'staff-login.html';
                }
                return Promise.reject(new Error('Unauthorized'));
            }
            return response;
        })
        .catch(error => {
            if (error.message === 'Failed to fetch' && !window.isLoggingOut) {
                showNotification('Errore di connessione al server', 'error');
            }
            throw error;
        });
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');

    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '1000';
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#4caf50';
            notification.style.color = 'white';
            break;
        case 'error':
            notification.style.backgroundColor = '#f44336';
            notification.style.color = 'white';
            break;
        case 'warning':
            notification.style.backgroundColor = '#ff9800';
            notification.style.color = 'white';
            break;
        default:
            notification.style.backgroundColor = '#2196f3';
            notification.style.color = 'white';
    }

    notification.style.padding = '15px';
    notification.style.marginBottom = '10px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    notification.style.display = 'flex';
    notification.style.alignItems = 'center';
    notification.style.justifyContent = 'space-between';

    notification.textContent = message;

    const closeButton = document.createElement('button');
    closeButton.innerHTML = '&times;';
    closeButton.style.background = 'none';
    closeButton.style.border = 'none';
    closeButton.style.color = 'white';
    closeButton.style.fontSize = '20px';
    closeButton.style.marginLeft = '10px';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
        container.removeChild(notification);
    });

    notification.appendChild(closeButton);
    container.appendChild(notification);

    setTimeout(() => {
        if (container.contains(notification)) {
            container.removeChild(notification);
        }
    }, 5000);
}

function formatDate(date) {
    if (!date || isNaN(date.getTime())) {
        return 'Data non valida';
    }

    return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatStatus(status) {
    switch (status) {
        case 'active':
            return 'Attivo';
        case 'inactive':
            return 'Inattivo';
        case 'archived':
            return 'Archiviato';
        default:
            return status || 'N/A';
    }
}

function formatRole(role) {
    switch (role) {
        case 'admin':
            return 'Amministratore';
        case 'doctor':
            return 'Dottore';
        case 'staff':
            return 'Staff';
        default:
            return role || 'N/A';
    }
}

function capitalizeFirstLetter(string) {
    return string ? string.charAt(0).toUpperCase() + string.slice(1) : '';
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getFullYear() === date2.getFullYear();
}

function isInLastWeek(date, reference) {
    const oneWeekAgo = new Date(reference);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return date >= oneWeekAgo && date <= reference;
}

function isInLastMonth(date, reference) {
    const oneMonthAgo = new Date(reference);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    return date >= oneMonthAgo && date <= reference;
}

function setupModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close-modal, .close-modal-btn');

    closeButtons.forEach(button => {
        button.addEventListener('click', function () {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });

    window.addEventListener('click', function (event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
}

function enhanceReportSearch() {
    // Add a date picker for specific day search
    const filtersBar = document.querySelector('.filters-bar .filter-controls');
    if (filtersBar) {
        // Clear existing controls
        filtersBar.innerHTML = '';

        // Add specific date picker
        const datePicker = document.createElement('input');
        datePicker.type = 'date';
        datePicker.id = 'report-specific-date';
        datePicker.className = 'date-filter';
        datePicker.addEventListener('change', filterReports);

        filtersBar.appendChild(datePicker);
    }
}

function loadRecentActivities() {
    const activitiesContainer = document.getElementById('recent-activities');
    if (!activitiesContainer) return;

    activitiesContainer.innerHTML = '<div class="loading">Caricamento attività...</div>';

    setTimeout(() => {
        let html = '';

        if (patientsCache && patientsCache.length > 0) {
            const recentPatients = patientsCache.slice(0, 3);

            recentPatients.forEach((patient, index) => {
                const date = new Date(patient.created_at);
                const icons = ['fas fa-file-medical', 'fas fa-user-plus', 'fas fa-clipboard-check'];
                const activities = [
                    'Report creato',
                    'Paziente registrato',
                    'Appuntamento confermato'
                ];

                html += `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="${icons[index % icons.length]}"></i>
                    </div>
                    <div class="activity-details">
                        <h4>${activities[index % activities.length]}</h4>
                        <p>Paziente: ${patient.first_name} ${patient.last_name}</p>
                    </div>
                    <div class="activity-time">${formatDate(date)}</div>
                    <div class="activity-actions">
                        <button class="action-btn view-btn" onclick="viewReport('${patient.patient_id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit-btn" onclick="editReport('${patient.patient_id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteReport('${patient.patient_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                `;
            });
        } else {
            html = '<p>Nessuna attività recente.</p>';
        }

        activitiesContainer.innerHTML = html;
    }, 500);
}

function updatePagination(totalItems, currentPage, itemsPerPage) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const pageInfoElement = document.getElementById('page-info');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');

    if (pageInfoElement) {
        pageInfoElement.textContent = `Pagina ${currentPage} di ${totalPages || 1}`;
    }

    if (prevPageButton) {
        prevPageButton.disabled = currentPage <= 1;
    }

    if (nextPageButton) {
        nextPageButton.disabled = currentPage >= totalPages;
    }

    if (prevPageButton) {
        prevPageButton.onclick = function () {
            if (currentPage > 1) {
                currentPage--;
                if (patientsCache) {
                    renderReportsTable(patientsCache);
                }
            }
        };
    }

    if (nextPageButton) {
        nextPageButton.onclick = function () {
            if (currentPage < totalPages) {
                currentPage++;
                if (patientsCache) {
                    renderReportsTable(patientsCache);
                }
            }
        };
    }
}

function viewReport(patientId) {
    if (!patientId) {
        showNotification('ID paziente non valido', 'error');
        return;
    }

    window.location.href = `index.html?id=${patientId}&mode=view`;
}

function editReport(patientId) {
    if (!patientId) {
        showNotification('ID paziente non valido', 'error');
        return;
    }

    window.location.href = `index.html?id=${patientId}&mode=edit`;
}

function deleteReport(patientId) {
    if (!patientId) {
        showNotification('ID paziente non valido', 'error');
        return;
    }

    const confirmModal = document.getElementById('confirm-modal');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmActionBtn = document.getElementById('confirm-action-btn');

    if (confirmModal && confirmTitle && confirmMessage && confirmActionBtn) {
        confirmTitle.textContent = 'Conferma Eliminazione';
        confirmMessage.textContent = `Sei sicuro di voler eliminare questo report? Questa azione non può essere annullata.`;

        confirmActionBtn.onclick = function () {
            fetchWithAuth(`http://localhost:8000/patients/${patientId}`, {
                method: 'DELETE'
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error('Failed to delete patient report');
                    }

                    confirmModal.style.display = 'none';
                    loadPatients(); // Reload instead of filtering

                    showNotification('Report eliminato con successo', 'success');
                })
                .catch(error => {
                    console.error('Error deleting report:', error);
                    showNotification('Errore durante l\'eliminazione del report', 'error');
                });
        };

        confirmModal.style.display = 'block';
    }
}

// IMPORTANT: This is now the server-side filtering approach
function filterReports() {
    loadPatients();
}

function renderReportsTable(data) {
    const reportsTableBody = document.querySelector('#reports-table tbody');

    if (!data || data.length === 0) {
        reportsTableBody.innerHTML = '<tr><td colspan="6" class="empty-cell">Nessun report disponibile</td></tr>';
        return;
    }

    let html = '';
    data.forEach(report => {
        const status = report.status || 'active';
        const createdAt = new Date(report.created_at);

        html += `
            <tr>
                <td>${report.id || 'N/A'}</td>
                <td class="patient-name" onclick="viewReport('${report.patient_id}')" style="cursor: pointer;">
                    ${report.first_name || ''} ${report.last_name || ''}
                </td>
                <td>${report.patient_id || 'N/A'}</td>
                <td>${formatDate(createdAt)}</td>
                <td><span class="status-badge ${status}">${formatStatus(status)}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn view-btn" onclick="viewReport('${report.patient_id}')">
                            <i class="fas fa-eye"></i> Visualizza
                        </button>
                        <button class="action-btn edit-btn" onclick="editReport('${report.patient_id}')">
                            <i class="fas fa-edit"></i> Modifica
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteReport('${report.patient_id}')">
                            <i class="fas fa-trash"></i> Elimina
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    reportsTableBody.innerHTML = html;
    updatePagination(data.length, currentPage, itemsPerPage);
}

function loadPatients() {
    if (isDataLoading) return;

    isDataLoading = true;

    const reportsTableBody = document.querySelector('#reports-table tbody');
    if (reportsTableBody) {
        reportsTableBody.innerHTML = '<tr><td colspan="6" class="loading-cell">Caricamento dati...</td></tr>';
    }

    // Get search parameters
    const searchTerm = document.getElementById('report-search')?.value || '';
    const specificDate = document.getElementById('report-specific-date')?.value || '';

    // Use patientId if available in the URL (for individual patient data)
    const params = new URLSearchParams(window.location.search);
    const patientId = params.get('id');

    // If we have a specific patient ID, fetch that patient instead
    if (patientId) {
        fetchWithAuth(`http://localhost:8000/patients/${patientId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch patient data: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Create an array with this single patient
                patientsCache = [data];

                // Update UI elements
                updateDashboardCounters();
                loadRecentActivities();

                // If we're on the reports section, render the table
                const reportsSection = document.getElementById('reports-section');
                if (reportsSection && reportsSection.classList.contains('active')) {
                    renderReportsTable(patientsCache);
                }

                isDataLoading = false;
            })
            .catch(error => {
                console.error('Error loading patient data:', error);

                if (reportsTableBody) {
                    reportsTableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Errore durante il caricamento dei dati</td></tr>';
                }

                isDataLoading = false;
            });
        return;
    }

    // Try with a different approach for listing patients
    // Some APIs use /patients (without trailing slash)
    let url = 'http://localhost:8000/patients';

    if (searchTerm || specificDate) {
        url += '?';
        if (searchTerm) {
            url += `search=${encodeURIComponent(searchTerm)}&`;
        }
        if (specificDate) {
            url += `specific_date=${encodeURIComponent(specificDate)}&`;
        }
    }

    fetchWithAuth(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch patients data: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            patientsCache = data;

            // Update UI elements
            updateDashboardCounters();
            loadRecentActivities();

            // If we're on the reports section, render the table
            const reportsSection = document.getElementById('reports-section');
            if (reportsSection && reportsSection.classList.contains('active')) {
                renderReportsTable(data);
            }

            isDataLoading = false;
        })
        .catch(error => {
            console.error('Error loading patients:', error);

            // Fall back to a test patient if API fails
            if (reportsTableBody) {
                reportsTableBody.innerHTML = '<tr><td colspan="6" class="error-cell">Errore durante il caricamento dei dati</td></tr>';

            }

            isDataLoading = false;
        });
}

function makeStatsCardClickable() {
    // Get all stat cards
    const statCards = document.querySelectorAll('.stat-card');

    // First card (Report Totali) - navigate to reports section
    if (statCards[0]) {
        statCards[0].style.cursor = 'pointer';
        statCards[0].addEventListener('click', function () {
            const reportsNavItem = document.querySelector('.nav-item[data-target="reports-section"]');
            if (reportsNavItem) reportsNavItem.click();
        });
    }

    // Second card (Pazienti) - also navigate to reports section
    if (statCards[1]) {
        statCards[1].style.cursor = 'pointer';
        statCards[1].addEventListener('click', function () {
            const reportsNavItem = document.querySelector('.nav-item[data-target="reports-section"]');
            if (reportsNavItem) reportsNavItem.click();
        });
    }

    // Third card (Staff) - navigate to staff section (admin only)
    if (statCards[2]) {
        statCards[2].style.cursor = 'pointer';
        statCards[2].addEventListener('click', function () {
            const staffNavItem = document.querySelector('.nav-item[data-target="staff-section"]');
            if (staffNavItem) staffNavItem.click();
        });
    }
}

function updateDashboardCounters() {
    const patientsCount = patientsCache ? patientsCache.length : 0;

    if (document.getElementById('total-reports')) {
        document.getElementById('total-reports').textContent = patientsCount.toString();
    }

    if (document.getElementById('total-patients')) {
        document.getElementById('total-patients').textContent = patientsCount.toString();
    }

    if (document.body.classList.contains('is-admin') &&
        document.getElementById('total-staff') &&
        staffCache) {
        document.getElementById('total-staff').textContent = staffCache.length.toString();
    }
}

// Add to dashboard-common.js
function setupSearchButton() {
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            filterReports();
        });
    }

    // Handle staff search button in admin dashboard
    const staffSearchButton = document.getElementById('staff-search-button');
    if (staffSearchButton) {
        staffSearchButton.addEventListener('click', function () {
            filterStaff();
        });
    }
}

// Update the enhanceReportSearch function to add the search button functionality
function enhanceReportSearch() {
    // Add a date picker for specific day search
    const filtersBar = document.querySelector('.filters-bar .filter-controls');
    if (filtersBar) {
        // Clear existing controls
        filtersBar.innerHTML = '';

        // Add specific date picker
        const datePicker = document.createElement('input');
        datePicker.type = 'date';
        datePicker.id = 'report-specific-date';
        datePicker.className = 'date-filter';
        datePicker.addEventListener('change', filterReports);

        filtersBar.appendChild(datePicker);
    }

    // Setup search button
    setupSearchButton();

    // Add enter key support for search
    const searchInput = document.getElementById('report-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                filterReports();
            }
        });
    }

    // Add enter key support for staff search
    const staffSearchInput = document.getElementById('staff-search');
    if (staffSearchInput) {
        staffSearchInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                filterStaff();
            }
        });
    }
}