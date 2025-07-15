// script/login.js - Manejo de la página de inicio de sesión

document.addEventListener('DOMContentLoaded', function() {
    // Manejar el envío del formulario de login
    const loginForm = document.querySelector('.login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Cargar el usuario recordado si existe
    loadRememberedUser();
});

/**
 * Maneja el envío del formulario de login.
 * @param {Event} e - Evento de submit.
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const idType = document.getElementById('id-type').value;
    const idNumber = document.getElementById('id-number').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // Validar campos
    if (!idType || !idNumber || !password) {
        showAlert('Por favor seleccione el tipo de identificación, ingrese el número y la contraseña.', 'error');
        return;
    }
    
    // Autenticar usuario usando la función de utils.js
    const user = authenticateUser(idType, idNumber, password);
    
    if (user) {
        // Guardar usuario actual en sessionStorage
        sessionStorage.setItem('currentUser', JSON.stringify(user));
        
        // Si marcó "Recordar usuario", guardar los datos de login en localStorage
        if (rememberMe) {
            localStorage.setItem('rememberedIdType', idType);
            localStorage.setItem('rememberedIdNumber', idNumber);
        } else {
            localStorage.removeItem('rememberedIdType');
            localStorage.removeItem('rememberedIdNumber');
        }
        
        // Redirigir al dashboard
        window.location.href = 'dashboard.html';
    } else {
        showAlert('No se pudo validar su identidad. Por favor verifique sus credenciales.', 'error');
    }
}

/**
 * Muestra un mensaje de alerta específico para el formulario de login.
 * @param {string} message - Mensaje a mostrar.
 * @param {string} type - Tipo de alerta ('error', 'success').
 */
function showAlert(message, type = 'error') {
    // Eliminar alertas previas
    const existingAlert = document.querySelector('.form-alert'); // Clase específica para alertas de formulario
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `form-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar antes del formulario
    const loginCard = document.querySelector('.login-card');
    const loginForm = document.querySelector('.login-form');
    if (loginCard && loginForm) {
        loginCard.insertBefore(alertDiv, loginForm);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}

/**
 * Carga el tipo y número de identificación recordados si existen en localStorage.
 */
function loadRememberedUser() {
    const rememberedIdType = localStorage.getItem('rememberedIdType');
    const rememberedIdNumber = localStorage.getItem('rememberedIdNumber');

    if (rememberedIdType && rememberedIdNumber) {
        document.getElementById('id-type').value = rememberedIdType;
        document.getElementById('id-number').value = rememberedIdNumber;
        document.getElementById('remember').checked = true;
    }
}