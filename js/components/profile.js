import { AuthState } from '../core/authState.js';
import { supabase } from '../core/supabaseClient.js';
import { UIModal } from './ui/modal.js';

export const ProfileView = () => {
    setTimeout(initProfile, 100);

    return `
    <div class="profile-layout view-enter">
        <div class="profile-container">
            <header class="profile-header">
                <div class="profile-avatar-large">
                    ${AuthState.user.nombre.charAt(0)}
                </div>
                <div class="profile-title-block">
                    <h2 class="profile-name-display">${AuthState.user.nombre}</h2>
                    <p class="profile-email-display">${AuthState.user.email}</p>
                    <span class="profile-role-badge">${AuthState.user.rol.toUpperCase()}</span>
                </div>
            </header>

            <div class="profile-grid">
                <!-- Columna: Datos Académicos -->
                <div class="profile-card">
                    <h3 class="pcard-title"><i class="fa-solid fa-graduation-cap"></i> Información Académica</h3>
                    <form id="profile-academic-form" class="pcard-body">
                        <div class="pfield">
                            <label>Carrera</label>
                            <input type="text" id="prof-carrera" class="pinput" placeholder="Ej: Ing. en Sistemas Computacionales" value="${AuthState.user.carrera || ''}">
                        </div>
                        <div class="pfield">
                            <label>Semestre</label>
                            <input type="number" id="prof-semestre" class="pinput" placeholder="1-12" value="${AuthState.user.semestre || ''}">
                        </div>
                        <div class="pfield">
                            <label>Sede / Instituto</label>
                            <input type="text" id="prof-sede" class="pinput" placeholder="IT Ciudad Madero" value="${AuthState.user.sede || ''}">
                        </div>
                        <button type="submit" class="btn-profile btn-profile--primary">Actualizar Datos Académicos</button>
                    </form>
                </div>

                <!-- Columna: Seguridad -->
                <div class="profile-card">
                    <h3 class="pcard-title"><i class="fa-solid fa-lock"></i> Seguridad</h3>
                    <form id="profile-security-form" class="pcard-body">
                        <p style="font-size:0.85rem; opacity:0.6; margin-bottom:1.5rem;">Cambia tu contraseña. Se cerrará la sesión actual al terminar.</p>
                        <div class="pfield">
                            <label>Nueva Contraseña</label>
                            <input type="password" id="prof-new-pass" class="pinput" placeholder="••••••••" required>
                        </div>
                        <div class="pfield">
                            <label>Confirmar Nueva Contraseña</label>
                            <input type="password" id="prof-conf-pass" class="pinput" placeholder="••••••••" required>
                        </div>
                        <button type="submit" class="btn-profile btn-profile--accent">Cambiar Contraseña</button>
                    </form>
                </div>
            </div>

            <footer class="profile-footer">
                <button class="btn btn-ghost" onclick="window.history.back()">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
            </div>
        </div>
    </div>

    <style>
        .profile-layout { background: #0f172a; min-height: 100vh; padding: 4rem 2rem; color: white; }
        .profile-container { max-width: 900px; margin: 0 auto; }
        .profile-header { display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; background: rgba(30, 41, 59, 0.5); padding: 2rem; border-radius: 24px; border: 1px solid rgba(255,255,255,0.05); }
        .profile-avatar-large { width: 100px; height: 100px; background: var(--tecnm-gold); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: 800; color: #000; box-shadow: 0 0 20px rgba(212, 175, 55, 0.3); }
        .profile-name-display { margin: 0; font-size: 2rem; font-weight: 800; }
        .profile-email-display { margin: 0.2rem 0; opacity: 0.6; font-family: var(--font-mono); }
        .profile-role-badge { display: inline-block; background: var(--tecnm-blue); color: white; padding: 2px 12px; border-radius: 100px; font-size: 0.7rem; font-weight: 800; margin-top: 0.5rem; letter-spacing: 1px; }
        
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 2rem; }
        .profile-card { background: #1e293b; border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); overflow: hidden; }
        .pcard-title { margin: 0; padding: 1.5rem 2rem; background: rgba(255,255,255,0.02); font-size: 1.1rem; border-bottom: 1px solid rgba(255,255,255,0.05); color: var(--tecnm-gold); }
        .pcard-body { padding: 2rem; }
        
        .pfield { margin-bottom: 1.5rem; }
        .pfield label { display: block; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; opacity: 0.6; margin-bottom: 0.5rem; }
        .pinput { width: 100%; background: #0f172a; border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 0.8rem; color: white; outline: none; transition: border-color 0.2s; }
        .pinput:focus { border-color: var(--tecnm-gold); }
        
        .btn-profile { width: 100%; padding: 1rem; border-radius: 10px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
        .btn-profile--primary { background: var(--tecnm-blue); color: white; }
        .btn-profile--primary:hover { background: #3b82f6; transform: translateY(-2px); }
        .btn-profile--accent { background: transparent; border: 1px solid #ef4444; color: #ef4444; }
        .btn-profile--accent:hover { background: #ef4444; color: white; }
        
        .profile-footer { margin-top: 3rem; text-align: center; }
    </style>
    `;
};

async function initProfile() {
    const academicForm = document.getElementById('profile-academic-form');
    const securityForm = document.getElementById('profile-security-form');

    academicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            carrera: document.getElementById('prof-carrera').value,
            semestre: parseInt(document.getElementById('prof-semestre').value),
            sede: document.getElementById('prof-sede').value
        };

        const { error } = await supabase
            .from('icpc_usuarios_v2')
            .update(data)
            .eq('email', AuthState.user.email);

        if (error) {
            UIModal.alert('Error', 'No se pudieron actualizar los datos.');
        } else {
            // Actualizar estado local
            AuthState.user = { ...AuthState.user, ...data };
            UIModal.alert('Éxito', 'Perfil actualizado correctamente.');
        }
    });

    securityForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const pass = document.getElementById('prof-new-pass').value;
        const conf = document.getElementById('prof-conf-pass').value;

        if (pass !== conf) {
            UIModal.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        if (pass.length < 6) {
            UIModal.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        // Hashear pass antes de enviar (SHA-256)
        const hashed = await AuthState._hash(pass);

        const { error } = await supabase
            .from('icpc_usuarios_v2')
            .update({ password: `${hashed}` })
            .eq('email', AuthState.user.email);

        if (error) {
            UIModal.alert('Error', 'No se pudo cambiar la contraseña.');
        } else {
            UIModal.alert('Seguridad', 'Contraseña cambiada. Por favor, inicia sesión de nuevo.');
            setTimeout(() => AuthState.logout(), 2000);
        }
    });
}
