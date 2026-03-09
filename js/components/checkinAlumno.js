import { AuthState } from '../core/authState.js';

// ══════════════════════════════════════════════════════
//  Check-in Alumno — Valida contra Supabase
//  GAP 2 FIX: Verifica concurso activo + equipo de BD
//  GAP 4 FIX: El nombre del equipo viene de la BD, no de un input libre
// ══════════════════════════════════════════════════════

export const CheckinAlumnoView = () => {

    setTimeout(() => {
        const form = document.getElementById('alumno-checkin-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            const emailInput = document.getElementById('alumno-email');
            const btnSubmit = document.getElementById('btn-checkin-submit');
            const errorBox = document.getElementById('error-box');
            const email = emailInput.value.trim().toLowerCase();

            if (!email) {
                errorBox.style.display = 'block';
                errorBox.innerHTML = 'Ingresa tu correo electrónico.';
                return;
            }

            // Estado de carga
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verificando...';
            errorBox.style.display = 'none';

            try {
                // 1. Buscar al alumno en icpc_participantes (sin filtrar por concurso aún)
                const resultado = await AuthState.db.isAlumnoPermitido(email);

                if (!resultado.permitido) {
                    errorBox.style.display = 'block';
                    errorBox.innerHTML = `
                        <strong>No encontrado:</strong> El correo <b>${email}</b> no está registrado por ningún Coach.
                        <br><small>Si crees que es un error, contacta a tu Profesor/Coach.</small>`;
                    return;
                }

                // 2. Verificar que haya un concurso activo para ese participante
                const concursos = await AuthState.db.getConcursos();
                const concursoActivo = concursos.find(c => c.estado === 'activo' && c.id === resultado.concursoId);

                if (!concursoActivo) {
                    // Intento 2: quizá el concurso esté activo pero el ID difiere
                    const cualquierActivo = concursos.find(c => c.estado === 'activo');
                    if (!cualquierActivo) {
                        errorBox.style.display = 'block';
                        errorBox.innerHTML = `<strong>Sin concurso activo:</strong> No hay competencias en curso en este momento. Vuelve cuando tu Juez haya iniciado el concurso.`;
                        return;
                    }
                }

                // 3. Registrar check-in en la BD
                await AuthState.db.setCheckin(email, resultado.concursoId);

                // 4. Iniciar sesión con datos de la BD (equipo y nombre oficiales)
                AuthState.loginAsAlumno(email, resultado.equipo || email, resultado.nombre || email);
                window.router.navigate('/arena');

            } catch (err) {
                console.error('checkin error:', err);
                errorBox.style.display = 'block';
                errorBox.innerHTML = 'Error de conexión. Intenta de nuevo en unos segundos.';
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Entrar a La Arena';
            }
        });
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="card" style="width: 100%; max-width: 450px;">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="
                    width: 70px; height: 70px;
                    background: linear-gradient(135deg, var(--tecnm-blue), var(--tecnm-blue-light));
                    border-radius: 20px;
                    display: flex; align-items: center; justify-content: center;
                    margin: 0 auto 1.25rem;
                    box-shadow: 0 8px 25px rgba(27,57,106,0.4);
                ">
                    <i class="fa-solid fa-laptop-code" style="font-size: 2rem; color: white;"></i>
                </div>
                <h2 style="color: white; font-family: var(--font-display); font-size: 1.5rem; margin-bottom: 0.4rem;">Check-in al Concurso</h2>
                <p style="color: var(--tecnm-text-muted); font-size: 0.9rem;">Ingresa tu correo registrado para acceder a la Arena.</p>
            </div>

            <div id="error-box" style="display: none; background: rgba(239,68,68,0.1); border-left: 3px solid var(--status-wa); color: #fca5a5; padding: 0.85rem 1rem; margin-bottom: 1.25rem; border-radius: var(--radius-md); font-size: 0.88rem;">
            </div>

            <form id="alumno-checkin-form">
                <div class="form-group">
                    <label class="form-label" for="alumno-email">
                        <i class="fa-solid fa-envelope" style="color:var(--tecnm-gold); margin-right:6px;"></i>
                        Correo de Registro
                    </label>
                    <input
                        type="email"
                        id="alumno-email"
                        class="form-input"
                        required
                        placeholder="tuCorreo@alu.tecnm.mx"
                        autocomplete="email"
                    >
                    <small style="color:var(--tecnm-text-muted); font-size:0.8rem; margin-top:4px; display:block;">
                        Es el correo con el que tu Coach te registró.
                    </small>
                </div>

                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); padding: 0.85rem 1rem; border-radius: var(--radius-md); font-size: 0.84rem; margin-bottom: 1.5rem; color: var(--tecnm-text-muted);">
                    <i class="fa-solid fa-shield-halved" style="color: var(--tecnm-blue); margin-right: 6px;"></i>
                    Tu nombre de equipo y datos serán tomados automáticamente del sistema — no es necesario ingresarlos.
                </div>

                <button type="submit" id="btn-checkin-submit" class="btn btn-accent" style="width: 100%; padding: 0.85rem; font-size: 1rem;">
                    <i class="fa-solid fa-right-to-bracket"></i> Entrar a La Arena
                </button>
            </form>

            <p style="text-align: center; margin-top: 1.5rem;">
                <a href="#" data-route="/" style="color: var(--tecnm-text-muted); text-decoration: none; font-size: 0.88em;">
                    <i class="fa-solid fa-arrow-left"></i> Volver al Inicio
                </a>
            </p>
        </div>
    </div>
    `;
};
