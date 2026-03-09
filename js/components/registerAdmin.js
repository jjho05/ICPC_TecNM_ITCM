import { AuthState } from '../core/authState.js';
import { UIModal } from './ui/modal.js';

export const RegisterAdminView = () => {
    setTimeout(() => {
        const form = document.getElementById('admin-register-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('reg-admin-name').value.trim();
            const email = document.getElementById('reg-admin-email').value.trim();
            const pass = document.getElementById('reg-admin-pass').value;
            const passConfirm = document.getElementById('reg-admin-pass-confirm').value;
            const inviteCode = document.getElementById('reg-admin-code').value.trim();
            const err = document.getElementById('reg-admin-err');
            const btn = form.querySelector('button[type="submit"]');

            // Código de invitación básico para evitar registros aleatorios (configurable)
            if (inviteCode !== 'ITCM-ADMIN-2024') {
                err.style.display = 'block';
                err.textContent = 'Código de invitación de administrador inválido.';
                return;
            }

            if (pass !== passConfirm) {
                err.style.display = 'block';
                err.textContent = 'Las contraseñas no coinciden.';
                return;
            }

            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Creando Perfil Admin...';
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
                    is_admin: true
                });

                UIModal.alert('¡Administrador Registrado!', 'Ahora puedes acceder al panel con tus credenciales.');
                window.router.navigate('/login-admin');

            } catch (error) {
                console.error(error);
                err.style.display = 'block';
                err.textContent = 'Error al registrar administrador.';
                btn.innerHTML = 'Crear Cuenta';
                btn.disabled = false;
            }
        });
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="login-card login-card--admin">
            <div class="login-card-icon">
                <i class="fa-solid fa-user-shield" style="color:var(--tecnm-gold);font-size:2.5rem;"></i>
            </div>
            <h2 class="login-card-title">Registro de Administrador</h2>
            <p class="login-card-sub">Crea un nuevo perfil de Sistema (SysAdmin).</p>

            <div id="reg-admin-err" class="error-inline" style="display:none;"></div>

            <form id="admin-register-form">
                <div class="form-group">
                    <label class="form-label">Nombre del Administrador</label>
                    <input type="text" id="reg-admin-name" class="form-input" required placeholder="Nombre Apellido">
                </div>
                <div class="form-group">
                    <label class="form-label">Correo Institucional / Admin</label>
                    <input type="email" id="reg-admin-email" class="form-input" required placeholder="admin@icpc.itcm.mx">
                </div>
                <div class="form-group">
                    <label class="form-label">Código de Invitación SysAdmin</label>
                    <input type="text" id="reg-admin-code" class="form-input" required placeholder="Solicitar a Soporte">
                </div>
                <div class="grid-2">
                    <div class="form-group">
                        <label class="form-label">Contraseña</label>
                        <input type="password" id="reg-admin-pass" class="form-input" required placeholder="••••••••">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Confirmar</label>
                        <input type="password" id="reg-admin-pass-confirm" class="form-input" required placeholder="••••••••">
                    </div>
                </div>
                
                <button type="submit" class="btn btn-accent" style="width:100%;margin-top:1rem;">
                    Registrar Administrador
                </button>
            </form>

            <p style="text-align:center;margin-top:1.5rem;font-size:.9em;">
                ¿Ya tienes cuenta? 
                <a href="#" data-route="/login-admin" style="color:var(--tecnm-gold);font-weight:600;text-decoration:none;">
                    Acceder
                </a>
            </p>
        </div>
    </div>`;
};
