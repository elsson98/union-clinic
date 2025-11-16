let categoriesCache = null;
let transactionsCache = null;
let itemsCache = null;
let itemsCurrentPage = 1;
let transactionsCurrentPage = 1;

const API_BASE_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        setupDirectButtonHandlers();
        initInventoryManagement();
    }, 500);
});

function setupDirectButtonHandlers() {
    const newItemBtn = document.getElementById('new-item-btn');
    if (newItemBtn) {
        newItemBtn.onclick = function () {
            document.getElementById('item-form').reset();
            document.getElementById('item-id').value = '';
            document.getElementById('item-modal-title').textContent = 'Nuovo Prodotto';
            document.getElementById('item-modal').style.display = 'block';
        };
    }

    const newCategoryBtn = document.getElementById('new-category-btn');
    if (newCategoryBtn) {
        newCategoryBtn.onclick = function () {
            document.getElementById('category-form').reset();
            document.getElementById('category-id').value = '';
            document.getElementById('category-modal-title').textContent = 'Nuova Categoria';
            document.getElementById('category-modal').style.display = 'block';
        };
    }

    const newTransactionBtn = document.getElementById('new-transaction-btn');
    if (newTransactionBtn) {
        newTransactionBtn.onclick = function () {
            document.getElementById('transaction-form').reset();
            document.getElementById('transaction-modal-title').textContent = 'Nuovo Movimento';
            document.getElementById('transaction-modal').style.display = 'block';
        };
    }

    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.onclick = applyItemFilters;
    }

    const applyTransactionFiltersBtn = document.getElementById('apply-transaction-filters');
    if (applyTransactionFiltersBtn) {
        applyTransactionFiltersBtn.onclick = applyTransactionFilters;
    }

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.onclick = function () {
            const tabId = this.getAttribute('data-tab');
            tabButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(tabId).classList.add('active');
        };
    });

    const itemSearch = document.getElementById('item-search');
    if (itemSearch) {
        itemSearch.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') applyItemFilters();
        });
    }

    const transactionSearch = document.getElementById('transaction-product-search');
    if (transactionSearch) {
        transactionSearch.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') applyTransactionFilters();
        });
    }
}

function initInventoryManagement() {
    if (!checkAuthenticationAndRole()) return;

    setupModals();

    const itemForm = document.getElementById('item-form');
    if (itemForm) {
        itemForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitItemForm();
        });
    }

    const categoryForm = document.getElementById('category-form');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitCategoryForm();
        });
    }

    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function (e) {
            e.preventDefault();
            submitTransactionForm();
        });
    }

    loadInventoryStats();
    loadCategories();
    loadItems();
    loadTransactions();
}

function loadInventoryStats() {
    fetchWithAuth(`${API_BASE_URL}/inventory/stats`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch inventory stats');
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('total-products').textContent = data.total_items;
            document.getElementById('low-stock-count').textContent = data.low_stock_count;
            document.getElementById('total-value').textContent = formatCurrency(data.total_value);
            document.getElementById('categories-count').textContent = data.categories_count;
        })
        .catch(error => {
            console.error('Error loading stats:', error);
            showNotification('Errore durante il caricamento delle statistiche dell\'inventario', 'error');
        });
}

function loadCategories() {
    fetchWithAuth(`${API_BASE_URL}/inventory/categories`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            return response.json();
        })
        .then(data => {
            categoriesCache = data;

            const categoryFilter = document.getElementById('category-filter');
            const itemCategorySelect = document.getElementById('item-category');

            if (categoryFilter) {
                while (categoryFilter.options.length > 1) categoryFilter.remove(1);

                data.forEach(category => {
                    categoryFilter.add(new Option(category.name, category.id));
                });
            }

            if (itemCategorySelect) {
                while (itemCategorySelect.options.length > 1) itemCategorySelect.remove(1);

                data.forEach(category => {
                    itemCategorySelect.add(new Option(category.name, category.id));
                });
            }

            renderCategoriesTable(data);
        })
        .catch(error => {
            console.error('Error loading categories:', error);
            showNotification('Errore durante il caricamento delle categorie', 'error');
        });
}

