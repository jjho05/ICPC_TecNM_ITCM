import { AuthState } from '../core/authState.js';
import { supabase } from '../core/supabaseClient.js';
import { UIModal } from './ui/modal.js';

window._modalAlert = (title, desc) => UIModal.alert(title, desc);

// ══════════════════════════════════════════════════════
//  Dashboard Profesor — Plataforma ICPC TecNM
//  Roles Contextuales: Juez de Evento vs Coach de Equipos
// ══════════════════════════════════════════════════════

export const DashboardProfesorView = () => {

    setTimeout(() => {
        if (!AuthState.isProfesor()) { window.router.navigate('/'); return; }
        document.getElementById('profesor-display-name').textContent = AuthState.user.name;
        bindProfesorEvents();
        renderProfesorTab('ptab-mis-eventos');
    }, 100);

    return `
    <div class="coach-layout view-enter">

        <!-- Topbar -->
        <header class="coach-topbar">
            <div class="coach-topbar-left">
                <i class="fa-solid fa-user-tie" style="color:var(--tecnm-gold);font-size:1.1rem;"></i>
                <div>
                    <span class="coach-topbar-title">Panel de Profesor</span>
                    <span class="coach-topbar-sub">Bienvenido, <strong id="profesor-display-name">—</strong></span>
                </div>
            </div>
            <div class="coach-tabs">
                <button class="ctab-btn active" data-ptab="ptab-mis-eventos">
                    <i class="fa-solid fa-gavel"></i> Mis Eventos (Juez)
                </button>
                <button class="ctab-btn" data-ptab="ptab-mis-equipos">
                    <i class="fa-solid fa-users"></i> Mis Equipos (Coach)
                </button>
                <button class="ctab-btn" data-ptab="ptab-explorar">
                    <i class="fa-solid fa-earth-americas"></i> Explorar Eventos
                </button>
            </div>
            <button class="coach-logout-btn" id="profesor-logout-btn">
                <i class="fa-solid fa-right-from-bracket"></i> Salir
            </button>
        </header>

        <div class="coach-body">

            <!-- TAB 1: Mis Eventos (Juez) -->
            <section id="ptab-mis-eventos" class="ctab-content">
                <div class="coach-card coach-card--full" style="margin-bottom:1.5rem;" id="form-crear-evento-wrapper" style="display:none;">
                    <h3 class="coach-card-title"><i class="fa-solid fa-calendar-plus"></i> Crear Nuevo Evento</h3>
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:2rem; margin-top:1.5rem;">
                        <div class="field-group-premium">
                            <label class="coach-label-premium">Nombre del Concurso</label>
                            <input type="text" id="ce-titulo" class="coach-input-premium" placeholder="Ej: Gran Premio de México 2026">
                        </div>

                        <div class="field-group-premium">
                            <label class="coach-label-premium">Categoría / Nivel</label>
                            <select id="ce-categoria" class="coach-input-premium">
                                <option value="division2">División 2 (Intermedio)</option>
                                <option value="novatos">Novatos</option>
                                <option value="division1">División 1 (Avanzado)</option>
                                <option value="individual">Individual</option>
                            </select>
                        </div>

                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem;">
                            <div class="field-group-premium">
                                <label class="coach-label-premium">Min. Miembros</label>
                                <input type="number" id="ce-min-integrantes" class="coach-input-premium" value="1" min="1" max="3">
                            </div>
                            <div class="field-group-premium">
                                <label class="coach-label-premium">Max. Miembros</label>
                                <input type="number" id="ce-max-integrantes" class="coach-input-premium" value="3" min="1" max="3">
                            </div>
                        </div>

                        <div class="timestamp-group-premium">
                            <div class="timestamp-header-premium">
                                <label class="coach-label-premium">Inicio del Concurso</label>
                            </div>
                            <div class="timestamp-body-premium">
                                <div class="time-sub-group">
                                    <input type="date" id="ce-inicio-fecha" class="coach-input-premium">
                                    <input type="time" id="ce-inicio-hora" class="coach-input-premium">
                                </div>
                            </div>
                        </div>

                        <div class="timestamp-group-premium">
                            <div class="timestamp-header-premium">
                                <label class="coach-label-premium">Fin del Concurso</label>
                            </div>
                            <div class="timestamp-body-premium">
                                <div class="time-sub-group">
                                    <input type="date" id="ce-fin-fecha" class="coach-input-premium">
                                    <input type="time" id="ce-fin-hora" class="coach-input-premium">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem; margin-top:1.5rem;">
                        <button class="btn btn-ghost" id="btn-cancelar-crear"><i class="fa-solid fa-xmark"></i> Cancelar</button>
                        <button class="btn btn-primary" id="btn-guardar-evento"><i class="fa-solid fa-check"></i> Guardar y Planificar</button>
                    </div>
                </div>

                <div class="coach-card coach-card--full">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 class="coach-card-title" style="margin:0;"><i class="fa-solid fa-gavel"></i> Eventos que Administras</h3>
                        <button class="btn btn-primary" style="font-size:0.85rem;" id="btn-mostrar-form-evento">
                            <i class="fa-solid fa-plus"></i> Planificar Evento
                        </button>
                    </div>
                    <p class="coach-hint" style="margin-top:1rem;">Eres Juez y Administrador de estos concursos. No puedes inscribir equipos propios aquí.</p>
                    <div id="lista-eventos-juez" style="margin-top:1.5rem;"></div>
                </div>
            </section>

            <!-- TAB 2: Mis Equipos (Coach) -->
            <section id="ptab-mis-equipos" class="ctab-content" style="display:none;">
                <div class="coach-card coach-card--full">
                    <h3 class="coach-card-title"><i class="fa-solid fa-users"></i> Eventos donde eres Coach</h3>
                    <p class="coach-hint">Has inscrito equipos en estos concursos organizados por otros Jueces.</p>
                    <div id="lista-eventos-coach" style="margin-top:1.5rem;"></div>
                </div>
            </section>

            <!-- TAB 3: Explorar Eventos (Unirse como Coach) -->
            <section id="ptab-explorar" class="ctab-content" style="display:none;">
                <div class="coach-card coach-card--full">
                    <h3 class="coach-card-title"><i class="fa-solid fa-calendar-days"></i> Concursos Disponibles</h3>
                    <p class="coach-hint">Elige un concurso activo para inscribir a tus equipos.</p>
                    <div id="lista-eventos-explorar" style="margin-top:1.5rem;"></div>
                </div>
            </section>

            <!-- TAB 4 (Oculto): Administrar Evento (Juez) -->
            <section id="ptab-admin-juez" class="ctab-content" style="display:none;">
                <div class="coach-card coach-card--full">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 class="coach-card-title"><i class="fa-solid fa-gavel"></i> <span id="admin-juez-titulo">Administrando Evento</span></h3>
                        <button class="btn btn-ghost" onclick="renderProfesorTab('ptab-mis-eventos')"><i class="fa-solid fa-arrow-left"></i> Volver a Eventos</button>
                    </div>
                    <div class="concurso-grid" style="margin-top:1.5rem;">
                        <!-- Columna Izquierda: Configuración -->
                        <div class="coach-card">
                            <h4 style="margin-top:0; color:var(--tecnm-blue);">Configuración del Concurso</h4>
                            <div class="coach-field">
                                <label class="coach-label">Estado Actual</label>
                                <span id="admin-juez-estado" class="estado-badge">Cargando...</span>
                            </div>
                            <div class="coach-concurso-actions" id="admin-juez-acciones">
                                <!-- Botones de Activar/Finalizar inyectados aquí -->
                            </div>
                        </div>
                        <!-- Columna Derecha: Problemas Asignados -->
                        <div class="coach-card">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <h4 style="margin-top:0; color:var(--tecnm-gold);">Problemas del Evento</h4>
                                <button class="btn btn-primary btn-sm" onclick="window._mostrarSelectorProblemas()"><i class="fa-solid fa-plus"></i> Añadir</button>
                            </div>
                            <ul id="admin-juez-problemas-list" style="list-style:none; padding:0; margin-top:1rem;">
                                <!-- Problemas inyectados aquí -->
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB 5 (Oculto): Gestionar Equipos (Coach) -->
            <section id="ptab-admin-coach" class="ctab-content" style="display:none;">
                <div class="coach-card coach-card--full" style="margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 class="coach-card-title"><i class="fa-solid fa-users"></i> Equipos en: <span id="admin-coach-titulo" style="color:var(--tecnm-text);">Evento</span></h3>
                        <button class="btn btn-ghost" onclick="renderProfesorTab('ptab-mis-equipos')"><i class="fa-solid fa-arrow-left"></i> Volver a Mis Equipos</button>
                    </div>
                    
                    <div class="concurso-grid" style="margin-top:1.5rem;">
                        <!-- Alta de Alumnos -->
                        <div class="coach-card">
                            <h4 style="margin-top:0; color:var(--tecnm-blue);">Inscribir Alumno / Equipo</h4>
                            <p class="coach-hint" style="margin-bottom:1rem;">Añade los datos de tus alumnos. El nombre se guardará en MAYÚSCULAS.</p>
                            
                            <div class="coach-field">
                                <label class="coach-label">Nombre Completo del Alumno</label>
                                <input type="text" id="coach-nuevo-alumno-nombre" class="coach-input" placeholder="Ej: JUAN PEREZ LOPEZ">
                            </div>
                            <div class="coach-field">
                                <label class="coach-label">Correo Electrónico</label>
                                <input type="email" id="coach-nuevo-alumno-email" class="coach-input" placeholder="alumno@itcm.edu.mx">
                            </div>
                            <div class="coach-field">
                                <label class="coach-label">Nombre del Equipo</label>
                                <input type="text" id="coach-nuevo-alumno-equipo" class="coach-input" placeholder="Ej: Los Halcones">
                            </div>

                            <button class="btn btn-primary" style="width:100%; margin-top:0.5rem;" onclick="window._inscribirAlumnoCoach()">
                                <i class="fa-solid fa-plus"></i> Inscribir Equipo
                            </button>
                        </div>
                        
                        <!-- Mini Scoreboard Focalizado -->
                        <div class="coach-card">
                            <div class="score-header">
                                <h4 style="margin:0; color:var(--tecnm-gold);"><i class="fa-solid fa-list-ol"></i> Scoreboard en Vivo</h4>
                                <span class="score-live-badge"><div class="live-dot"></div> LIVE</span>
                            </div>
                            <p class="coach-hint" style="margin-bottom:1rem;">Participantes Registrados y Resultados.</p>
                            <div class="coach-table-wrap">
                                <table class="coach-table">
                                    <thead>
                                        <tr>
                                            <th>Alumno / Correo</th>
                                            <th>Equipo</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody id="admin-coach-alumnos-body"></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </div>
    </div>`;
};

