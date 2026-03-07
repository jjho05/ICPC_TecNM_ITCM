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
                    <div style="display:grid; grid-template-columns: 2fr 1fr 1fr; gap:1rem; margin-top:1rem;">
                        <div>
                            <label class="coach-label">Nombre del Concurso *</label>
                            <input type="text" id="ce-titulo" class="coach-input" placeholder="Ej: Gran Premio de México 2026">
                        </div>
                        <div>
                            <label class="coach-label">Inicio (Local) *</label>
                            <input type="datetime-local" id="ce-inicio" class="coach-input">
                        </div>
                        <div>
                            <label class="coach-label">Cierre (Local) *</label>
                            <input type="datetime-local" id="ce-fin" class="coach-input">
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
                            <p class="coach-hint" style="margin-bottom:1rem;">Añade los correos de tus alumnos para darles acceso a La Arena.</p>
                            <div class="coach-inline-form" style="flex-direction:column;">
                                <input type="email" id="coach-nuevo-alumno-email" class="coach-input" placeholder="correo@alu.tecnm.mx">
                                <input type="text" id="coach-nuevo-alumno-equipo" class="coach-input" placeholder="Nombre del Equipo">
                                <button class="btn btn-accent" onclick="window._inscribirAlumnoCoach()"><i class="fa-solid fa-user-plus"></i> Añadir Alumno</button>
                            </div>
                            
                            <h5 style="margin-top:2rem; color:var(--tecnm-gold);">Alumnos Inscritos por ti</h5>
                            <div class="coach-table-wrap">
                                <table class="coach-table">
                                    <thead><tr><th>Correo</th><th>Equipo</th><th>Acción</th></tr></thead>
                                    <tbody id="admin-coach-alumnos-body"></tbody>
                                </table>
                            </div>
                        </div>

                        <!-- Mini Scoreboard Focalizado -->
                        <div class="coach-card">
                            <div class="score-header">
                                <h4 style="margin:0; color:var(--tecnm-gold);"><i class="fa-solid fa-list-ol"></i> Scoreboard en Vivo</h4>
                                <span class="score-live-badge"><div class="live-dot"></div> LIVE</span>
                            </div>
                            <p class="coach-hint" style="margin-bottom:1rem;">Resultados generales del concurso.</p>
                            <div class="scoreboard-wrap">
                                <table class="scoreboard-table">
                                    <thead><tr><th>Rk</th><th>Equipo</th><th>Resueltos</th><th>Penalidad</th></tr></thead>
                                    <tbody id="admin-coach-scoreboard-body"></tbody>
                                </table>
                            </div>
                            <p style="text-align:right; margin-top:1rem;"><small>Actualizado automáticamente cada 5s</small></p>
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
        const inicio = document.getElementById('ce-inicio').value;
        const fin = document.getElementById('ce-fin').value;

        if (!titulo || !inicio || !fin) {
            UIModal.alert('Campos Obligatorios', 'Ingresa el Nombre, la Fecha de Apertura y la de Cierre.');
            return;
        }

        const msInicio = new Date(inicio).getTime();
        const msFin = new Date(fin).getTime();

        if (msFin <= msInicio) {
            UIModal.alert('Fechas Inválidas', 'La fecha de cierre debe ser posterior a la de apertura.');
            return;
        }

        const id = 'evt_' + Date.now();
        const btn = document.getElementById('btn-guardar-evento');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
        btn.disabled = true;

        await AuthState.db.saveConcurso({
            id,
            titulo,
            estado: 'programado', // 'programado', 'activo', 'finalizado'
            fecha_inicio: inicio,
            fecha_fin: fin,
            ts_inicio: msInicio,
            ts_fin: msFin,
            problemas: [],
            jueces_ids: [AuthState.user.email],
            coaches_ids: []
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
    document.getElementById('ce-inicio').value = '';
    document.getElementById('ce-fin').value = '';
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

    // Acciones de Evento (Forzar manual)
    const ax = document.getElementById('admin-juez-acciones');
    if (c.estado !== 'activo' && c.estado !== 'finalizado') {
        ax.innerHTML = `<button class="btn btn-accent" onclick="window._activarEventoAdmin()"><i class="fa-solid fa-play"></i> Iniciar Evento Manulamente</button>
                        <p style="font-size:0.75rem; color:#888; margin-top:5px;">El evento se activará solo al llegar la hora, pero puedes forzarlo aquí.</p>`;
    } else if (c.estado === 'activo') {
        ax.innerHTML = `<button class="btn btn-danger" style="background:#dc3545; color:white;" onclick="window._finalizarEventoAdmin()"><i class="fa-solid fa-stop"></i> Finalizar Evento</button>`;
    } else {
        ax.innerHTML = `<span>Este evento ya ha finalizado.</span>`;
    }

    // Lista de Problemas Locales
    const list = document.getElementById('admin-juez-problemas-list');
    const todosProbs = AuthState.db.getProblemas();

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
                <button class="btn-tbl btn-tbl--danger" onclick="window._quitarProblema('${probId}')" title="Quitar"><i class="fa-solid fa-trash"></i></button>
            </li>`;
        }).join('');
    }

    // Acciones Inline
    window._activarEventoAdmin = () => { AuthState.db.activarConcurso(c.id); renderAdminJuezDetalles(); };
    window._finalizarEventoAdmin = () => { AuthState.db.finalizarConcurso(c.id); renderAdminJuezDetalles(); };

    window._quitarProblema = (probId) => {
        c.problemas = c.problemas.filter(id => id !== probId);
        AuthState.simulateDB.saveData();
        renderAdminJuezDetalles();
    };

    window._mostrarSelectorProblemas = async () => {
        const banco = AuthState.db.getProblemas(); // El banco sigue local por ahora
        const noAsignados = banco.filter(p => !(c.problemas || []).includes(p.id));

        if (noAsignados.length === 0) {
            UIModal.alert('Banco Vacio', 'No hay más problemas disponibles en el Banco de Problemas.');
            return;
        }

        const opciones = noAsignados.slice(0, 10).map(p => `${p.id}: ${p.titulo}`).join('\n');
        const probIdStr = await UIModal.prompt('Añadir Problema', 'Escribe el ID (ej: cf_x_y o admin_timestamp) del problema a añadir:\n\nDisponibles (primeros 10):\n' + opciones, 'ID del Problema');

        if (probIdStr) {
            const pExacto = banco.find(p => p.id === probIdStr.trim());
            if (pExacto) {
                if (!c.problemas) c.problemas = [];
                c.problemas.push(pExacto.id);
                await AuthState.db.saveConcurso(c); // Guardado Asíncrono
                renderAdminJuezDetalles();
            } else {
                UIModal.alert('Error', 'ID de problema "' + probIdStr + '" no encontrado.');
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
        const emailCoach = AuthState.user.email;
        const profeData = await AuthState.db.getUsuarioData(emailCoach);
        if (!profeData) return;

        const nuevosEquipos = (profeData.equipos_inscritos || []).filter(e => e.email !== alumnoEmail);
        await supabase.from('icpc_usuarios').update({ equipos_inscritos: nuevosEquipos }).eq('email', emailCoach);

        await renderAdminCoachAlumnos();
    };

    window._inscribirAlumnoCoach = async () => {
        const emailAlu = document.getElementById('coach-nuevo-alumno-email').value.trim();
        const nombreEq = document.getElementById('coach-nuevo-alumno-equipo').value.trim();

        if (!emailAlu || !nombreEq) {
            UIModal.alert('Datos incompletos', 'Completa el Correo Electrónico y el Nombre del Equipo.');
            return;
        }

        const emailCoach = AuthState.user.email;
        const profeData = await AuthState.db.getUsuarioData(emailCoach);
        if (!profeData) return;

        const equipos = profeData.equipos_inscritos || [];
        if (equipos.find(x => x.email === emailAlu)) {
            UIModal.alert('Alumno Existente', 'Este correo ya pertenece a uno de tus equipos registrados.');
            return;
        }

        equipos.push({ email: emailAlu, equipo: nombreEq });

        const btn = document.querySelector('button[onclick="window._inscribirAlumnoCoach()"]');
        if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Resgistrando...';

        await supabase.from('icpc_usuarios').update({ equipos_inscritos: equipos }).eq('email', emailCoach);

        document.getElementById('coach-nuevo-alumno-email').value = '';
        document.getElementById('coach-nuevo-alumno-equipo').value = '';
        if (btn) btn.innerHTML = '<i class="fa-solid fa-plus"></i> Inscribir Equipo';

        await renderAdminCoachAlumnos();
    };
}

async function renderAdminCoachAlumnos() {
    if (!window.currentAdminConcursoId) return;
    const body = document.getElementById('admin-coach-alumnos-body');
    body.innerHTML = '<tr><td colspan="3" style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const emailCoach = AuthState.user.email;
    const profeData = await AuthState.db.getUsuarioData(emailCoach);

    if (!profeData || !profeData.equipos_inscritos || profeData.equipos_inscritos.length === 0) {
        body.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:2rem; opacity:0.5;">No has inscrito ningún equipo.</td></tr>';
    } else {
        body.innerHTML = profeData.equipos_inscritos.map(a => `
            <tr>
                <td>${a.email}</td>
                <td><span style="color:var(--tecnm-blue); font-weight:600;">${a.equipo}</span></td>
                <td><button class="btn-tbl btn-tbl--danger" onclick="window._removerAlumnoCoach('${a.email}')"><i class="fa-solid fa-user-minus"></i> Quitar</button></td>
            </tr>
        `).join('');
    }
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

