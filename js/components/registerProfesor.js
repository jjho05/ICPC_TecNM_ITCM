import { AuthState } from '../core/authState.js';
import { UIModal } from './ui/modal.js';

export const RegisterProfesorView = () => {
    setTimeout(() => {
        const form = document.getElementById('profesor-register-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const pass = document.getElementById('reg-pass').value;
            const passConfirm = document.getElementById('reg-pass-confirm').value;
            const err = document.getElementById('reg-err');
            const btn = form.querySelector('button[type="submit"]');

            if (pass !== passConfirm) {
                err.style.display = 'block';
                err.textContent = 'Las contraseñas no coinciden.';
                return;
            }

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando Cuenta...';
            btn.disabled = true;

            try {
                // Verificar si ya existe
                const existing = await AuthState.db.getUsuarioData(email);
                if (existing) {
                    err.style.display = 'block';
                    err.textContent = 'Este correo ya está registrado.';
                    btn.innerHTML = 'Crear Cuenta';
                    btn.disabled = false;
                    return;
                }

                await AuthState.db.registerUsuario({
                    name,
                    email,
                    password: pass,
                    is_admin: false
                });

                UIModal.alert('¡Cuenta Creada!', 'Tu cuenta ha sido registrada con éxito. Ahora puedes iniciar sesión.');
                window.router.navigate('/login-profesor');

            } catch (error) {
                err.style.display = 'block';
                err.textContent = 'Error al registrar usuario. Inténtalo de nuevo.';
                btn.innerHTML = 'Crear Cuenta';
                btn.disabled = false;
            }
        });
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="login-card">
            <div class="login-card-icon">
                <i class="fa-solid fa-user-plus" style="color:var(--tecnm-blue);font-size:2rem;"></i>
            </div>
            <h2 class="login-card-title">Registro de Profesor</h2>
            <p class="login-card-sub">Crea tu cuenta para administrar concursos y equipos en la plataforma.</p>

            <div id="reg-err" class="error-inline" style="display:none;"></div>

            <form id="profesor-register-form">
                <div class="form-group">
                    <label class="form-label">Nombre Completo</label>
                    <input type="text" id="reg-name" class="form-input" required placeholder="Ej. Dr. Armando Paredes">
                </div>
                <div class="form-group">
                    <label class="form-label">Correo Institucional</label>
                    <input type="email" id="reg-email" class="form-input" required placeholder="usuario@itcm.edu.mx">
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="password" id="reg-pass" class="form-input" required placeholder="••••••••">
                </div>
                <div class="form-group">
                    <label class="form-label">Confirmar Contraseña</label>
                    <input type="password" id="reg-pass-confirm" class="form-input" required placeholder="••••••••">
                </div>
                
                <button type="submit" class="btn btn-primary" style="width:100%;margin-top:1rem;">
                    Crear Cuenta
                </button>
            </form>

            <p style="text-align:center;margin-top:1.5rem;font-size:.9em;">
                ¿Ya tienes cuenta? 
                <a href="#" data-route="/login-profesor" style="color:var(--tecnm-blue);font-weight:600;text-decoration:none;">
                    Inicia Sesión
                </a>
            </p>
        </div>
    </div>`;
};