// ── Lógica del Dashboard Profesor ─────────────────────────

function bindProfesorEvents() {
    // Manejo de tabs principales
    document.querySelectorAll('.ctab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.ctab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProfesorTab(btn.dataset.ptab);
        });
    });

    document.getElementById('profesor-logout-btn').addEventListener('click', () => {
        AuthState.logout(); window.router.navigate('/');
    });

    // Toggle form crear evento
    const wrapper = document.getElementById('form-crear-evento-wrapper');
    wrapper.style.display = 'none';

    document.getElementById('btn-mostrar-form-evento').addEventListener('click', () => {
        wrapper.style.display = 'block';
        document.getElementById('ce-titulo').focus();
    });

    document.getElementById('btn-cancelar-crear').addEventListener('click', () => {
        wrapper.style.display = 'none';
        limpiarFormEvento();
    });

    document.getElementById('btn-guardar-evento').addEventListener('click', async () => {
        const titulo = document.getElementById('ce-titulo').value.trim();
        const inicioF = document.getElementById('ce-inicio-fecha').value;
        const inicioH = document.getElementById('ce-inicio-hora').value;
        const finF = document.getElementById('ce-fin-fecha').value;
        const finH = document.getElementById('ce-fin-hora').value;

        if (!titulo || !inicioF || !inicioH || !finF || !finH) {
            UIModal.alert('Campos Obligatorios', 'Por favor completa todos los campos de nombre, fecha y hora.');
            return;
        }

        const msInicio = new Date(`${inicioF}T${inicioH}`).getTime();
        const msFin = new Date(`${finF}T${finH}`).getTime();

        if (isNaN(msInicio) || isNaN(msFin)) {
            UIModal.alert('Formato Inválido', 'Asegúrate de que las fechas y horas sean válidas.');
            return;
        }

        if (msFin <= msInicio) {
            UIModal.alert('Fechas Inválidas', 'La fecha de cierre debe ser posterior a la de apertura.');
            return;
        }

        const categoriaId = document.getElementById('ce-categoria').value;
        const minInt = parseInt(document.getElementById('ce-min-integrantes').value) || 1;
        const maxInt = parseInt(document.getElementById('ce-max-integrantes').value) || 3;

        const id = 'evt_' + Date.now();
        const btn = document.getElementById('btn-guardar-evento');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;

        await AuthState.db.saveConcurso({
            id,
            titulo,
            estado: 'programado',
            fecha_inicio: new Date(msInicio).toISOString(),
            fecha_fin: new Date(msFin).toISOString(),
            ts_inicio: msInicio,
            ts_fin: msFin,
            problemas: [],
            jueces_ids: [AuthState.user.email],
            coaches_ids: [],
            categoria_id: categoriaId,
            min_integrantes: minInt,
            max_integrantes: maxInt
        });

        btn.innerHTML = 'Guardar Evento';
        btn.disabled = false;
        wrapper.style.display = 'none';
        limpiarFormEvento();
        UIModal.alert('Evento Planificado', `El evento <b>${titulo}</b> ha sido guardado exitosamente en la nube.`);
        renderMisEventosJuez();
    });
}

