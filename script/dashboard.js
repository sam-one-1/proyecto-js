// script/dashboard.js - Controlador principal del panel de usuario

let currentUser = null;
let currentAccount = null;

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    // 1. Verificar autenticación al cargar la página del dashboard
    currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html'; // Redirigir si no hay usuario autenticado
        return;
    }

    // 2. Cargar datos del usuario y su cuenta
    currentAccount = getAccount(currentUser.accounts[0]); // Asumimos la primera cuenta para simplificar
    if (!currentAccount) {
        showGlobalAlert('No se encontró una cuenta asociada a su usuario.', 'error');
        // Opcional: Redirigir a una página de error o al login
        setTimeout(() => window.location.href = 'login.html', 3000);
        return;
    }

    loadUserData(currentUser, currentAccount);
    
    // 3. Configurar navegación del menú
    setupNavigation();
    
    // 4. Cargar sección por defecto (Resumen)
    loadSection('summary');
    
    // 5. Configurar botones globales (Cerrar Sesión, Imprimir)
    setupGlobalButtons();
});

/**
 * Carga los datos del usuario y su cuenta en la interfaz del dashboard.
 * @param {object} user - Objeto del usuario autenticado.
 * @param {object} account - Objeto de la cuenta principal del usuario.
 */
function loadUserData(user, account) {
    document.getElementById('user-name').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('account-number').textContent = `Cuenta: ${account.accountNumber}`;
    updateBalanceDisplay(account.balance);
}

/**
 * Configura la navegación entre las diferentes secciones del dashboard.
 */
function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('data-section');
            loadSection(sectionId);
        });
    });
}

/**
 * Carga y muestra una sección específica del dashboard, inyectando el contenido dinámico.
 * @param {string} sectionId - ID de la sección a cargar (ej. 'summary', 'transactions').
 */