function loadItems(filters = {}) {
    if (isDataLoading) return;

    isDataLoading = true;

    const tableBody = document.querySelector('#items-table tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading-cell">Caricamento prodotti...</td></tr>';
    }

    let queryParams = new URLSearchParams();

    if (filters.search) queryParams.append('search', filters.search);
    if (filters.category_id) queryParams.append('category_id', filters.category_id);
    if (filters.low_stock) queryParams.append('low_stock', 'true');

    queryParams.append('skip', (itemsCurrentPage - 1) * itemsPerPage);
    queryParams.append('limit', itemsPerPage);

    let url = `${API_BASE_URL}/inventory/items`;
    if (queryParams.toString()) url += `?${queryParams.toString()}`;

    fetchWithAuth(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch inventory items: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            itemsCache = data;
            renderItemsTable(data);

            const transactionItemSelect = document.getElementById('transaction-item');
            if (transactionItemSelect) {
                while (transactionItemSelect.options.length > 1) transactionItemSelect.remove(1);

                data.forEach(item => {
                    transactionItemSelect.add(new Option(`${item.code} - ${item.name}`, item.id));
                });
            }

            isDataLoading = false;
        })
        .catch(error => {
            console.error('Error loading items:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="8" class="error-cell">Errore durante il caricamento dei prodotti: ${error.message}</td></tr>`;
            }
            isDataLoading = false;
        });
}

function loadTransactions(filters = {}) {
    if (isDataLoading) return;

    isDataLoading = true;

    const tableBody = document.querySelector('#transactions-table tbody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="8" class="loading-cell">Caricamento movimenti...</td></tr>';
    }

    let queryParams = new URLSearchParams();

    if (filters.item_id) queryParams.append('item_id', filters.item_id);
    if (filters.transaction_type) queryParams.append('transaction_type', filters.transaction_type);

    queryParams.append('skip', (transactionsCurrentPage - 1) * itemsPerPage);
    queryParams.append('limit', itemsPerPage);

    let url = `${API_BASE_URL}/inventory/transactions`;
    if (queryParams.toString()) url += `?${queryParams.toString()}`;

    fetchWithAuth(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch inventory transactions: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            transactionsCache = data;
            renderTransactionsTable(data);
            isDataLoading = false;
        })
        .catch(error => {
            console.error('Error loading transactions:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="8" class="error-cell">Errore durante il caricamento dei movimenti: ${error.message}</td></tr>`;
            }
            isDataLoading = false;
        });
}