function limpiarFormEvento() {
    document.getElementById('ce-titulo').value = '';
    document.getElementById('ce-inicio-fecha').value = '';
    document.getElementById('ce-inicio-hora').value = '';
    document.getElementById('ce-fin-fecha').value = '';
    document.getElementById('ce-fin-hora').value = '';
}

function renderProfesorTab(tabId) {
    document.querySelectorAll('.ctab-content').forEach(t => t.style.display = 'none');
    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';

    if (tabId === 'ptab-mis-eventos') renderMisEventosJuez();
    if (tabId === 'ptab-mis-equipos') renderMisEventosCoach();
    if (tabId === 'ptab-explorar') renderExplorarEventos();
}

// ── Renderizadores de Listas (Vistas base - Supabase Async) ──

async function renderMisEventosJuez() {
    const listDiv = document.getElementById('lista-eventos-juez');
    listDiv.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--tecnm-blue);"></i></div>';

    const me = AuthState.user.email;
    const allConcursos = await AuthState.db.getConcursos();
    const concursos = allConcursos.filter(c => c.jueces_ids.includes(me));

    if (concursos.length === 0) {
        listDiv.innerHTML = `
        <div class="coach-empty-state">
            <i class="fa-solid fa-calendar-xmark"></i>
            <h4>Sin Eventos Creados</h4>
            <p>Aún no administras ningún evento. Haz clic en "Planificar Evento" para comenzar.</p>
        </div>`;
        return;
    }

    const currentTS = Date.now();

    listDiv.innerHTML = concursos.map(c => {
        let spanFechas = `<span style="font-size:0.8rem; color:var(--tecnm-text-muted);"><i class="fa-regular fa-clock"></i> Sin fecha</span>`;
        if (c.fecha_inicio && c.fecha_fin) {
            const fi = new Date(c.fecha_inicio).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
            const ff = new Date(c.fecha_fin).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
            spanFechas = `<span style="font-size:0.8rem; color:var(--tecnm-gold); margin-left:10px;"><i class="fa-regular fa-calendar"></i> ${fi} al ${ff}</span>`;

            // Auto Update state if not strictly dictated
            if (c.estado !== 'finalizado') {
                if (currentTS >= c.ts_inicio && currentTS < c.ts_fin && c.estado !== 'activo') {
                    c.estado = 'activo';
                    AuthState.db.activarConcurso(c.id); // Llamada asíncrona pero sin await para no bloquear UI render
                } else if (currentTS >= c.ts_fin && c.estado !== 'finalizado') {
                    c.estado = 'finalizado';
                    AuthState.db.finalizarConcurso(c.id);
                }
            }
        }

        return `
        <div class="coach-card" style="margin-bottom:1rem; border-left:4px solid var(--tecnm-blue);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4>${c.titulo}</h4>
                    <span class="estado-badge estado-${c.estado}">${c.estado}</span>
                    ${spanFechas}
                    <span style="font-size:0.8rem; opacity:0.6; margin-left:10px;"><i class="fa-solid fa-users"></i> ${c.coaches_ids.length} Coaches</span>
                </div>
                <div>
                    <button class="btn btn-primary" onclick="window._abrirAdminJuez('${c.id}')"><i class="fa-solid fa-gear"></i> Administrar Evento</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function renderMisEventosCoach() {
    const listDiv = document.getElementById('lista-eventos-coach');
    listDiv.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--tecnm-gold);"></i></div>';

    const me = AuthState.user.email;
    const allConcursos = await AuthState.db.getConcursos();
    const concursos = allConcursos.filter(c => c.coaches_ids.includes(me));

    if (concursos.length === 0) {
        listDiv.innerHTML = `
        <div class="coach-empty-state">
            <i class="fa-solid fa-users-slash"></i>
            <h4>Sin Equipos Inscritos</h4>
            <p>No te has inscrito como Coach en ningún evento. Explora concursos activos para participar.</p>
        </div>`;
        return;
    }

    listDiv.innerHTML = concursos.map(c => {
        let spanFechas = '';
        if (c.fecha_inicio) {
            spanFechas = `<span style="font-size:0.8rem; color:var(--tecnm-gold); margin-left:10px;">${new Date(c.fecha_inicio).toLocaleDateString('es-MX')}</span>`;
        }
        return `
        <div class="coach-card" style="margin-bottom:1rem; border-left:4px solid var(--tecnm-gold);">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4>${c.titulo}</h4>
                    <span class="estado-badge estado-${c.estado}">${c.estado}</span>
                    ${spanFechas}
                </div>
                <div>
                    <button class="btn btn-primary" onclick="window._abrirAdminCoach('${c.id}')"><i class="fa-solid fa-users"></i> Gestionar Equipos</button>
                </div>
            </div>
        </div>
        `;
    }).join('');
}

async function renderExplorarEventos() {
    const listDiv = document.getElementById('lista-eventos-explorar');
    listDiv.innerHTML = '<div style="text-align:center; padding: 2rem;"><i class="fa-solid fa-spinner fa-spin fa-2x" style="color:var(--tecnm-blue);"></i></div>';

    const me = AuthState.user.email;

    // Todos los concursos donde NO soy Juez ni Coach
    const allConcursos = await AuthState.db.getConcursos();
    const concursos = allConcursos.filter(c => !c.jueces_ids.includes(me) && !c.coaches_ids.includes(me));

    if (concursos.length === 0) {
        listDiv.innerHTML = `
        <div class="coach-empty-state">
            <i class="fa-solid fa-globe"></i>
            <h4>No hay Eventos Nuevos</h4>
            <p>Por el momento no hay concursos disponibles para unirse como Coach en la plataforma.</p>
        </div>`;
        return;
    }

    listDiv.innerHTML = concursos.map(c => `
        <div class="coach-card" style="margin-bottom:1rem; border-left:4px solid #6c757d;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h4>${c.titulo}</h4>
                    <span class="estado-badge estado-${c.estado}">${c.estado}</span>
                </div>
                <div>
                    <button class="btn btn-accent" onclick="window._unirseComoCoach('${c.id}')"><i class="fa-solid fa-plus"></i> Inscribir Equipos (Ser Coach)</button>
                </div>
            </div>
        </div>
    `).join('');

    window._unirseComoCoach = async (concursoId) => {
        if (await UIModal.confirm('Registro de Coach', '¿Deseas participar en este evento como Coach de tus equipos?')) {
            AuthState.db.addCoachToConcurso(concursoId, AuthState.user.email);
            renderProfesorTab('ptab-mis-equipos');
            document.querySelector('[data-ptab="ptab-mis-equipos"]').click();
        }
    };
}

// ── Lógica Específica: Administrar Evento (Juez) ──

// Exponer de forma global explícita y asincrónica para debug.
if (typeof window !== 'undefined') {
    window._abrirAdminJuez = async (concursoId) => {
        const concurso = await AuthState.db.getConcursoById(concursoId);
        if (!concurso) {
            console.error("Concurso no encontrado en Supabase: " + concursoId);
            return;
        }

        window.currentAdminConcursoId = concursoId;
        window.currentAdminRole = 'juez';

        document.getElementById('admin-juez-titulo').textContent = concurso.titulo;

        // Esconder tabs y mostrar el tab Admin
        document.querySelectorAll('.ctab-content').forEach(t => t.style.display = 'none');
        const tabAdminJuez = document.getElementById('ptab-admin-juez');
        if (tabAdminJuez) tabAdminJuez.style.display = 'block';

        await renderAdminJuezDetalles();
    };

    window._activarEventoAdmin = async () => {
        if (!window.currentAdminConcursoId) return;
        await AuthState.db.activarConcurso(window.currentAdminConcursoId);
        renderAdminJuezDetalles();
    };

    window._finalizarEventoAdmin = async () => {
        if (!window.currentAdminConcursoId) return;
        await AuthState.db.finalizarConcurso(window.currentAdminConcursoId);
        renderAdminJuezDetalles();
    };

    // Simplificación para añadir problemas directo (idealmente abriendo un modal)
    window._quitarProblema = async (probId) => {
        const c = await AuthState.db.getConcursoById(window.currentAdminConcursoId);
        if (!c) return;

        c.problemas = c.problemas.filter(p => p !== probId);
        await AuthState.db.saveConcurso(c);
        renderAdminJuezDetalles();
    };
}

async function renderAdminJuezDetalles() {
    if (!window.currentAdminConcursoId) return;
    const c = await AuthState.db.getConcursoById(window.currentAdminConcursoId);
    if (!c) return;

    // Estado Top
    document.getElementById('admin-juez-estado').className = `estado-badge estado-${c.estado}`;
    document.getElementById('admin-juez-estado').textContent = c.estado.toUpperCase();

    // Nueva info de categoría y miembros
    const catInfoHTML = `
        <div style="margin-top:0.5rem; display:flex; gap:10px; font-size:0.85rem; opacity:0.8;">
            <span><i class="fa-solid fa-layer-group"></i> ${c.categoria_id || 'Estándar'}</span>
            <span><i class="fa-solid fa-users"></i> ${c.min_integrantes || 1}-${c.max_integrantes || 3} miembros</span>
        </div>
    `;
    document.getElementById('admin-juez-titulo').insertAdjacentHTML('afterend', catInfoHTML);

    const actionsHTML = `
        <div style="margin-top:1.5rem; display:flex; gap:1rem;">
            <button class="btn btn-primary btn-sm" onclick="window.exportarResultadosCSV('${c.id}')">
                <i class="fa-solid fa-file-csv"></i> Exportar Resultados (CSV)
            </button>
            <button class="btn btn-secondary btn-sm" onclick="window.router.navigate('/staff')">
                <i class="fa-solid fa-parachute-box"></i> Panel de Staff (Globos)
            </button>
        </div>
    `;
    document.getElementById('admin-juez-detalles-content').insertAdjacentHTML('beforeend', actionsHTML);

    // ── Monitor de Conexión (Sprint 2) ──
    const monitorHTML = `
        <div class="coach-card" style="margin-top:2rem; border-top:3px solid var(--tecnm-gold);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
                <h4 style="margin:0; color:var(--tecnm-gold);"><i class="fa-solid fa-tower-broadcast"></i> Monitor de Conexión</h4>
                <span class="score-live-badge"><div class="live-dot"></div> LIVE</span>
            </div>
            <div class="coach-table-wrap">
                <table class="coach-table">
                    <thead>
                        <tr>
                            <th>Participante</th>
                            <th>Equipo</th>
                            <th>Última Actividad</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody id="admin-juez-monitor-body">
                        <tr><td colspan="4" style="text-align:center; opacity:0.5;">Cargando presencia...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    `;
    document.getElementById('admin-juez-detalles-content').insertAdjacentHTML('beforeend', monitorHTML);
    renderMonitorConexion(c.id);

    // Timestamps Premium en Vista Admin
    const fi = new Date(c.fecha_inicio);
    const ff = new Date(c.fecha_fin);

    const timeInfoHTML = `
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.5rem; margin-top:1.5rem;">
            <div class="timestamp-group-premium">
                <div class="timestamp-header-premium">
                    <label class="coach-label-premium">Inicio</label>
                    <span class="type-badge-premium">config</span>
                </div>
                <div class="timestamp-body-premium">
                    <div class="time-sub-group">
                        <div style="font-size:1rem; font-weight:700; color:white;">${fi.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        <div style="font-size:0.9rem; color:var(--tecnm-gold); font-family:var(--font-mono);">${fi.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
            </div>
            <div class="timestamp-group-premium">
                <div class="timestamp-header-premium">
                    <label class="coach-label-premium">Termino</label>
                    <span class="type-badge-premium">config</span>
                </div>
                <div class="timestamp-body-premium">
                    <div class="time-sub-group">
                        <div style="font-size:1rem; font-weight:700; color:white;">${ff.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
                        <div style="font-size:0.9rem; color:var(--tecnm-gold); font-family:var(--font-mono);">${ff.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Acciones de Evento (Forzar manual)
    const ax = document.getElementById('admin-juez-acciones');
    if (c.estado !== 'activo' && c.estado !== 'finalizado') {
        ax.innerHTML = `
            ${timeInfoHTML}
            <div style="margin-top:2rem;">
                <button class="btn btn-accent" style="width:100%;" onclick="window._activarEventoAdmin()"><i class="fa-solid fa-play"></i> Forzar Inicio de Evento</button>
                <p style="font-size:0.75rem; color:#888; margin-top:8px; text-align:center;">El disparo automático ocurrirá al llegar la fecha configurada.</p>
            </div>`;
    } else if (c.estado === 'activo') {
        ax.innerHTML = `
            ${timeInfoHTML}
            <div style="margin-top:2rem; display:flex; flex-direction:column; gap:.75rem;">
                <button class="btn btn-danger" style="background:#dc3545; color:white; width:100%;" onclick="window._finalizarEventoAdmin()">
                    <i class="fa-solid fa-stop"></i> Finalizar Evento
                </button>

                <!-- Anunciar al concurso -->
                <div class="coach-card" style="margin:0;border-left:4px solid var(--tecnm-gold);">
                    <h4 style="color:var(--tecnm-gold);font-size:.85rem;margin:0 0 .6rem;"><i class="fa-solid fa-bullhorn"></i> Enviar Anuncio</h4>
                    <input id="announce-titulo" class="coach-input" placeholder="T&#237;tulo del anuncio" style="width:100%;margin-bottom:.4rem;">
                    <textarea id="announce-msg" class="coach-input" rows="2" placeholder="Mensaje a todos los equipos..." style="width:100%;resize:vertical;"></textarea>
                    <select id="announce-tipo" class="coach-input" style="width:100%;margin:.4rem 0;">
                        <option value="info">&#8505; Informativo</option>
                        <option value="warning">&#9888; Advertencia</option>
                        <option value="critico">&#128680; CR&#205;TICO</option>
                        <option value="problema_corregido">&#128295; Correcci&#243;n de Enunciado</option>
                    </select>
                    <button class="btn btn-accent" style="width:100%;" onclick="window._enviarAnuncioJuez('${c.id}')">
                        <i class="fa-solid fa-paper-plane"></i> Enviar Anuncio
                    </button>
                </div>

                <!-- Panel de Clarificaciones -->
                <div class="coach-card" style="margin:0;border-left:4px solid var(--tecnm-blue);">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.6rem;">
                        <h4 style="color:var(--tecnm-blue);font-size:.85rem;margin:0;"><i class="fa-solid fa-comment-dots"></i> Clarificaciones <span id="juez-clarif-count" class="arena-notif-dot" style="display:none;">0</span></h4>
                        <button class="btn-tbl" onclick="window._cargarClarifJuez('${c.id}')"><i class="fa-solid fa-rotate"></i></button>
                    </div>
                    <div id="juez-clarif-list" style="max-height:250px;overflow-y:auto;"><p style="opacity:.4;font-size:.83rem;">Cargando...</p></div>
                </div>
            </div>`;

        // Cargar clarificaciones al renderizar
        window._cargarClarifJuez = async (cid) => {
            const { data } = await supabase
                .from('icpc_clarificaciones')
                .select('*')
                .eq('concurso_id', cid)
                .order('ts_pregunta', { ascending: false });

            const el = document.getElementById('juez-clarif-list');
            const badge = document.getElementById('juez-clarif-count');
            if (!el) return;

            const pendientes = (data || []).filter(c => !c.respuesta);
            if (badge) { badge.textContent = pendientes.length; badge.style.display = pendientes.length ? 'inline' : 'none'; }

            if (!data?.length) { el.innerHTML = '<p style="opacity:.4;font-size:.83rem;">Sin preguntas a&#250;n.</p>'; return; }

            el.innerHTML = data.map(q => `
                <div style="border-left:3px solid ${q.respuesta ? 'var(--status-ac)' : 'var(--tecnm-gold)'};padding:.5rem .75rem;margin-bottom:.5rem;background:rgba(255,255,255,0.03);border-radius:4px;">
                    <div style="font-size:.8rem;font-weight:700;color:rgba(255,255,255,.7);">&#128101; ${q.equipo_nombre} ${q.problema_id ? `<span style="color:var(--tecnm-gold);">(${q.problema_id})</span>` : ''}</div>
                    <div style="font-size:.82rem;color:white;margin:.2rem 0;">${q.pregunta}</div>
                    ${q.respuesta
                    ? `<div style="font-size:.8rem;color:var(--status-ac);"><i class="fa-solid fa-check"></i> ${q.respuesta}</div>`
                    : `<div style="display:flex;gap:.35rem;margin-top:.35rem;">
                            <input id="resp-${q.id}" class="coach-input" placeholder="Respuesta del juez..." style="flex:1;font-size:.8rem;padding:.3rem .5rem;">
                            <button class="btn btn-accent" style="padding:.25rem .6rem;font-size:.78rem;" onclick="window._responderClarif('${q.id}', '${cid}')">OK</button>
                            <label style="display:flex;align-items:center;gap:.3rem;font-size:.75rem;color:rgba(255,255,255,.5);cursor:pointer;">
                                <input type="checkbox" id="public-${q.id}"> P&#250;blica
                            </label>
                        </div>`}
                </div>`).join('');
        };

        window._responderClarif = async (clarifId, concursoId) => {
            const respuesta = document.getElementById(`resp-${clarifId}`)?.value?.trim();
            const esPublica = document.getElementById(`public-${clarifId}`)?.checked;
            if (!respuesta) return;
            await supabase.from('icpc_clarificaciones').update({
                respuesta,
                visible_todos: esPublica || false,
                respondido_por: AuthState.user.email,
                ts_respuesta: new Date().toISOString()
            }).eq('id', clarifId);
            window._cargarClarifJuez(concursoId);
        };

        window._enviarAnuncioJuez = async (concursoId) => {
            const titulo = document.getElementById('announce-titulo')?.value?.trim();
            const mensaje = document.getElementById('announce-msg')?.value?.trim();
            const tipo = document.getElementById('announce-tipo')?.value || 'info';
            if (!titulo || !mensaje) { UIModal.alert('Campos vacios', 'Completa titulo y mensaje.'); return; }
            const { error } = await supabase.from('icpc_anuncios').insert({
                concurso_id: concursoId,
                juez_email: AuthState.user.email,
                titulo, mensaje, tipo
            });
            if (!error) {
                document.getElementById('announce-titulo').value = '';
                document.getElementById('announce-msg').value = '';
                UIModal.alert('&#10003; Enviado', 'Anuncio transmitido a todos los equipos en tiempo real.');
            }
        };

        // Suscripción Realtime para notificar al Juez de nuevas preguntas
        supabase.channel(`juez_clarif_${c.id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'icpc_clarificaciones', filter: `concurso_id=eq.${c.id}` }, () => {
                window._cargarClarifJuez(c.id);
            }).subscribe();

        window._cargarClarifJuez(c.id);

        ax.innerHTML = `
            ${timeInfoHTML}
            <div style="margin-top:2rem; text-align:center; opacity:0.6;">
                <i class="fa-solid fa-check-circle fa-2x" style="color:var(--tecnm-gold); margin-bottom:0.5rem;"></i>
                <div style="font-weight:600;">Evento Finalizado</div>
            </div>`;
    }

    // Lista de Problemas
    const list = document.getElementById('admin-juez-problemas-list');
    const todosProbs = await AuthState.db.getProblemas();

    if (!c.problemas || c.problemas.length === 0) {
        list.innerHTML = '<li style="opacity:0.6; padding:1rem; text-align:center;">No hay problemas asignados. Añade uno.</li>';
    } else {
        list.innerHTML = c.problemas.map((probId, idx) => {
            const p = todosProbs.find(x => x.id === probId);
            const titulo = p ? p.titulo : 'Problema Desconocido';
            const diffClass = p ? (p.dificultad <= 1200 ? 'facil' : p.dificultad <= 1800 ? 'medio' : 'dificil') : 'medio';
            return `
            <li style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px; border-radius:4px;">
                <div>
                    <strong style="color:var(--tecnm-blue);">P${idx + 1}</strong>: ${titulo}
                    ${p ? `<span class="diff-badge diff-${diffClass}" style="margin-left:10px;">${p.dificultad}</span>` : ''}
                </div>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-ghost btn-sm" onclick="window._editarProblemaAdmin('${probId}')" title="Editar Enunciado">
                        <i class="fa-solid fa-pen-to-square" style="color:var(--tecnm-gold);"></i>
                    </button>
                    <button class="btn-tbl btn-tbl--danger" onclick="window._quitarProblema('${probId}')" title="Quitar"><i class="fa-solid fa-trash"></i></button>
                </div>
            </li>`;
        }).join('');
    }

    // Acciones Inline
    window._activarEventoAdmin = () => { AuthState.db.activarConcurso(c.id); renderAdminJuezDetalles(); };
    window._finalizarEventoAdmin = () => { AuthState.db.finalizarConcurso(c.id); renderAdminJuezDetalles(); };

    window._quitarProblema = async (probId) => {
        if (await UIModal.confirm('Quitar Problema', '¿Estás seguro de quitar este problema del concurso?')) {
            c.problemas = c.problemas.filter(id => id !== probId);
            await AuthState.db.saveConcurso(c);
            renderAdminJuezDetalles();
        }
    };

    window._editarProblemaAdmin = async (probId) => {
        const prob = await AuthState.db.getProblemaById(probId);
        if (!prob) return;

        const nuevaDesc = await UIModal.prompt(
            `Editar Enunciado: ${prob.titulo}`,
            'Modifica el HTML/Texto del problema. Se enviará un anuncio si el concurso está activo.',
            prob.descripcion || prob.desc || ''
        );

        if (nuevaDesc !== null && nuevaDesc !== (prob.descripcion || prob.desc)) {
            await supabase.from('icpc_problemas').update({ descripcion: nuevaDesc }).eq('id', probId);
            if (c.estado === 'activo') {
                await AuthState.db.addAnuncio(c.id, `⚠️ El problema "${prob.titulo}" ha sido actualizado. Por favor, revisa el enunciado.`);
            }
            UIModal.alert('Éxito', 'Enunciado actualizado.');
            renderAdminJuezDetalles();
        }
    };

    window._mostrarSelectorProblemas = async () => {
        // GAP 1 FIX: ahora lee de Supabase correctamente
        const banco = await AuthState.db.getProblemas();
        const noAsignados = banco.filter(p => !(c.problemas || []).includes(p.id));

        if (noAsignados.length === 0) {
            UIToast.info('No hay más problemas disponibles en el Banco de Problemas.');
            return;
        }

        const opciones = noAsignados.slice(0, 10).map((p, i) => `${String.fromCharCode(65 + i)}. ${p.titulo} [${p.dificultad}]`).join('\n');
        const probIdStr = await UIModal.prompt(
            'Añadir Problema al Concurso',
            `Escribe el ID del problema a añadir:\n\nPrimeros disponibles:\n${opciones}`,
            'ID del Problema'
        );

        if (probIdStr) {
            const pExacto = banco.find(p => p.id === probIdStr.trim());
            if (pExacto) {
                if (!c.problemas) c.problemas = [];
                if (!c.problemas.includes(pExacto.id)) {
                    c.problemas.push(pExacto.id);
                    await AuthState.db.saveConcurso(c);
                    renderAdminJuezDetalles();
                    UIToast.warn('Ese problema ya está en el concurso.');
                    return;
                }
            } else {
                UIToast.error(`ID "${probIdStr}" no encontrado en el banco.`);
            }
        }
    };
}

// ── Lógica Específica: Gestionar Equipos (Coach) ──

if (typeof window !== 'undefined') {
    window._abrirAdminCoach = async (concursoId) => {
        window.currentAdminConcursoId = concursoId;
        window.currentAdminRole = 'coach';

        const c = await AuthState.db.getConcursoById(concursoId);
        if (!c) {
            console.error("Concurso no encontrado: " + concursoId);
            return;
        }

        document.getElementById('admin-coach-titulo').textContent = c.titulo;

        document.querySelectorAll('.ctab-content').forEach(t => t.style.display = 'none');
        const tabAdminCoach = document.getElementById('ptab-admin-coach');
        if (tabAdminCoach) tabAdminCoach.style.display = 'block';

        await renderAdminCoachAlumnos();
        // await renderAdminCoachScoreboard();
    };

    window._removerAlumnoCoach = async (alumnoEmail) => {
        const confirm = await UIModal.confirm('¿Quitar Alumno?', `¿Estás seguro de quitar a ${alumnoEmail} del concurso?`);
        if (!confirm) return;
        try {
            // GAP 3 FIX: eliminar de la tabla normalizada con concurso_id
            await AuthState.db.deleteParticipante(alumnoEmail, window.currentAdminConcursoId);
            await renderAdminCoachAlumnos();
        } catch (e) {
            UIModal.alert('Error', 'No se pudo eliminar al alumno.');
        }
    };

    window._inscribirAlumnoCoach = async () => {
        const nombreAlu = document.getElementById('coach-nuevo-alumno-nombre').value.trim();
        const emailAlu = document.getElementById('coach-nuevo-alumno-email').value.trim();
        const nombreEq = document.getElementById('coach-nuevo-alumno-equipo').value.trim();

        if (!nombreAlu || !emailAlu || !nombreEq) {
            UIToast.warn('Por favor llena el nombre completo, correo y equipo.');
            return;
        }

        // Validación de tamaño de equipo (Sprint 1)
        const concurso = await AuthState.db.getConcursoById(window.currentAdminConcursoId);
        const maxMembers = concurso?.max_integrantes || 3;

        const todosParticipantes = await AuthState.db.getParticipantesByCoachYConcurso(AuthState.user.email, window.currentAdminConcursoId);
        const miembrosEquipo = (todosParticipantes || []).filter(p => p.equipo.toLowerCase().trim() === nombreEq.toLowerCase().trim());

        if (miembrosEquipo.length >= maxMembers) {
            UIToast.error(`El equipo "${nombreEq}" ya tiene el máximo permitido de ${maxMembers} alumnos.`);
            return;
        }

        const btn = document.querySelector('button[onclick="window._inscribirAlumnoCoach()"]');
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Registrando...';
            btn.disabled = true;
        }
        try {
            await AuthState.db.saveParticipante(
                AuthState.user.email,
                { nombre: nombreAlu, email: emailAlu, equipo: nombreEq },
                window.currentAdminConcursoId  // ← GAP 3 FIX: concurso_id obligatorio
            );

            document.getElementById('coach-nuevo-alumno-nombre').value = '';
            document.getElementById('coach-nuevo-alumno-email').value = '';
            document.getElementById('coach-nuevo-alumno-equipo').value = '';

            await renderAdminCoachAlumnos();
        } catch (error) {
            console.error(error);
            if (error.message?.includes('unique')) {
                UIToast.warn('Este correo ya está inscrito en este concurso.');
            } else {
                UIToast.error('No se pudo registrar al alumno.');
            }
        } finally {
            if (btn) {
                btn.innerHTML = '<i class="fa-solid fa-plus"></i> Inscribir Equipo';
                btn.disabled = false;
            }
        }
    };
}

async function renderAdminCoachAlumnos() {
    if (!window.currentAdminConcursoId) return;
    const body = document.getElementById('admin-coach-alumnos-body');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';

    // GAP 3 + GAP 5 FIX: leer de icpc_participantes con concurso_id
    const alumnos = await AuthState.db.getParticipantesByCoachYConcurso(
        AuthState.user.email,
        window.currentAdminConcursoId
    );

    if (!alumnos.length) {
        body.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:2rem; opacity:0.5;">No has inscrito ningún equipo aún.</td></tr>';
        return;
    }

    body.innerHTML = alumnos.map(a => `
        <tr>
            <td>
                <div style="font-weight:700; color:white;">${a.nombre || 'SIN NOMBRE'}</div>
                <div style="font-size:0.8rem; color:var(--tecnm-text-muted);">${a.email}</div>
            </td>
            <td><span style="color:var(--tecnm-gold); font-weight:600;">${a.equipo}</span></td>
            <td><span style="color:${a.checkin ? 'var(--status-ac)' : 'rgba(255,255,255,0.3)'}; font-size:0.8rem;">
                ${a.checkin ? '<i class="fa-solid fa-circle-check"></i> Conectado' : '<i class="fa-regular fa-circle"></i> Pendiente'}
            </span></td>
            <td><button class="btn-tbl btn-tbl--danger" onclick="window._removerAlumnoCoach('${a.email}')"><i class="fa-solid fa-user-minus"></i></button></td>
        </tr>
    `).join('');
}


let sbInterval = null;

async function renderAdminCoachScoreboard() {
    if (!window.currentAdminConcursoId) return;
    const cId = window.currentAdminConcursoId;

    if (document.getElementById('ptab-admin-coach').style.display === 'none') {
        if (sbInterval) clearInterval(sbInterval);
        return;
    }

    const cAdmin = await AuthState.db.getConcursoById(cId);
    if (!cAdmin) return;

    const sbBody = document.getElementById('admin-coach-scoreboard-body');
    const subs = await AuthState.db.getSubmissionsByConcurso(cId);
    const probCount = (cAdmin.problemas || []).length;

    // Agrupar envíos asíncronos
    const scoreboardData = {};
    subs.forEach(s => {
        if (!scoreboardData[s.equipo]) scoreboardData[s.equipo] = { resueltos: new Set(), penalty: 0 };
        if (s.veredicto === 'AC' && !scoreboardData[s.equipo].resueltos.has(s.problema_id)) {
            scoreboardData[s.equipo].resueltos.add(s.problema_id);
            scoreboardData[s.equipo].penalty += 20;
        } else if (s.veredicto !== 'AC' && !scoreboardData[s.equipo].resueltos.has(s.problema_id)) {
            scoreboardData[s.equipo].penalty += 5;
        }
    });

    const rankList = Object.keys(scoreboardData).map(eq => ({
        equipo: eq,
        resueltos: scoreboardData[eq].resueltos.size,
        penalty: scoreboardData[eq].penalty
    })).sort((a, b) => b.resueltos - a.resueltos || a.penalty - b.penalty);

    if (rankList.length === 0) {
        sbBody.innerHTML = '<tr><td colspan="4" class="sb-empty" style="text-align:center;">Esperando primeros envíos de los analistas...</td></tr>';
        return;
    }

    sbBody.innerHTML = rankList.map((rank, i) => {
        const cls = i === 0 ? 'rank-1' : (i === 1 ? 'rank-2' : (i === 2 ? 'rank-3' : ''));
        return `
        <tr class="${cls}">
            <td class="sb-rank">#${i + 1}</td>
            <td class="sb-equipo">${rank.equipo}</td>
            <td class="sb-total">${rank.resueltos} <span style="font-size:0.7rem;color:#888;">/ ${probCount}</span></td>
            <td class="sb-pen">${rank.penalty}</td>
        </tr>`;
    }).join('');
}

window.exportarResultadosCSV = async (concursoId) => {
    const subs = await AuthState.db.getSubmissionsByConcurso(concursoId);
    if (!subs.length) { UIModal.alert('Sin Datos', 'No hay envíos para exportar.'); return; }

    const equipos = {};
    subs.forEach(s => {
        if (!equipos[s.equipo]) equipos[s.equipo] = { total: 0, penalty: 0, probs: {} };
        if (!equipos[s.equipo].probs[s.problema_id]) equipos[s.equipo].probs[s.problema_id] = { ac: false, tries: 0 };
        if (s.veredicto === 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].ac = true;
            equipos[s.equipo].total++;
            equipos[s.equipo].penalty += (equipos[s.equipo].probs[s.problema_id].tries * 20);
        } else if (s.veredicto !== 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].tries++;
        }
    });

    const rows = Object.entries(equipos)
        .sort((a, b) => b[1].total - a[1].total || a[1].penalty - b[1].penalty)
        .map(([eq, data], i) => `${i + 1},"${eq}",${data.total},${data.penalty}`);

    const csvHeader = "Rank,Equipo,Resueltos,Penalizacion\n";
    const csvContent = "data:text/csv;charset=utf-8," + csvHeader + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `resultados_icpc_${concursoId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.renderMonitorConexion = async (concursoId) => {
    const body = document.getElementById('admin-juez-monitor-body');
    if (!body) return;

    const { data: particip, error } = await supabase
        .from('icpc_participantes')
        .select('*')
        .eq('concurso_id', concursoId);

    if (error || !particip) return;

    const now = new Date().getTime();

    body.innerHTML = particip.map(p => {
        const lastSeen = p.last_seen ? new Date(p.last_seen).getTime() : 0;
        const diffSec = (now - lastSeen) / 1000;
        const isOnline = diffSec < 60; // 1 minuto de margen

        return `
            <tr>
                <td><strong>${p.nombre}</strong><br><small style="opacity:0.6;">${p.email}</small></td>
                <td>${p.equipo}</td>
                <td style="font-size:0.8rem;">${p.last_seen ? new Date(p.last_seen).toLocaleTimeString() : 'Nunca'}</td>
                <td>
                    ${isOnline
                ? '<span class="status-pill--done" style="padding:2px 8px; border-radius:4px; font-size:0.7rem;">ONLINE</span>'
                : '<span style="opacity:0.4; font-size:0.7rem;">OFFLINE</span>'}
                </td>
            </tr>
        `;
    }).join('');
};
