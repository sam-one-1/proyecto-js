        // Validación básica de contraseñas coincidentes
        document.querySelector('.register-form')?.addEventListener('submit', function(e) {
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (password !== confirmPassword) {
                e.preventDefault();
                alert('Las contraseñas no coinciden');
            }
            
            if (!document.getElementById('terms').checked) {
                e.preventDefault();
                alert('Debes aceptar los términos y condiciones');
            }
        });