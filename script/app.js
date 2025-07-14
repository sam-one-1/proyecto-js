// app.js - Punto de entrada principal de la aplicación bancaria

// Importar funciones necesarias (en un entorno con módulos)
// import { initializeStorage } from './auth.js';
// import { getCurrentUser } from './storage.js';

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
 */
function initializeStorage() {
    // Verificar si ya está inicializado
    if (!localStorage.getItem('appInitialized')) {
        console.log('Inicializando datos de prueba...');
        
        // Datos demo para usuarios
        const demoUsers = [
            {
                idType: 'cc',
                idNumber: '123456789',
                firstName: 'Admin',
                lastName: 'Demo',
                gender: 'male',
                phone: '3001234567',
                email: 'admin@acmebank.com',
                address: 'Calle 123',
                city: 'Bogotá',
                password: 'Demo1234', // En producción usar hash!
                accounts: ['100000001'],
                createdAt: new Date().toISOString()
            }
        ];
        
        // Datos demo para cuentas
        const demoAccounts = [
            {
                accountNumber: '100000001',
                userId: '123456789',
                balance: 5000000,
                createdAt: new Date().toISOString(),
                transactions: []
            }
        ];
        
        // Guardar en localStorage
        localStorage.setItem('users', JSON.stringify(demoUsers));
        localStorage.setItem('accounts', JSON.stringify(demoAccounts));
        localStorage.setItem('transactions', JSON.stringify([]));
        localStorage.setItem('appInitialized', 'true');
    }
}

/**
 * Verifica la autenticación del usuario
 */
function checkAuthentication() {
    const protectedPages = [
        'dashboard.html',
        'perfil.html',
        'transacciones.html'
    ];
    
    const currentPage = window.location.pathname.split('/').pop();
    
    if (protectedPages.includes(currentPage)) {
        const currentUser = JSON.parse(sessionStorage.getItem('currentUser'));
        
        if (!currentUser) {
            window.location.href = 'login.html';
            return;
        }
        
        // Verificar que el usuario aún exista en los registros
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userExists = users.some(user => 
            user.idType === currentUser.idType && 
            user.idNumber === currentUser.idNumber
        );
        
        if (!userExists) {
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        }
    }
}

/**
 * Configura manejadores globales
 */
function setupGlobalHandlers() {
    // Manejar errores no capturados
    window.onerror = function(message, source, lineno, colno, error) {
        console.error(`Error no capturado: ${message} en ${source}:${lineno}`);
        showGlobalAlert('Ocurrió un error inesperado. Por favor recarga la página.', 'error');
        return true;
    };
    
    // Manejar promesas no capturadas
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Promesa rechazada no capturada:', event.reason);
        showGlobalAlert('Error en una operación. Por favor intenta nuevamente.', 'error');
    });
}

/**
 * Muestra una alerta global en la aplicación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (error, success, warning)
 */
function showGlobalAlert(message, type = 'error') {
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
    
    // Eliminar después de 5 segundos
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * Función global para formatear moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Valor formateado
 */
window.formatCurrency = function(amount) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(amount);
};

// Exportar para pruebas (si usas módulos)
// export { initializeStorage, checkAuthentication };