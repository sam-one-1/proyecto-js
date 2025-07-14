// dashboard.js - Controlador principal del panel de usuario

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Cargar datos del usuario y cuenta
    loadUserData(currentUser);
    
    // Configurar navegación
    setupNavigation();
    
    // Cargar sección por defecto (Resumen)
    loadSection('summary');
    
    // Configurar botones globales
    setupGlobalButtons();
});


/**
 * Carga los datos del usuario y su cuenta
 * @param {object} user - Usuario autenticado
 */
function loadUserData(user) {
    const accounts = JSON.parse(localStorage.getItem('accounts')) || [];
    const userAccount = accounts.find(acc => acc.accountNumber === user.accounts[0]);

    // Mostrar información en el header
    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('account-number').textContent = `Cuenta: ${userAccount.accountNumber}`;
    
    // Actualizar saldo
    updateBalanceDisplay(userAccount.balance);
    
    // Cargar últimas transacciones
    loadTransactions(userAccount.accountNumber, 5);
}

/**
 * Configura la navegación entre secciones
 */
function setupNavigation() {
    document.querySelectorAll('[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            loadSection(sectionId);
        });
    });
}

/**
 * Carga una sección específica del dashboard
 * @param {string} sectionId - ID de la sección (summary, transactions, deposit, etc.)
 */
function loadSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Mostrar sección seleccionada
    const section = document.getElementById(`${sectionId}-section`);
    if (section) section.classList.add('active');

    // Marcar enlace activo
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionId}"]`).classList.add('active');

    // Cargar contenido dinámico
    const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    const account = getAccount(currentUser.accounts[0]);

    switch(sectionId) {
        case 'summary':
            loadSummary(account);
            break;
        case 'transactions':
            loadAllTransactions(account.accountNumber);
            break;
        case 'deposit':
            setupDepositForm(account);
            break;
        case 'withdraw':
            setupWithdrawForm(account);
            break;
        case 'payments':
            setupPaymentsForm(account);
            break;
        case 'statement':
            setupStatementForm();
            break;
        case 'certificate':
            generateCertificate(account, currentUser);
            break;
    }
}


/**
 * Carga el resumen de la cuenta
 * @param {object} account - Datos de la cuenta
 */
function loadSummary(account) {
    document.getElementById('current-balance').textContent = formatCurrency(account.balance);
    document.getElementById('account-type').textContent = account.type || 'Ahorros';
    document.getElementById('account-created').textContent = new Date(account.createdAt).toLocaleDateString('es-CO');
    loadTransactions(account.accountNumber, 5);
}

/**
 * Configura el formulario de consignación
 */
function setupDepositForm(account) {
    const form = document.getElementById('deposit-form');
    if (!form) return;

    form.reset();
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);

        try {
            const transaction = makeDeposit(account.accountNumber, amount);
            updateBalanceDisplay(account.balance + amount);
            showAlert('Consignación realizada con éxito', 'success');
            form.reset();
            loadSection('summary'); // Recargar resumen
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

/**
 * Configura el formulario de retiro
 */
function setupWithdrawForm(account) {
    const form = document.getElementById('withdraw-form');
    if (!form) return;

    form.reset();
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('withdraw-amount').value);

        try {
            const transaction = makeWithdrawal(account.accountNumber, amount);
            updateBalanceDisplay(account.balance - amount);
            showAlert('Retiro realizado con éxito', 'success');
            form.reset();
            loadSection('summary');
        } catch (error) {
            showAlert(error.message, 'error');
        }
    });
}

/**
 * Actualiza el saldo mostrado en la UI
 * @param {number} newBalance - Nuevo saldo
 */
function updateBalanceDisplay(newBalance) {
    const balanceElements = document.querySelectorAll('.balance-display');
    balanceElements.forEach(el => {
        el.textContent = formatCurrency(newBalance);
    });
}

/**
 * Muestra alertas al usuario
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo (success, error, warning)
 */
function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.main-content');
    container.prepend(alertDiv);

    setTimeout(() => alertDiv.remove(), 5000);
}

/**
 * Cierra la sesión del usuario
 */
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}

// ==================== INICIALIZACIÓN ====================

function setupGlobalButtons() {
    // Botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', logout);

    // Botón de imprimir certificado
    document.getElementById('print-certificate')?.addEventListener('click', () => {
        window.print();
    });
}

// Helper: Formatear moneda
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
}