import { AuthState } from '../core/authState.js';

// ══════════════════════════════════════════════════════
//  Login Admin — Plataforma ICPC TecNM
// ══════════════════════════════════════════════════════

export const LoginAdminView = () => {
    setTimeout(() => {
        const form = document.getElementById('admin-login-form');
        if (!form) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('admin-email').value.trim();
            const pass = document.getElementById('admin-pass').value;
            const err = document.getElementById('admin-login-err');

            if (AuthState.db.isAdminCredentials(email, pass)) {
                AuthState.loginAsAdmin(email, 'Administrador');
                window.router.navigate('/admin');
            } else {
                err.style.display = 'block';
                err.textContent = 'Credenciales de administrador incorrectas.';
                setTimeout(() => { err.style.display = 'none'; }, 4000);
            }
        });
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="login-card login-card--admin">
            <div class="login-card-icon">
                <i class="fa-solid fa-shield-halved" style="color:var(--tecnm-gold);font-size:2rem;"></i>
            </div>
            <h2 class="login-card-title">Acceso Administrador</h2>
            <p class="login-card-sub">Acceso restringido al personal autorizado.</p>

            <div id="admin-login-err" class="error-inline" style="display:none;"></div>

            <form id="admin-login-form">
                <div class="form-group">
                    <label class="form-label">Correo Admin</label>
                    <input type="email" id="admin-email" class="form-input" required
                        placeholder="admin@icpc.itcm.mx" value="admin@icpc.itcm.mx">
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="password" id="admin-pass" class="form-input" required placeholder="••••••••">
                </div>
                <button type="submit" class="btn btn-accent" style="width:100%;margin-top:.5rem;">
                    <i class="fa-solid fa-unlock-keyhole"></i> Ingresar
                </button>
            </form>
            <p style="text-align:center;margin-top:1.25rem;">
                <a href="#" data-route="/" style="color:rgba(255,255,255,.4);font-size:.85rem;text-decoration:none;">
                    <i class="fa-solid fa-arrow-left"></i> Volver al inicio
                </a>
            </p>
        </div>
    </div>`;
};
