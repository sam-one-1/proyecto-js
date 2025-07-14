// recovery.js - Manejo de la recuperación de contraseña

document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const recoveryForm = document.getElementById('recovery-form');
    const newPasswordForm = document.getElementById('new-password-form');
    const cancelBtn = document.querySelector('.btn-secondary');
    
    // Manejar el envío del formulario de recuperación
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', handleRecoveryRequest);
    }
    
    // Manejar el envío del formulario de nueva contraseña
    if (newPasswordForm) {
        newPasswordForm.addEventListener('submit', handlePasswordReset);
    }
    
    // Manejar el botón de cancelar
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            window.location.href = 'login.html';
        });
    }
});

/**
 * Maneja la solicitud de recuperación de contraseña
 * @param {Event} e - Evento de submit
 */
function handleRecoveryRequest(e) {
    e.preventDefault();
    
    // Obtener valores del formulario
    const idType = document.getElementById('id-type').value;
    const idNumber = document.getElementById('id-number').value.trim();
    const email = document.getElementById('email').value.trim();
    
    // Validar campos
    if (!idType || !idNumber || !email) {
        showAlert('Por favor complete todos los campos', 'error');
        return;
    }
    
    // Buscar usuario
    const user = findUser(idType, idNumber, email);
    
    if (user) {
        // Guardar datos temporalmente para el reseteo
        sessionStorage.setItem('passwordResetData', JSON.stringify({
            idType,
            idNumber,
            email
        }));
        
        // Mostrar formulario de nueva contraseña
        document.getElementById('recovery-form').style.display = 'none';
        document.getElementById('new-password-form').style.display = 'block';
    } else {
        showAlert('No encontramos una cuenta con esos datos. Por favor verifique la información.', 'error');
    }
}

/**
 * Maneja el reseteo de contraseña
 * @param {Event} e - Evento de submit
 */
function handlePasswordReset(e) {
    e.preventDefault();
    
    // Obtener datos de sesión
    const resetData = JSON.parse(sessionStorage.getItem('passwordResetData'));
    if (!resetData) {
        showAlert('La sesión ha expirado. Por favor inicie el proceso nuevamente.', 'error');
        window.location.href = 'recovery.html';
        return;
    }
    
    // Obtener nueva contraseña
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    // Validar contraseñas
    if (!newPassword || !confirmPassword) {
        showAlert('Por favor complete ambos campos de contraseña', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 8) {
        showAlert('La contraseña debe tener al menos 8 caracteres', 'error');
        return;
    }
    
    // Actualizar contraseña
    const success = updateUserPassword(
        resetData.idType,
        resetData.idNumber,
        resetData.email,
        newPassword
    );
    
    if (success) {
        showAlert('Contraseña actualizada correctamente. Ahora puede iniciar sesión.', 'success');
        sessionStorage.removeItem('passwordResetData');
        
        // Redirigir después de 3 segundos
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 3000);
    } else {
        showAlert('Ocurrió un error al actualizar la contraseña. Por favor intente nuevamente.', 'error');
    }
}

/**
 * Busca un usuario por sus datos de identificación
 * @param {string} idType - Tipo de identificación
 * @param {string} idNumber - Número de identificación
 * @param {string} email - Correo electrónico
 * @returns {object|null} - Objeto de usuario o null si no se encuentra
 */
function findUser(idType, idNumber, email) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    return users.find(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.email === email
    ) || null;
}

/**
 * Actualiza la contraseña de un usuario
 * @param {string} idType - Tipo de identificación
 * @param {string} idNumber - Número de identificación
 * @param {string} email - Correo electrónico
 * @param {string} newPassword - Nueva contraseña
 * @returns {boolean} - True si la actualización fue exitosa
 */
function updateUserPassword(idType, idNumber, email, newPassword) {
    const users = JSON.parse(localStorage.getItem('users'));
    const userIndex = users.findIndex(user => 
        user.idType === idType && 
        user.idNumber === idNumber && 
        user.email === email
    );
    
    if (userIndex === -1) return false;
    
    // En producción, aquí deberías hashear la contraseña
    users[userIndex].password = newPassword;
    localStorage.setItem('users', JSON.stringify(users));
    
    return true;
}

/**
 * Muestra un mensaje de alerta
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (error, success)
 */
function showAlert(message, type = 'error') {
    // Eliminar alertas previas
    const existingAlert = document.querySelector('.recovery-alert');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `recovery-alert alert-${type}`;
    alertDiv.textContent = message;
    
    // Insertar en el contenedor apropiado
    const currentForm = document.getElementById('new-password-form').style.display === 'block' 
        ? document.getElementById('new-password-form') 
        : document.getElementById('recovery-form');
    
    if (currentForm) {
        currentForm.insertBefore(alertDiv, currentForm.firstChild);
        
        // Eliminar después de 5 segundos
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }
}