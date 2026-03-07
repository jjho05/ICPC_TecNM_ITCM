import { AuthState } from '../core/authState.js';

export const CheckinAlumnoView = () => {

    setTimeout(() => {
        const form = document.getElementById('alumno-checkin-form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('alumno-email').value;
                const equipo = document.getElementById('alumno-equipo').value;

                // Lógica principal: Validar si un Coach/Juez lo dio de alta
                const permitido = AuthState.db.isAlumnoPermitido(email);

                if (permitido) {
                    AuthState.db.setCheckin(email); // Opcional, marcar que ya entró
                    AuthState.loginAsAlumno(email, equipo);
                    window.router.navigate('/arena');
                } else {
                    const errorBox = document.getElementById('error-box');
                    errorBox.style.display = 'block';
                    errorBox.innerHTML = `El correo <b>${email}</b> no está registrado en el sistema por un Coach. Solicita tu registro.`;
                }
            });
        }
    }, 100);

    return `
    <div class="center-layout view-enter">
        <div class="card" style="width: 100%; max-width: 450px;">
            <div style="text-align: center; margin-bottom: 1.5rem;">
                <i class="fa-solid fa-laptop-code" style="font-size: 2.5rem; color: var(--tecnm-gold); margin-bottom: 1rem;"></i>
                <h2 style="color: var(--tecnm-blue);">Check-in Alumno</h2>
                <p style="color: var(--tecnm-text-muted); font-size: 0.95rem;">Confirma tu ingreso a la plataforma de competencia.</p>
            </div>

            <div id="error-box" style="display: none; background: #f8ffff; border-left: 4px solid var(--status-wa); color: var(--status-wa); padding: 1rem; margin-bottom: 1.5rem; border-radius: 4px; font-size: 0.9rem;">
                <!-- Errores aparecerán aquí -->
            </div>

            <form id="alumno-checkin-form">
                <div class="form-group">
                    <label class="form-label" for="alumno-email">Correo Electrónico de Registro</label>
                    <input type="email" id="alumno-email" class="form-input" required placeholder="correo@alu.tecnm.mx">
                </div>
                <div class="form-group">
                    <label class="form-label" for="alumno-equipo">Nombre de tu Equipo</label>
                    <input type="text" id="alumno-equipo" class="form-input" required placeholder="Ej: Los Null Pointers">
                </div>

                <div style="background-color: var(--tecnm-gray-bg); padding: 1rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1.5rem; color: var(--tecnm-text-muted);">
                    <i class="fa-solid fa-circle-info" style="color: var(--tecnm-blue); margin-right: 5px;"></i>
                    Solo podrás ingresar si tu Coach ya registró este correo electrónico oficialmente en el sistema.
                </div>

                <button type="submit" class="btn btn-accent" style="width: 100%;">
                    Entrar a La Arena
                </button>
            </form>

            <p style="text-align: center; margin-top: 1.5rem;">
                <a href="#" data-route="/" style="color: var(--tecnm-text-muted); text-decoration: none; font-size: 0.9em;">
                    <i class="fa-solid fa-arrow-left"></i> Volver al Inicio
                </a>
            </p>
        </div>
    </div>
    `;
};
