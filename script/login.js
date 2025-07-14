// Funcionalidad básica para mostrar/ocultar contraseña
 document.querySelector('.show-password')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('password');
     const icon = this.querySelector('i');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
             icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
         passwordInput.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
// login.js - Manejo de la página de inicio de sesión

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar datos si no existen
    initializeStorage();
    
    // Manejar el envío del formulario de login
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Mostrar/ocultar contraseña
    setupPasswordToggle();
});

/**
 * Inicializa el almacenamiento local con datos de prueba si no existen
 */
function initializeStorage() {
    if (!localStorage.getItem('users')) {
        const demoUsers = [
            {
                idType: 'cc',
                idNumber: '123456789',
                firstName: 'Admin',
                lastName: 'Demo',
                email: 'admin@acmebank.com',
                password: 'Demo1234', // En producción, esto debería ser un hash
                accounts: ['100000001'],
                createdAt: new Date().toISOString()
            }
        ];
        localStorage.setItem('users', JSON.stringify(demoUsers));
    }
    
    if (!localStorage.getItem('accounts')) {
        const demoAccounts = [
            {
                accountNumber: '100000001',
                userId: '123456789',
                balance: 5000000,
                createdAt: new Date().toISOString(),
                transactions: []
            }
        ];
        localStorage.setItem('accounts', JSON.stringify(demoAccounts));
    }
    
    if (!localStorage.getItem('transactions')) {
        localStorage.setItem('transactions', JSON.stringify([]));
    }
}

/**
 * Maneja el envío del formulario de login
 * @param {Event} e - Evento de submit
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // Validar campos
    if (!username || !password) {
        showAlert('Por favor complete todos los campos', 'error');
        return;
    }
    
    // Determinar si el username es email o número de documento
    let idType, idNumber;
    if (username.includes('@')) {
        // Buscar por email
        const users = JSON.parse(localStorage.getItem('users'));
        const user = users.find(u => u.email === username);
        
        if (!user) {
            showAlert('Credenciales incorrectas', 'error');
            return;
        }
        
        idType = user.idType;
        idNumber = user.idNumber;
    } else {
        // Asumir que es número de documento (requeriría más lógica en producción)
        idType = 'cc'; // Tipo por defecto, en producción pediríamos ambos campos
        idNumber = username;
    }
    
    // Autenticar usuario
    const user = authenticateUser(idType, idNumber, password);
    
    if (user) {
        // Guardar en sesión
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Si marcó "Recordar usuario", guardar en localStorage
        if (rememberMe) {
            localStorage.setItem('rememberedUser', username);
        } else {
            localStorage.removeItem('rememberedUser');
        }
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    } else {
        showAlert('Credenciales incorrectas. Por favor verifique sus datos.', 'error');
    }
}

/**
 * Autentica un usuario
 * @param {string} idType - Tipo de identificación
 * @param {string} idNumber - Número de identificación
 * @param {string} password - Contraseña
 * @returns {object|null} - Objeto de usuario o null si no se autentica
 */
function authenticateUser(idType, idNumber, password) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // En producción, deberíamos comparar con un hash de la contraseña
    const user = users.find(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.password === password
    );
    
    return user || null;
}

/**
 * Configura el botón para mostrar/ocultar contraseña
 */
function setupPasswordToggle() {
    const passwordInput = document.getElementById('password');
    const showPasswordBtn = document.querySelector('.show-password');
    
    if (passwordInput && showPasswordBtn) {
        showPasswordBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    }
}

/**
 * Muestra un mensaje de alerta
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (error, success, warning)
 */
function showAlert(message, type = 'error') {
    // Eliminar alertas previas
    const existingAlert = document.querySelector('.login-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `login-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar antes del formulario
    const loginCard = document.querySelector('.login-card');
    if (loginCard) {
        loginCard.insertBefore(alertDiv, loginCard.firstChild);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

/**
 * Carga el usuario recordado si existe
 */
function loadRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
}

// Cargar usuario recordado al cargar la página
window.addEventListener('load', loadRememberedUser);