function renderItemsTable(items) {
    const tableBody = document.querySelector('#items-table tbody');
    if (!tableBody) return;

    if (!items || items.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">Nessun prodotto trovato</td></tr>';
        return;
    }

    let html = '';

    items.forEach(item => {
        const categoryName = item.category ? item.category.name : 'N/A';
        const stockClass = item.current_stock <= item.min_stock ? 'text-danger' : '';
        const totalValue = item.current_stock * item.unit_price;

        html += `
            <tr>
                <td>${item.code}</td>
                <td>${item.name}</td>
                <td>${categoryName}</td>
                <td class="${stockClass}">${item.current_stock}</td>
                <td>${item.min_stock}</td>
                <td>${formatCurrency(item.unit_price)}</td>
                <td>${formatCurrency(totalValue)}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon view-action" onclick="viewItem(${item.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-icon edit-action" onclick="editItem(${item.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete-action" onclick="deleteItem(${item.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    updateItemsPagination(items.length);
}

function renderCategoriesTable(categories) {
    const tableBody = document.querySelector('#categories-table tbody');
    if (!tableBody) return;

    if (!categories || categories.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-cell">Nessuna categoria trovata</td></tr>';
        return;
    }

    let html = '';

    categories.forEach(category => {
        const itemCount = itemsCache ? itemsCache.filter(item => item.category_id === category.id).length : 0;

        html += `
            <tr>
                <td>${category.id}</td>
                <td>${category.name}</td>
                <td>${category.description || ''}</td>
                <td>${itemCount}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-icon edit-action" onclick="editCategory(${category.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-icon delete-action" onclick="deleteCategory(${category.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
}

function renderTransactionsTable(transactions) {
    const tableBody = document.querySelector('#transactions-table tbody');
    if (!tableBody) return;

    if (!transactions || transactions.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="8" class="empty-cell">Nessun movimento trovato</td></tr>';
        return;
    }

    let html = '';

    transactions.forEach(transaction => {
        const transactionDate = new Date(transaction.transaction_date);
        const formattedDate = `${transactionDate.toLocaleDateString()} ${transactionDate.toLocaleTimeString()}`;

        const itemName = transaction.item ? `${transaction.item.code} - ${transaction.item.name}` : 'N/A';

        let typeText
        let typeClass

        if (transaction.transaction_type === 'in') {
            typeText = 'Entrata';
            typeClass = 'text-success';
        } else if (transaction.transaction_type === 'out') {
            typeText = 'Uscita';
            typeClass = 'text-danger';
        } else {
            typeText = 'Aggiustamento';
            typeClass = 'text-warning';
        }

        const quantityPrefix = transaction.transaction_type === 'in' ? '+' :
            transaction.transaction_type === 'out' ? '-' : '';

        html += `
            <tr>
                <td>${formattedDate}</td>
                <td>${itemName}</td>
                <td class="${typeClass}">${typeText}</td>
                <td>${quantityPrefix}${transaction.quantity}</td>
                <td>${transaction.previous_stock}</td>
                <td>${transaction.new_stock}</td>
                <td>${transaction.staff_id}</td>
                <td>${transaction.notes || ''}</td>
            </tr>
        `;
    });

    tableBody.innerHTML = html;
    updateTransactionsPagination(transactions.length);
}

function updateItemsPagination(itemCount) {
    const totalPages = Math.ceil(itemCount / itemsPerPage);
    const pageInfo = document.getElementById('items-page-info');
    const prevButton = document.getElementById('items-prev-page');
    const nextButton = document.getElementById('items-next-page');

    if (!pageInfo || !prevButton || !nextButton) return;

    pageInfo.textContent = `Pagina ${itemsCurrentPage} di ${totalPages || 1}`;

    prevButton.disabled = itemsCurrentPage <= 1;
    nextButton.disabled = itemsCurrentPage >= totalPages;

    prevButton.onclick = function () {
        if (itemsCurrentPage > 1) {
            itemsCurrentPage--;
            applyItemFilters();
        }
    };

    nextButton.onclick = function () {
        if (itemsCurrentPage < totalPages) {
            itemsCurrentPage++;
            applyItemFilters();
        }
    };
}

function updateTransactionsPagination(transactionCount) {
    const totalPages = Math.ceil(transactionCount / itemsPerPage);
    const pageInfo = document.getElementById('transactions-page-info');
    const prevButton = document.getElementById('transactions-prev-page');
    const nextButton = document.getElementById('transactions-next-page');

    if (!pageInfo || !prevButton || !nextButton) return;

    pageInfo.textContent = `Pagina ${transactionsCurrentPage} di ${totalPages || 1}`;

    prevButton.disabled = transactionsCurrentPage <= 1;
    nextButton.disabled = transactionsCurrentPage >= totalPages;

    prevButton.onclick = function () {
        if (transactionsCurrentPage > 1) {
            transactionsCurrentPage--;
            applyTransactionFilters();
        }
    };

    nextButton.onclick = function () {
        if (transactionsCurrentPage < totalPages) {
            transactionsCurrentPage++;
            applyTransactionFilters();
        }
    };
}

function applyItemFilters() {
    const searchTerm = document.getElementById('item-search').value;
    const categoryId = document.getElementById('category-filter').value;
    const stockFilter = document.getElementById('stock-filter').value;

    const filters = {};

    if (searchTerm) filters.search = searchTerm;
    if (categoryId) filters.category_id = categoryId;
    if (stockFilter === 'low') filters.low_stock = true;

    itemsCurrentPage = 1;
    loadItems(filters);
}

function applyTransactionFilters() {
    const searchTerm = document.getElementById('transaction-product-search').value;
    const transactionType = document.getElementById('transaction-type-filter').value;

    const filters = {};

    if (searchTerm && itemsCache) {
        const matchedItem = itemsCache.find(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.code.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (matchedItem) filters.item_id = matchedItem.id;
    }

    if (transactionType) filters.transaction_type = transactionType;

    transactionsCurrentPage = 1;
    loadTransactions(filters);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
}

function viewItem(itemId) {
    if (!itemId) {
        showNotification('ID prodotto non valido', 'error');
        return;
    }

    const item = itemsCache.find(i => i.id === itemId);

    if (!item) {
        showNotification('Prodotto non trovato', 'error');
        return;
    }

    const categoryName = item.category ? item.category.name : 'N/A';
    const status = item.is_active ? 'Attivo' : 'Inattivo';

    const message = `
        Dettagli Prodotto:
        
        Codice: ${item.code}
        Nome: ${item.name}
        Categoria: ${categoryName}
        Giacenza: ${item.current_stock}
        Scorta Minima: ${item.min_stock}
        Prezzo: ${formatCurrency(item.unit_price)}
        Produttore: ${item.manufacturer || 'N/A'}
        Fornitore: ${item.supplier || 'N/A'}
        Ubicazione: ${item.location || 'N/A'}
        Stato: ${status}
        
        Descrizione: ${item.description || 'N/A'}
    `;

    alert(message);
}

function editItem(itemId) {
    if (!itemId) {
        showNotification('ID prodotto non valido', 'error');
        return;
    }

    const item = itemsCache.find(i => i.id === itemId);

    if (!item) {
        showNotification('Prodotto non trovato', 'error');
        return;
    }

    document.getElementById('item-id').value = item.id;
    document.getElementById('item-code').value = item.code;
    document.getElementById('item-name').value = item.name;
    document.getElementById('item-category').value = item.category_id;
    document.getElementById('item-unit').value = item.unit;
    document.getElementById('item-price').value = item.unit_price;
    document.getElementById('item-stock').value = item.current_stock;
    document.getElementById('item-min-stock').value = item.min_stock;
    document.getElementById('item-manufacturer').value = item.manufacturer || '';
    document.getElementById('item-supplier').value = item.supplier || '';
    document.getElementById('item-location').value = item.location || '';
    document.getElementById('item-status').value = item.is_active.toString();
    document.getElementById('item-description').value = item.description || '';

    document.getElementById('item-modal-title').textContent = 'Modifica Prodotto';
    document.getElementById('item-modal').style.display = 'block';
}

function deleteItem(itemId) {
    if (!itemId) {
        showNotification('ID prodotto non valido', 'error');
        return;
    }

    const item = itemsCache.find(i => i.id === itemId);

    if (!item) {
        showNotification('Prodotto non trovato', 'error');
        return;
    }

    document.getElementById('confirm-title').textContent = 'Elimina Prodotto';
    document.getElementById('confirm-message').textContent = `Sei sicuro di voler eliminare il prodotto "${item.code} - ${item.name}"?`;

    const confirmButton = document.getElementById('confirm-action-btn');
    confirmButton.onclick = function () {
        fetchWithAuth(`${API_BASE_URL}/inventory/items/${itemId}`, {method: 'DELETE'})
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error deleting item');
                }

                document.getElementById('confirm-modal').style.display = 'none';
                loadItems();
                loadInventoryStats();

                showNotification('Prodotto eliminato con successo', 'success');
            })
            .catch(error => {
                console.error('Error deleting item:', error);
                showNotification('Errore durante l\'eliminazione del prodotto', 'error');
            });
    };

    document.getElementById('confirm-modal').style.display = 'block';
}

function editCategory(categoryId) {
    if (!categoryId) {
        showNotification('ID categoria non valido', 'error');
        return;
    }

    const category = categoriesCache.find(c => c.id === categoryId);

    if (!category) {
        showNotification('Categoria non trovata', 'error');
        return;
    }

    document.getElementById('category-id').value = category.id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-description').value = category.description || '';

    document.getElementById('category-modal-title').textContent = 'Modifica Categoria';
    document.getElementById('category-modal').style.display = 'block';
}

function deleteCategory(categoryId) {
    if (!categoryId) {
        showNotification('ID categoria non valido', 'error');
        return;
    }

    const category = categoriesCache.find(c => c.id === categoryId);

    if (!category) {
        showNotification('Categoria non trovata', 'error');
        return;
    }

    const hasItems = itemsCache && itemsCache.some(item => item.category_id === categoryId);

    if (hasItems) {
        showNotification('Non è possibile eliminare una categoria che contiene prodotti', 'error');
        return;
    }

    document.getElementById('confirm-title').textContent = 'Elimina Categoria';
    document.getElementById('confirm-message').textContent = `Sei sicuro di voler eliminare la categoria "${category.name}"?`;

    const confirmButton = document.getElementById('confirm-action-btn');
    confirmButton.onclick = function () {
        fetchWithAuth(`${API_BASE_URL}/inventory/categories/${categoryId}`, {method: 'DELETE'})
            .then(response => {
                if (!response.ok) {
                    throw new Error('Error deleting category');
                }

                document.getElementById('confirm-modal').style.display = 'none';
                loadCategories();
                loadInventoryStats();

                showNotification('Categoria eliminata con successo', 'success');
            })
            .catch(error => {
                console.error('Error deleting category:', error);
                showNotification('Errore durante l\'eliminazione della categoria', 'error');
            });
    };

    document.getElementById('confirm-modal').style.display = 'block';
}

function submitItemForm() {
    const form = document.getElementById('item-form');
    const itemId = document.getElementById('item-id').value;

    const formData = new FormData(form);
    const itemData = Object.fromEntries(formData.entries());

    itemData.category_id = parseInt(itemData.category_id);
    itemData.unit_price = parseFloat(itemData.unit_price);
    itemData.current_stock = parseInt(itemData.current_stock);
    itemData.min_stock = parseInt(itemData.min_stock);
    itemData.is_active = itemData.is_active === 'true';

    const isUpdate = itemId !== '';
    const url = isUpdate
        ? `${API_BASE_URL}/inventory/items/${itemId}`
        : `${API_BASE_URL}/inventory/items`;

    const method = isUpdate ? 'PUT' : 'POST';

    fetchWithAuth(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(itemData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `Error ${isUpdate ? 'updating' : 'creating'} item: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('item-modal').style.display = 'none';
            loadItems();
            loadInventoryStats();

            showNotification(
                isUpdate
                    ? 'Prodotto aggiornato con successo'
                    : 'Prodotto creato con successo',
                'success'
            );
        })
        .catch(error => {
            console.error('Submit error:', error);
            showNotification(`Errore durante il salvataggio del prodotto: ${error.message}`, 'error');
        });
}

function submitCategoryForm() {
    const form = document.getElementById('category-form');
    const categoryId = document.getElementById('category-id').value;

    const formData = new FormData(form);
    const categoryData = Object.fromEntries(formData.entries());

    const isUpdate = categoryId !== '';
    const url = isUpdate
        ? `${API_BASE_URL}/inventory/categories/${categoryId}`
        : `${API_BASE_URL}/inventory/categories`;

    const method = isUpdate ? 'PUT' : 'POST';

    fetchWithAuth(url, {
        method: method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(categoryData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `Error ${isUpdate ? 'updating' : 'creating'} category: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('category-modal').style.display = 'none';
            loadCategories();
            loadInventoryStats();

            showNotification(
                isUpdate
                    ? 'Categoria aggiornata con successo'
                    : 'Categoria creata con successo',
                'success'
            );
        })
        .catch(error => {
            console.error('Submit error:', error);
            showNotification(`Errore durante il salvataggio della categoria: ${error.message}`, 'error');
        });
}

function submitTransactionForm() {
    const form = document.getElementById('transaction-form');

    const formData = new FormData(form);
    const transactionData = Object.fromEntries(formData.entries());

    transactionData.item_id = parseInt(transactionData.item_id);
    transactionData.quantity = parseInt(transactionData.quantity);

    fetchWithAuth(`${API_BASE_URL}/inventory/transactions`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(transactionData)
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => {
                    throw new Error(err.detail || `Error creating transaction: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            document.getElementById('transaction-modal').style.display = 'none';
            loadTransactions();
            loadItems();
            loadInventoryStats();

            showNotification('Movimento registrato con successo', 'success');
        })
        .catch(error => {
            console.error('Submit error:', error);
            showNotification(`Errore durante la registrazione del movimento: ${error.message}`, 'error');
        });
}

function checkAuthenticationAndRole() {
    const token = localStorage.getItem('token');
    const staffInfoRaw = localStorage.getItem('staffInfo');

    if (!token || !staffInfoRaw) {
        console.log('No authentication found, redirecting to login');
        window.location.href = 'staff-login.html';
        return false;
    }

    try {
        const staff = JSON.parse(staffInfoRaw);

        if (staff.role !== 'admin') {
            console.log('User is not admin, redirecting to staff dashboard');
            window.location.href = 'staff-dashboard.html';
            return false;
        }

        document.getElementById('username').textContent = `${staff.first_name} ${staff.last_name}`;
        document.getElementById('user-role').textContent = 'Amministratore';

        const profileName = document.getElementById('profile-name');
        if (profileName) profileName.textContent = `${staff.first_name} ${staff.last_name}`;

        const profileRole = document.getElementById('profile-role');
        if (profileRole) profileRole.textContent = 'Amministratore';

        const profileEmail = document.getElementById('profile-email');
        if (profileEmail) profileEmail.textContent = staff.email || 'Nessuna email';

        document.getElementById('logout-btn').addEventListener('click', function () {
            window.isLoggingOut = true;
            console.log('Logging out...');
            localStorage.removeItem('token');
            localStorage.removeItem('staffInfo');
            window.location.href = 'staff-login.html';
        });

        return true;
    } catch (error) {
        console.error('Error parsing staff info:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('staffInfo');
        window.location.href = 'staff-login.html';
        return false;
    }
}