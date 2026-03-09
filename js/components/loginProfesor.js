import { AuthState } from '../core/authState.js';

export const LoginProfesorView = () => {
    setTimeout(() => {
        const form = document.getElementById('profesor-login-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('profesor-email').value.trim();
            const pass = document.getElementById('profesor-pass').value;
            const name = document.getElementById('profesor-name').value.trim();
            const err = document.getElementById('profesor-login-err');
            const btn = form.querySelector('button[type="submit"]');

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando con Servidor...';
            btn.disabled = true;

            try {
                const user = await AuthState.db.validateUsuario(email, pass);
                if (user) {
                    AuthState.loginAsProfesor(email, user.nombre || name || email.split('@')[0]);
                    window.router.navigate('/dashboard-profesor');
                } else {
                    err.style.display = 'block';
                    err.textContent = 'Credenciales incorrectas (Verifícalas en tu BD).';
                    btn.innerHTML = 'Ingresar al Panel';
                    btn.disabled = false;
                    setTimeout(() => { err.style.display = 'none'; }, 5000);
                }
            } catch (error) {
                err.style.display = 'block';
                err.textContent = 'Error de conexión con Base de Datos.';
                btn.innerHTML = 'Re-intentar';
                btn.disabled = false;
            }
        });
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="login-card">
            <div class="login-card-icon">
                <i class="fa-solid fa-user-tie" style="color:var(--tecnm-gold);font-size:2rem;"></i>
            </div>
            <h2 class="login-card-title">Acceso a Profesores</h2>
            <p class="login-card-sub">Panel de administración de eventos, banco de problemas y gestión de equipos.</p>

            <div id="profesor-login-err" class="error-inline" style="display:none;"></div>

            <form id="profesor-login-form">
                <div class="form-group">
                    <label class="form-label">Nombre (para mostrar en el scoreboard/eventos)</label>
                    <input type="text" id="profesor-name" class="form-input" placeholder="Ing. Nombre Apellido">
                </div>
                <div class="form-group">
                    <label class="form-label">Correo Institucional</label>
                    <input type="email" id="profesor-email" class="form-input" required placeholder="profesor@itcm.edu.mx">
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="password" id="profesor-pass" class="form-input" required placeholder="••••••••">
                </div>
                <p class="coach-login-hint">
                    <i class="fa-solid fa-circle-info"></i>
                    Primera vez sin cuenta: ingresa cualquier correo simulado para Entorno Local.
                </p>
                <button type="submit" class="btn btn-primary" style="width:100%;margin-top:.5rem;">
                    Ingresar al Panel
                </button>
            </form>
            <p style="text-align:center;margin-top:1.5rem;font-size:.9em;">
                ¿Eres nuevo? 
                <a href="#" data-route="/register-profesor" style="color:var(--tecnm-blue);font-weight:600;text-decoration:none;">
                    Regístrate aquí
                </a>
            </p>
            <p style="text-align:center;margin-top:1rem;">
                <a href="#" data-route="/" style="color:var(--tecnm-text-muted);text-decoration:none;font-size:.9em;">
                    <i class="fa-solid fa-arrow-left"></i> Volver al Inicio
                </a>
            </p>
        </div>
    </div>`;
};
