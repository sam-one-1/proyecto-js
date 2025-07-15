// script/register.js - Manejo del formulario de registro

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.querySelector('.register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegistration);
    }
});

/**
 * Maneja el envío del formulario de registro.
 * @param {Event} e - Evento de submit.
 */
function handleRegistration(e) {
    e.preventDefault();

    // 1. Obtener todos los valores del formulario
    const idType = document.getElementById('id-type').value;
    const idNumber = document.getElementById('id-number').value.trim();
    const firstName = document.getElementById('first-name').value.trim();
    const lastName = document.getElementById('last-name').value.trim();
    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    const address = document.getElementById('address').value.trim();
    const city = document.getElementById('city').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;
    // const marketingOptIn = document.getElementById('marketing').checked; // Opcional, no es obligatorio

    // 2. Validar campos obligatorios
    if (!idType || !idNumber || !firstName || !lastName || !gender || !phone || !email || !address || !city || !password || !confirmPassword) {
        showAlert('Todos los campos marcados con * son obligatorios.', 'error');
        return;
    }

    // 3. Validar coincidencia de contraseñas
    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden.', 'error');
        return;
    }

    // 4. Validar longitud de contraseña (ejemplo simple, puedes añadir más complejidad)
    if (password.length < 8) {
        showAlert('La contraseña debe tener al menos 8 caracteres.', 'error');
        return;
    }

    // 5. Validar aceptación de términos y condiciones
    if (!termsAccepted) {
        showAlert('Debes aceptar los Términos y Condiciones para registrarte.', 'error');
        return;
    }

    // 6. Crear objeto con los datos del nuevo usuario
    const newUserData = {
        idType,
        idNumber,
        firstName,
        lastName,
        gender,
        phone,
        email,
        address,
        city,
        password // En un entorno real, la contraseña debería ser hasheada aquí
    };

    // 7. Intentar registrar el usuario usando la función de utils.js
    const registrationResult = registerUser(newUserData);

    if (registrationResult.success) {
        // Mostrar resumen de registro y ocultar formulario
        document.querySelector('.register-form').style.display = 'none';
        const summaryDiv = document.getElementById('registration-summary');
        document.getElementById('summary-account-number').textContent = registrationResult.accountNumber;
        document.getElementById('summary-created-at').textContent = new Date(registrationResult.createdAt).toLocaleDateString('es-CO');
        summaryDiv.style.display = 'block';

        showAlert(registrationResult.message, 'success');
    } else {
        showAlert(registrationResult.message, 'error');
    }
}

/**
 * Muestra un mensaje de alerta específico para el formulario de registro.
 * @param {string} message - Mensaje a mostrar.
 * @param {string} type - Tipo de alerta ('error', 'success').
 */
function showAlert(message, type = 'error') {
    // Eliminar alertas previas
    const existingAlert = document.querySelector('.form-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `form-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar antes del formulario
    const registerCard = document.querySelector('.register-card');
    const registerForm = document.querySelector('.register-form');
    if (registerCard && registerForm) {
        registerCard.insertBefore(alertDiv, registerForm);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}