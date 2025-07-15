// script/recuperar.js - Manejo de la recuperación de contraseña

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const recoveryForm = document.getElementById('recovery-form');
    const newPasswordForm = document.getElementById('new-password-form');
    
    // Manejar el envío del formulario de recuperación (paso 1)
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', handleRecoveryRequest);
    }
    
    // Manejar el envío del formulario de nueva contraseña (paso 2)
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', handlePasswordReset);
    }
});

/**
 * Maneja la solicitud inicial de recuperación de contraseña (verificación de identidad).
 * @param {Event} e - Evento de submit.
 */
function handleRecoveryRequest(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const idType = document.getElementById('id-type').value;
    const idNumber = document.getElementById('id-number').value.trim();
    const email = document.getElementById('email').value.trim();
    
    // Validar campos
    if (!idType || !idNumber || !email) {
        showAlert('Por favor complete todos los campos.', 'error');
        return;
    }
    
    // Buscar usuario usando la función de utils.js
    const user = findUserByIdAndEmail(idType, idNumber, email);
    
    if (user) {
        // Guardar datos temporalmente para el reseteo en sessionStorage
        sessionStorage.setItem('passwordResetData', JSON.stringify({
            idType,
            idNumber,
            email
        }));
        
        // Ocultar el formulario de recuperación y mostrar el de nueva contraseña
        document.getElementById('recovery-form').style.display = 'none';
        document.getElementById('new-password-form').style.display = 'block';
        showAlert('Identidad verificada. Por favor, ingrese su nueva contraseña.', 'success');
    } else {
        showAlert('No encontramos una cuenta con esos datos. Por favor verifique la información.', 'error');
    }
}

/**
 * Maneja el reseteo de contraseña (paso 2).
 * @param {Event} e - Evento de submit.
 */
function handlePasswordReset(e) {
    e.preventDefault();
    
    // Obtener datos de sesión guardados del paso 1
    const resetData = JSON.parse(sessionStorage.getItem('passwordResetData'));
    if (!resetData) {
        showAlert('La sesión para restablecer la contraseña ha expirado. Por favor inicie el proceso nuevamente.', 'error');
        setTimeout(() => { window.location.href = 'recuperar.html'; }, 3000);
        return;
    }
    
    // Obtener nueva contraseña
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validar contraseñas
    if (!newPassword || !confirmPassword) {
        showAlert('Por favor complete ambos campos de contraseña.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden.', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showAlert('La contraseña debe tener al menos 8 caracteres.', 'error');
        return;
    }
    
    // Actualizar contraseña usando la función de utils.js
    const success = updateUserPassword(
        resetData.idType,
        resetData.idNumber,
        resetData.email,
        newPassword
    );
    
    if (success) {
        showAlert('Contraseña actualizada correctamente. Ahora puede iniciar sesión.', 'success');
        sessionStorage.removeItem('passwordResetData'); // Limpiar datos temporales
        
        // Redirigir al login después de un breve retraso
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } else {
        showAlert('Ocurrió un error al actualizar la contraseña. Por favor intente nuevamente.', 'error');
    }
}

/**
 * Muestra un mensaje de alerta específico para el formulario de recuperación.
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
    
    // Insertar en el contenedor apropiado (card)
    const recoveryCard = document.querySelector('.recovery-card');
    if (recoveryCard) {
        recoveryCard.insertBefore(alertDiv, recoveryCard.querySelector('h2').nextSibling); // Insertar después del título
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}