function loadSection(sectionId) {
    // Ocultar todas las secciones de contenido
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // Remover la clase 'active' de todos los enlaces del menú
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // Mostrar la sección seleccionada y activar su enlace en el menú
    const targetSection = document.getElementById(`${sectionId}-section`);
    if (targetSection) {
        targetSection.classList.add('active');
        document.querySelector(`.nav-link[data-section="${sectionId}"]`).classList.add('active');
    }

    // Limpiar alertas de formularios al cambiar de sección
    const existingAlerts = document.querySelectorAll('.form-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Cargar contenido específico de cada sección
    switch(sectionId) {
        case 'summary':
            displayAccountSummary(currentAccount);
            break;
        case 'transactions':
            displayTransactionsSummary(currentAccount);
            break;
        case 'deposit':
            setupDepositForm(currentAccount, currentUser);
            break;
        case 'withdraw':
            setupWithdrawForm(currentAccount, currentUser);
            break;
        case 'payments':
            setupPaymentsForm(currentAccount, currentUser);
            break;
        case 'statement':
            setupStatementForm(currentAccount, currentUser);
            break;
        case 'certificate':
            generateBankCertificate(currentAccount, currentUser);
            break;
    }
}

/**
 * Muestra el resumen de la cuenta en la sección 'summary'.
 * @param {object} account - Objeto de la cuenta actual.
 */
function displayAccountSummary(account) {
    document.getElementById('summary-account-num').textContent = account.accountNumber;
    document.getElementById('summary-current-balance').textContent = formatCurrency(account.balance);
    document.getElementById('summary-created-at').textContent = new Date(account.createdAt).toLocaleDateString('es-CO');
    
    displayLastTransactions(account.accountNumber, 5); // Mostrar las 5 últimas transacciones
}

/**
 * Muestra las últimas X transacciones del usuario en una tabla.
 * @param {string} accountNumber - Número de cuenta.
 * @param {number} limit - Número máximo de transacciones a mostrar.
 * @param {HTMLElement} container - Contenedor HTML donde se mostrará la tabla.
 */
function displayLastTransactions(accountNumber, limit = 10, containerId = 'last-transactions-container') {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = ''; // Limpiar contenido previo

    const allTransactions = getTransactions();
    const userTransactions = allTransactions
        .filter(t => t.accountNumber === accountNumber)
        .sort((a, b) => new Date(b.date) - new Date(a.date)) // Ordenar de más reciente a más antigua
        .slice(0, limit); // Obtener solo el límite superior

    if (userTransactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">No hay transacciones recientes para mostrar.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'transaction-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Saldo Post</th>
            </tr>
        </thead>
        <tbody>
            ${userTransactions.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('es-CO')}</td>
                    <td>${t.reference}</td>
                    <td>${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                    <td>${t.description}</td>
                    <td class="${t.type === 'deposit' ? 'amount-deposit' : 'amount-withdrawal'}">${formatCurrency(t.amount)}</td>
                    <td>${formatCurrency(t.balanceAfter)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}

/**
 * Muestra el resumen completo de transacciones del usuario en la sección 'transactions'.
 * @param {object} account - Objeto de la cuenta actual.
 */
function displayTransactionsSummary(account) {
    const container = document.getElementById('all-transactions-container');
    if (!container) return;

    container.innerHTML = ''; // Limpiar contenido previo

    const allTransactions = getTransactions();
    const userTransactions = allTransactions
        .filter(t => t.accountNumber === account.accountNumber)
        .sort((a, b) => new Date(b.date) - new Date(a.date)); // Ordenar de más reciente a más antigua

    if (userTransactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">No hay transacciones para mostrar.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'transaction-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Valor</th>
                <th>Saldo Post</th>
            </tr>
        </thead>
        <tbody>
            ${userTransactions.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('es-CO')}</td>
                    <td>${t.reference}</td>
                    <td>${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                    <td>${t.description}</td>
                    <td class="${t.type === 'deposit' ? 'amount-deposit' : 'amount-withdrawal'}">${formatCurrency(t.amount)}</td>
                    <td>${formatCurrency(t.balanceAfter)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);

    // Configurar botón de imprimir resumen de transacciones
    document.getElementById('print-transactions-btn').onclick = () => printSection('transactions-section');
}

/**
 * Configura el formulario de consignación electrónica.
 * @param {object} account - Objeto de la cuenta actual.
 * @param {object} user - Objeto del usuario actual.
 */
function setupDepositForm(account, user) {
    const form = document.getElementById('deposit-form');
    const summaryContainer = document.getElementById('deposit-summary-container');
    
    // Asegurarse de que el formulario y el resumen estén en el estado correcto al cargar
    form.style.display = 'flex';
    summaryContainer.style.display = 'none';
    form.reset();

    // Rellenar datos fijos del formulario
    document.getElementById('deposit-account-number').textContent = account.accountNumber;
    document.getElementById('deposit-user-name').textContent = `${user.firstName} ${user.lastName}`;

    form.onsubmit = async function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('deposit-amount').value);

        if (isNaN(amount) || amount <= 0) {
            showAlertForm(form, 'Por favor ingrese una cantidad válida y positiva.', 'error');
            return;
        }

        try {
            const transaction = performTransaction(account.accountNumber, amount, 'deposit', 'Consignación por canal electrónico');
            
            // Actualizar el saldo global en el display
            currentAccount.balance = transaction.balanceAfter; // Actualizar el objeto local
            updateBalanceDisplay(currentAccount.balance);

            // Mostrar resumen
            document.getElementById('deposit-summary-date').textContent = new Date(transaction.date).toLocaleString('es-CO');
            document.getElementById('deposit-summary-ref').textContent = transaction.reference;
            document.getElementById('deposit-summary-type').textContent = 'Consignación';
            document.getElementById('deposit-summary-desc').textContent = transaction.description;
            document.getElementById('deposit-summary-amount').textContent = formatCurrency(transaction.amount);

            form.style.display = 'none';
            summaryContainer.style.display = 'block';
            showAlertForm(summaryContainer, 'Consignación realizada con éxito.', 'success');

            // Configurar botón de imprimir resumen de consignación
            document.getElementById('print-deposit-btn').onclick = () => printSection('deposit-summary-container');
            
        } catch (error) {
            showAlertForm(form, error.message, 'error');
        }
    };
}

/**
 * Configura el formulario de retiro de dinero.
 * @param {object} account - Objeto de la cuenta actual.
 * @param {object} user - Objeto del usuario actual.
 */
function setupWithdrawForm(account, user) {
    const form = document.getElementById('withdraw-form');
    const summaryContainer = document.getElementById('withdraw-summary-container');

    form.style.display = 'flex';
    summaryContainer.style.display = 'none';
    form.reset();

    document.getElementById('withdraw-account-number').textContent = account.accountNumber;
    document.getElementById('withdraw-user-name').textContent = `${user.firstName} ${user.lastName}`;

    form.onsubmit = async function(e) {
        e.preventDefault();
        const amount = parseFloat(document.getElementById('withdraw-amount').value);

        if (isNaN(amount) || amount <= 0) {
            showAlertForm(form, 'Por favor ingrese una cantidad válida y positiva.', 'error');
            return;
        }

        try {
            const transaction = performTransaction(account.accountNumber, amount, 'withdrawal', 'Retiro de dinero');
            
            currentAccount.balance = transaction.balanceAfter;
            updateBalanceDisplay(currentAccount.balance);

            document.getElementById('withdraw-summary-date').textContent = new Date(transaction.date).toLocaleString('es-CO');
            document.getElementById('withdraw-summary-ref').textContent = transaction.reference;
            document.getElementById('withdraw-summary-type').textContent = 'Retiro';
            document.getElementById('withdraw-summary-desc').textContent = transaction.description;
            document.getElementById('withdraw-summary-amount').textContent = formatCurrency(transaction.amount);

            form.style.display = 'none';
            summaryContainer.style.display = 'block';
            showAlertForm(summaryContainer, 'Retiro realizado con éxito.', 'success');

            document.getElementById('print-withdraw-btn').onclick = () => printSection('withdraw-summary-container');

        } catch (error) {
            showAlertForm(form, error.message, 'error');
        }
    };
}

/**
 * Configura el formulario de pago de servicios públicos.
 * @param {object} account - Objeto de la cuenta actual.
 * @param {object} user - Objeto del usuario actual.
 */
function setupPaymentsForm(account, user) {
    const form = document.getElementById('payments-form');
    const summaryContainer = document.getElementById('payments-summary-container');

    form.style.display = 'flex';
    summaryContainer.style.display = 'none';
    form.reset();

    document.getElementById('payments-account-number').textContent = account.accountNumber;
    document.getElementById('payments-user-name').textContent = `${user.firstName} ${user.lastName}`;

    form.onsubmit = async function(e) {
        e.preventDefault();
        const serviceType = document.getElementById('service-type').value;
        const paymentReference = document.getElementById('payment-reference').value.trim();
        const amount = parseFloat(document.getElementById('payment-amount').value);

        if (!serviceType || !paymentReference || isNaN(amount) || amount <= 0) {
            showAlertForm(form, 'Por favor complete todos los campos para el pago.', 'error');
            return;
        }

        try {
            const description = `Pago de servicio público ${serviceType} (Ref: ${paymentReference})`;
            const transaction = performTransaction(account.accountNumber, amount, 'payment', description);
            
            currentAccount.balance = transaction.balanceAfter;
            updateBalanceDisplay(currentAccount.balance);

            document.getElementById('payments-summary-date').textContent = new Date(transaction.date).toLocaleString('es-CO');
            document.getElementById('payments-summary-ref-bank').textContent = transaction.reference;
            document.getElementById('payments-summary-type').textContent = 'Retiro';
            document.getElementById('payments-summary-desc').textContent = transaction.description;
            document.getElementById('payments-summary-amount').textContent = formatCurrency(transaction.amount);

            form.style.display = 'none';
            summaryContainer.style.display = 'block';
            showAlertForm(summaryContainer, `Pago de ${serviceType} realizado con éxito.`, 'success');

            document.getElementById('print-payments-btn').onclick = () => printSection('payments-summary-container');

        } catch (error) {
            showAlertForm(form, error.message, 'error');
        }
    };
}

/**
 * Configura el formulario para generar el extracto bancario.
 * @param {object} account - Objeto de la cuenta actual.
 * @param {object} user - Objeto del usuario actual.
 */
function setupStatementForm(account, user) {
    const form = document.getElementById('statement-form');
    const resultsContainer = document.getElementById('statement-results');

    resultsContainer.style.display = 'none'; // Ocultar resultados al cargar la sección
    form.reset();

    document.getElementById('statement-account-number').textContent = account.accountNumber;
    document.getElementById('statement-user-name').textContent = `${user.firstName} ${user.lastName}`;

    // Rellenar años disponibles (ej. desde el año de creación hasta el actual)
    const yearSelect = document.getElementById('statement-year');
    const currentYear = new Date().getFullYear();
    const accountCreationYear = new Date(account.createdAt).getFullYear();
    yearSelect.innerHTML = '<option value="" disabled selected>Seleccione un año</option>';
    for (let year = currentYear; year >= accountCreationYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }

    form.onsubmit = function(e) {
        e.preventDefault();
        const year = parseInt(document.getElementById('statement-year').value);
        const month = parseInt(document.getElementById('statement-month').value);

        if (isNaN(year) || isNaN(month)) {
            showAlertForm(form, 'Por favor seleccione un año y un mes válidos.', 'error');
            return;
        }

        generateBankStatement(account.accountNumber, year, month);
        resultsContainer.style.display = 'block';
    };
}

/**
 * Genera y muestra el extracto bancario para un período específico.
 * @param {string} accountNumber - Número de cuenta.
 * @param {number} year - Año del extracto.
 * @param {number} month - Mes del extracto (1-12).
 */
function generateBankStatement(accountNumber, year, month) {
    const container = document.getElementById('statement-transactions-container');
    const periodSpan = document.getElementById('statement-period');
    container.innerHTML = ''; // Limpiar contenido previo

    const allTransactions = getTransactions();
    const filteredTransactions = allTransactions
        .filter(t => t.accountNumber === accountNumber &&
                      new Date(t.date).getFullYear() === year &&
                      new Date(t.date).getMonth() + 1 === month) // getMonth() es 0-indexed
        .sort((a, b) => new Date(a.date) - new Date(b.date)); // Ordenar cronológicamente

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    periodSpan.textContent = `${monthNames[month - 1]} de ${year}`;

    if (filteredTransactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">No hay movimientos para el período seleccionado.</p>';
        return;
    }

    const table = document.createElement('table');
    table.className = 'transaction-table';
    table.innerHTML = `
        <thead>
            <tr>
                <th>Fecha</th>
                <th>Referencia</th>
                <th>Tipo</th>
                <th>Concepto / Descripción</th>
                <th>Valor</th>
            </tr>
        </thead>
        <tbody>
            ${filteredTransactions.map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('es-CO')}</td>
                    <td>${t.reference}</td>
                    <td>${t.type.charAt(0).toUpperCase() + t.type.slice(1)}</td>
                    <td>${t.description}</td>
                    <td class="${t.type === 'deposit' ? 'amount-deposit' : 'amount-withdrawal'}">${formatCurrency(t.amount)}</td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);

    document.getElementById('print-statement-btn').onclick = () => printSection('statement-results');
}

/**
 * Genera y muestra el certificado bancario.
 * @param {object} account - Objeto de la cuenta actual.
 * @param {object} user - Objeto del usuario actual.
 */
function generateBankCertificate(account, user) {
    const certificateContentDiv = document.getElementById('certificate-content');
    if (!certificateContentDiv) return;

    const issueDate = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const creationDate = new Date(account.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
    const bankName = "Acme Bank S.A.";
    const bankAddress = "Calle 10 # 5-20, Cúcuta, Norte de Santander, Colombia";
    const fullName = `${user.firstName} ${user.lastName}`;
    const idTypeFull = { 'cc': 'Cédula de Ciudadanía', 'ce': 'Cédula de Extranjería', 'passport': 'Pasaporte' }[user.idType] || user.idType;

    certificateContentDiv.innerHTML = `
        <h3>CERTIFICADO DE TENENCIA DE CUENTA</h3>
        <p style="text-align: center; margin-bottom: 2rem;"><strong>${bankName}</strong></p>
        <p>Por medio del presente, <strong>${bankName}</strong>, con domicilio en ${bankAddress}, se permite certificar que:</p>
        <p>El/La señor(a) <strong>${fullName}</strong>, identificado(a) con ${idTypeFull} número ${user.idNumber},
           titular de la cuenta de ahorros No. <strong>${account.accountNumber}</strong>, la cual se encuentra activa y vigente desde el <strong>${creationDate}</strong>.</p>
        <p style="margin-top: 1.5rem;">El presente certificado se expide a solicitud del interesado(a), en Cúcuta, a los ${issueDate}.</p>
        <p style="text-align: center; margin-top: 3rem;">_______________________________</p>
        <p style="text-align: center;">Firma Autorizada de ${bankName}</p>
        <div class="signature">
            <p>Teléfono de contacto: +57 1 8000-123456</p>
            <p>Correo electrónico: contacto@acmebank.com</p>
        </div>
    `;

    document.getElementById('print-certificate-btn').onclick = () => printSection('certificate-section');
}


/**
 * Actualiza el saldo visible en el dashboard.
 * @param {number} newBalance - El nuevo saldo a mostrar.
 */
function updateBalanceDisplay(newBalance) {
    const balanceElements = document.querySelectorAll('.balance-display span');
    balanceElements.forEach(el => {
        el.textContent = formatCurrency(newBalance);
    });
    // También actualizar el saldo en la tarjeta de resumen si está visible
    const summaryBalance = document.getElementById('summary-current-balance');
    if (summaryBalance) {
        summaryBalance.textContent = formatCurrency(newBalance);
    }
}

/**
 * Muestra un mensaje de alerta específico dentro de un formulario.
 * @param {HTMLElement} parentElement - El elemento contenedor donde se insertará la alerta (ej. el formulario).
 * @param {string} message - Mensaje a mostrar.
 * @param {string} type - Tipo de alerta ('error', 'success').
 */
function showAlertForm(parentElement, message, type = 'error') {
    // Eliminar alertas previas en este contenedor
    const existingAlert = parentElement.querySelector('.form-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `form-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar la alerta
    parentElement.prepend(alertDiv);
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}


/**
 * Configura los botones globales del dashboard.
 */
function setupGlobalButtons() {
    // Botón de cerrar sesión
    document.getElementById('logout-btn').addEventListener('click', logout);
}

/**
 * Cierra la sesión del usuario.
 */
function logout() {
    sessionStorage.removeItem('currentUser'); // Eliminar el usuario de la sesión
    window.location.href = 'login.html'; // Redirigir a la página de inicio de sesión
}

/**
 * Imprime el contenido de una sección específica.
 * Utiliza un truco CSS para ocultar el resto de la página.
 * @param {string} sectionId - El ID del contenedor que se desea imprimir.
 */
function printSection(sectionId) {
    const printContent = document.getElementById(sectionId);
    if (printContent) {
        // Clonar el contenido para evitar modificar el DOM original mientras se imprime
        const clonedContent = printContent.cloneNode(true);
        clonedContent.id = 'print-area'; // ID temporal para el CSS de impresión

        // Guardar el contenido original del body
        const originalBodyContent = document.body.innerHTML;

        // Reemplazar el body con el contenido a imprimir
        document.body.innerHTML = ''; // Limpiar el body
        document.body.appendChild(clonedContent); // Añadir el contenido clonado

        window.print(); // Abrir el diálogo de impresión

        // Restaurar el contenido original del body después de imprimir
        document.body.innerHTML = originalBodyContent;
        // La recarga de la página podría ser una alternativa más robusta, pero menos elegante
        // window.location.reload(); 
    } else {
        showGlobalAlert('No se pudo encontrar el contenido para imprimir.', 'error');
    }
}