// script/app.js - Punto de entrada principal de la aplicación bancaria

/**
 * Inicializa la aplicación cuando el DOM está listo
 */
document.addEventListener('DOMContentLoaded', function() {
    // 1. Inicializar almacenamiento (datos demo si no existen)
    initializeStorage();
    
    // 2. Verificar autenticación en páginas protegidas
    checkAuthentication();
    
    // 3. Configurar manejadores globales
    setupGlobalHandlers();
});

/**
 * Inicializa el almacenamiento local con datos de prueba
 * Se ha movido la lógica de inicialización a utils.js para mantener este archivo más limpio.
 */
function initializeStorage() {
    // Verificar si ya está inicializado con datos de prueba
    if (!localStorage.getItem('appInitialized')) {
        console.log('Inicializando datos de prueba...');
        
        // Datos demo para usuarios
        const demoUsers = [
            {
                idType: 'cc',
                idNumber: '123456789',
                firstName: 'Admin',
                lastName: 'Demo',
                gender: 'masculino',
                phone: '3001234567',
                email: 'admin@acmebank.com',
                address: 'Calle Ficticia 123',
                city: 'Bogotá',
                password: 'Demo1234', // ¡En producción usar hash!
                accounts: ['100000001'],
                createdAt: new Date().toISOString()
            }
        ];
        
        // Datos demo para cuentas
        const demoAccounts = [
            {
                accountNumber: '100000001',
                userId: '123456789',
                balance: 5000000, // 5 millones COP
                createdAt: new Date().toISOString()
            }
        ];

        // Datos demo para transacciones (algunas para el usuario demo)
        const demoTransactions = [
            {
                id: generateTransactionId(),
                accountNumber: '100000001',
                date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 días
                reference: generateReference(),
                type: 'deposit',
                description: 'Consignación inicial',
                amount: 5000000,
                balanceAfter: 5000000
            },
            {
                id: generateTransactionId(),
                accountNumber: '100000001',
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // Hace 3 días
                reference: generateReference(),
                type: 'withdrawal',
                description: 'Retiro de efectivo',
                amount: 500000,
                balanceAfter: 4500000
            },
            {
                id: generateTransactionId(),
                accountNumber: '100000001',
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Hace 1 día
                reference: generateReference(),
                type: 'payment',
                description: 'Pago de servicio público Energía',
                amount: 150000,
                balanceAfter: 4350000
            }
        ];
        
        // Guardar en localStorage usando las funciones de utils.js
        saveUsers(demoUsers);
        saveAccounts(demoAccounts);
        saveTransactions(demoTransactions);
        
        localStorage.setItem('appInitialized', 'true'); // Marca la aplicación como inicializada
    }
}

/**
 * Verifica la autenticación del usuario y redirige si es necesario.
 * Las páginas protegidas solo se pueden acceder si hay un `currentUser` en `sessionStorage`.
 */
function checkAuthentication() {
    const protectedPages = [
        'dashboard.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Opcional: Verificar que el usuario aún exista en los registros de localStorage
        // Esto previene que un usuario eliminado del localStorage siga "logueado" con sessionStorage
        const users = getUsers(); // Usa la función de utils.js
        const userExists = users.some(user => 
            user.idType === currentUser.idType && 
            user.idNumber === currentUser.idNumber
        );
        
        if (!userExists) {
            sessionStorage.removeItem('currentUser'); // Limpiar sesión inválida
            window.location.href = 'login.html';
        }
    }
}

/**
 * Configura manejadores globales para la aplicación.
 * Esto incluye el manejo de errores y un formateador de moneda global.
 */
function setupGlobalHandlers() {
    // Manejar errores no capturados
    window.onerror = function(message, source, lineno, colno, error) {
        console.error(`Error no capturado: ${message} en ${source}:${lineno}`);
        showGlobalAlert('Ocurrió un error inesperado. Por favor recarga la página.', 'error');
        return true; // Suprime el error en la consola del navegador
    };
    
    // Manejar promesas no capturadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promesa rechazada no capturada:', event.reason);
        showGlobalAlert('Error en una operación asíncrona. Por favor intenta nuevamente.', 'error');
    });
}

/**
 * Muestra una alerta global en la parte superior de la ventana.
 * @param {string} message - Mensaje a mostrar.
 * @param {string} type - Tipo de alerta ('error', 'success', 'warning').
 */
window.showGlobalAlert = function(message, type = 'error') {
    // Eliminar alertas previas
    const existingAlert = document.getElementById('global-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.id = 'global-alert';
    alertDiv.className = `global-alert alert-${type}`;
    alertDiv.innerHTML = `
        <p>${message}</p>
        <button class="close-alert">&times;</button>
    `;
    
    // Insertar al inicio del body
    document.body.prepend(alertDiv);
    
    // Configurar botón de cierre
    alertDiv.querySelector('.close-alert').addEventListener('click', function() {
        alertDiv.remove();
    });
    
    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) { // Asegurarse de que no ha sido eliminada manualmente
            alertDiv.remove();
        }
    }, 5000);
};

/**
 * Función global para formatear moneda colombiana.
 * @param {number} amount - Cantidad numérica a formatear.
 * @returns {string} El valor formateado como moneda (ej. "$ 1.234.567").
 */
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};