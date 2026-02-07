/**
 * Sistema de Autenticación - Node.js Backend
 * Conectado a MySQL en AWS RDS
 */

document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la API
    const API_URL = 'http://localhost:3000/api/auth';

    // Selectores de elementos
    const loginForm = document.querySelector('form');
    const loginBtn = document.querySelector('.btn-login');
    const registerBtn = document.getElementById('btn-register');
    const socialBtns = document.querySelectorAll('.social-item');
    const shapes = document.querySelectorAll('.shape');
    const emailInput = document.querySelector('input[type="text"]');
    const passwordInput = document.querySelector('input[type="password"]');

    /**
     * UTILIDADES
     */

    // Validar formato de email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Validar fortaleza de contraseña
    const isValidPassword = (password) => {
        return password.length >= 6;
    };

    // Mostrar mensaje con estilo
    const showMessage = (message, type = 'info') => {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6',
            warning: '#f59e0b'
        };

        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 350px;
            font-weight: 500;
        `;
        notification.textContent = message;

        // Agregar animación
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(400px); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(400px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
        document.body.appendChild(notification);

        // Remover después de 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    };

    /**
     * 1. EFECTO PARALLAX (Fondo Dinámico)
     */
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 2) / 100;
        const y = (window.innerHeight - e.pageY * 2) / 100;

        shapes.forEach((shape, index) => {
            const speed = index === 0 ? 2 : -2;
            shape.style.transform = `translateX(${x * speed}px) translateY(${y * speed}px)`;
        });
    });

    /**
     * 2. VALIDACIÓN EN TIEMPO REAL
     */
    emailInput.addEventListener('blur', () => {
        if (emailInput.value && !isValidEmail(emailInput.value)) {
            emailInput.style.border = '2px solid #ef4444';
            showMessage('Por favor ingresa un email válido', 'warning');
        } else {
            emailInput.style.border = 'none';
        }
    });

    passwordInput.addEventListener('blur', () => {
        if (passwordInput.value && !isValidPassword(passwordInput.value)) {
            passwordInput.style.border = '2px solid #ef4444';
            showMessage('La contraseña debe tener al menos 6 caracteres', 'warning');
        } else {
            passwordInput.style.border = 'none';
        }
    });

    /**
     * 3. SISTEMA DE REGISTRO
     */
    registerBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validaciones completas
        if (!email || !password) {
            showMessage("Por favor, completa todos los campos", 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("El formato del email no es válido", 'error');
            emailInput.focus();
            return;
        }

        if (!isValidPassword(password)) {
            showMessage("La contraseña debe tener al menos 6 caracteres", 'error');
            passwordInput.focus();
            return;
        }

        // Estado de carga
        const originalText = registerBtn.innerHTML;
        registerBtn.disabled = true;
        registerBtn.innerHTML = '<i class="fas fa-database fa-spin"></i> Registrando...';

        try {
            const response = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.status === "pending_verification") {
                showMessage("Revisa tu email por el código de verificación", 'info');

                // Mostrar modal de verificación
                const code = prompt("Ingresa el código de 6 dígitos enviado a tu email (mira la consola del servidor si no configuraste SMTP):");
                if (code) {
                    await verifyCode(email, code);
                }

            } else if (result.status === "success") {
                showMessage("¡Registro exitoso! Usuario guardado en AWS RDS", 'success');
                loginForm.reset();
            } else {
                showMessage(result.message || "Error al registrar usuario", 'error');
            }

        } catch (error) {
            console.error("Error:", error);
            showMessage("No se pudo conectar con el servidor.", 'error');
        } finally {
            registerBtn.disabled = false;
            registerBtn.innerHTML = originalText;
        }
    });

    // Función para verificar código
    async function verifyCode(email, code) {
        try {
            const response = await fetch(`${API_URL}/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await response.json();

            if (data.status === 'success') {
                showMessage('¡Cuenta verificada! Ahora puedes iniciar sesión', 'success');
                loginForm.reset();
            } else {
                showMessage(data.message || 'Código incorrecto', 'error');
            }
        } catch (error) {
            showMessage('Error al verificar código', 'error');
        }
    }

    /**
     * 4. SISTEMA DE LOGIN
     */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value;

        // Validaciones
        if (!email || !password) {
            showMessage("Por favor, ingresa email y contraseña", 'warning');
            return;
        }

        if (!isValidEmail(email)) {
            showMessage("El formato del email no es válido", 'error');
            return;
        }

        // Estado de carga
        loginBtn.disabled = true;
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verificando...';

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });

            const result = await response.json();

            if (result.status === "success") {
                showMessage(`¡Bienvenido, ${result.data.username}!`, 'success');

                // Guardar datos de usuario en localStorage (opcional)
                localStorage.setItem('user', JSON.stringify(result.data));

                // Animación de éxito
                loginBtn.innerHTML = '<i class="fas fa-check-circle"></i> ¡Bienvenido!';
                loginBtn.style.background = 'linear-gradient(90deg, #10b981, #34d399)';

                // Redirección basada en rol
                setTimeout(() => {
                    const targetPage = result.data.role === 'admin' ? 'admin.html' : 'dashboard.html';
                    showMessage(`Redirigiendo a ${result.data.role === 'admin' ? 'Panel Admin' : 'Dashboard'}...`, 'info');
                    window.location.href = targetPage;
                }, 1500);

            } else if (result.status === 'unverified') {
                showMessage(result.message, 'warning');
                const code = prompt("Tu cuenta no está verificada. Ingresa el código enviado a tu email:");
                if (code) {
                    await verifyCode(email, code);
                }
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;
            } else {
                showMessage(result.message || "Credenciales incorrectas", 'error');
                loginBtn.disabled = false;
                loginBtn.innerHTML = originalText;

                // Efecto de shake en error
                loginForm.style.animation = 'shake 0.5s';
                setTimeout(() => loginForm.style.animation = '', 500);
            }

        } catch (error) {
            console.error("Error:", error);
            showMessage("Error de conexión. Verifica que el servidor esté ejecutándose.", 'error');
            loginBtn.disabled = false;
            loginBtn.innerHTML = originalText;
        }
    });

    /**
     * 5. BOTONES SOCIALES (Solo visual)
     */
    socialBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const provider = btn.getAttribute('title');
            btn.style.transform = "scale(0.9)";
            setTimeout(() => {
                btn.style.transform = "translateY(-3px)";
                showMessage(`Autenticación con ${provider} no disponible`, 'info');
            }, 100);
        });
    });

    // Agregar animación shake al CSS
    const shakeStyle = document.createElement('style');
    shakeStyle.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
            20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(shakeStyle);

    // Verificar conexión con el servidor al cargar
    checkServerConnection();

    async function checkServerConnection() {
        try {
            const response = await fetch('http://localhost:3000/api/health');
            const data = await response.json();

            if (data.status === 'ok' && data.database === 'connected') {
                console.log('[OK] Servidor conectado y base de datos activa');
            } else {
                console.warn('[AVISO] Servidor conectado pero BD desconectada');
            }
        } catch (error) {
            console.warn('[AVISO] Servidor no disponible. Inicia el servidor con: npm start');
        }
    }
});