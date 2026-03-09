import { AuthState } from '../core/authState.js';
import { JudgeSim } from '../core/judgeSim.js';
import { UIModal } from './ui/modal.js';
import { PROBLEMS_SEED } from '../data/problemsSeed.js';

// ══════════════════════════════════════════════════════
//  Admin Panel — Plataforma ICPC TecNM
//  Tabs: Banco de Problemas | Editor | Coaches | Concursos
// ══════════════════════════════════════════════════════

export const AdminPanelView = () => {

    // Seed initial problems if empty
    if (AuthState.db.getProblemas().length === 0) {
        AuthState.db.saveProblemasLote(PROBLEMS_SEED);
    }

    setTimeout(() => {
        if (!AuthState.isAdmin()) { window.router.navigate('/'); return; }
        bindAdminEvents();
        renderTab('tab-banco');
    }, 100);

    return `
    <div class="admin-layout view-enter">

        <!-- Sidebar -->
        <aside class="admin-sidebar">
            <div class="admin-sidebar-header">
                <i class="fa-solid fa-shield-halved"></i>
                <div>
                    <p class="admin-role-label">Administrador</p>
                    <p class="admin-role-email">${AuthState.user?.email || ''}</p>
                </div>
            </div>
            <nav class="admin-nav">
                <button class="admin-nav-btn active" data-tab="tab-banco">
                    <i class="fa-solid fa-database"></i> Banco de Problemas
                </button>
                <button class="admin-nav-btn" data-tab="tab-editor">
                    <i class="fa-solid fa-pen-to-square"></i> Editor de Problema
                </button>
                <button class="admin-nav-btn" data-tab="tab-profesores">
                    <i class="fa-solid fa-users-gear"></i> Gestión de Profesores
                </button>
                <button class="admin-nav-btn" data-tab="tab-concursos">
                    <i class="fa-solid fa-trophy"></i> Concursos
                </button>
                <button class="admin-nav-btn" data-tab="tab-sedes">
                    <i class="fa-solid fa-building-user"></i> Gestión de Sedes
                </button>
                <button class="admin-nav-btn" data-tab="tab-analiticas">
                    <i class="fa-solid fa-chart-line"></i> Analíticas
                </button>
                <button class="admin-nav-btn" data-tab="tab-auditoria">
                    <i class="fa-solid fa-shield-halved"></i> Auditoría
                </button>
            </nav>
            <button class="admin-logout-btn" id="admin-logout">
                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
            </button>
        </aside>

        <!-- Contenido principal -->
        <main class="admin-main">

            <!-- TAB: Banco de Problemas -->
            <section id="tab-banco" class="admin-tab">
                <div class="admin-tab-header">
                    <div>
                        <h2 class="admin-tab-title">Banco de Problemas</h2>
                        <p class="admin-tab-sub" id="banco-count">Cargando...</p>
                    </div>
                    <div class="admin-header-actions">
                        <button class="btn-admin btn-admin--ghost" id="btn-import-omegaup">
                            <i class="fa-solid fa-globe"></i> OmegaUp (ES)
                        </button>
                        <button class="btn-admin btn-admin--ghost" id="btn-import-cf">
                            <i class="fa-solid fa-cloud-arrow-down"></i> Codeforces
                        </button>
                        <button class="btn-admin btn-admin--gold" id="btn-nuevo-problema">
                            <i class="fa-solid fa-plus"></i> Nuevo Problema
                        </button>
                    </div>
                </div>

                <!-- Filtros -->
                <div class="admin-filters">
                    <input type="text" id="filter-search" class="admin-input" placeholder="🔍 Buscar por título o tag...">
                    <select id="filter-dificultad" class="admin-select">
                        <option value="">Toda dificultad</option>
                        <option value="800">800 — Fácil</option>
                        <option value="1000">1000</option>
                        <option value="1200">1200</option>
                        <option value="1400">1400</option>
                        <option value="1600">1600 — Difícil</option>
                        <option value="1800">1800+</option>
                    </select>
                    <select id="filter-fuente" class="admin-select">
                        <option value="">Toda fuente</option>
                        <option value="local">Local</option>
                        <option value="codeforces">Codeforces</option>
                        <option value="omegaup">OmegaUp 🇲🇽</option>
                        <option value="admin">Creado por Admin</option>
                    </select>
                </div>

                <!-- Tabla -->
                <div class="admin-table-wrap">
                    <table class="admin-table" id="tabla-problemas">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Título</th>
                                <th>Dificultad</th>
                                <th>Tags</th>
                                <th>Fuente</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-problemas-body"></tbody>
                    </table>
                </div>
                <!-- Paginación -->
                <div class="admin-pagination" id="banco-pagination"></div>
            </section>

            <!-- TAB: Gestión de Sedes (Sede CRUD) -->
            <section id="tab-sedes" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <div>
                        <h2 class="admin-tab-title">Gestión de Sedes</h2>
                        <p class="admin-tab-sub">Administra los laboratorios y espacios físicos de competencia.</p>
                    </div>
                    <button class="btn-admin btn-admin--gold" id="btn-nueva-sede">
                        <i class="fa-solid fa-plus"></i> Nueva Sede
                    </button>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Sede / Laboratorio</th>
                                <th>Capacidad</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="sedes-body"></tbody>
                    </table>
                </div>
            </section>

            <!-- TAB: Analíticas -->
            <section id="tab-analiticas" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <div>
                        <h2 class="admin-tab-title">Dashboard de Analíticas</h2>
                        <p class="admin-tab-sub">Métricas globales de la plataforma en tiempo real.</p>
                    </div>
                </div>
                
                <div class="analytics-grid">
                    <div class="analytics-card">
                        <h3 class="acard-title"><i class="fa-solid fa-circle-check"></i> Veredictos Globales</h3>
                        <div id="chart-veredictos" class="chart-container-bars"></div>
                    </div>
                    <div class="analytics-card">
                        <h3 class="acard-title"><i class="fa-solid fa-code"></i> Lenguajes</h3>
                        <div id="chart-lenguajes" class="chart-container-bars"></div>
                    </div>
                    <div class="analytics-card" style="display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center;">
                        <div id="stat-activity" class="stat-big">—</div>
                        <p class="stat-label">Submissions Hoy</p>
                    </div>
                </div>
                
                <style>
                    .analytics-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }
                    .analytics-card { background: #1e293b; padding: 1.5rem; border-radius: 16px; border: 1px solid rgba(255,255,255,0.05); }
                    .acard-title { font-size: 0.9rem; color: var(--tecnm-gold); margin-bottom: 1.5rem; display: flex; align-items: center; gap: 8px; }
                    .chart-container-bars { display: flex; flex-direction: column; gap: 10px; }
                    .stat-big { font-size: 4rem; font-weight: 800; color: var(--tecnm-gold); }
                    .stat-label { opacity: 0.6; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; }
                    .chart-bar-wrap { display: flex; align-items: center; gap: 10px; }
                    .chart-bar-label { width: 40px; font-size: 0.75rem; opacity: 0.8; }
                    .chart-bar-bg { flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden; }
                    .chart-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
                    .chart-bar-val { font-size: 0.75rem; width: 30px; text-align: right; }
                </style>
            </section>

            <!-- TAB: Editor de Problema -->
            <section id="tab-editor" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <div>
                        <h2 class="admin-tab-title" id="editor-titulo-tab">Nuevo Problema</h2>
                        <p class="admin-tab-sub">Completa todos los campos y añade al menos un caso de prueba.</p>
                    </div>
                    <button class="btn-admin btn-admin--ghost" id="btn-cancelar-editor">
                        <i class="fa-solid fa-arrow-left"></i> Volver al Banco
                    </button>
                </div>
                <div class="editor-layout">
                    <!-- Columna izquierda: metadatos + descripción -->
                    <div class="editor-left">
                        <input type="hidden" id="edit-id">
                        <div class="admin-field-group">
                            <label class="admin-label">Título *</label>
                            <input type="text" id="edit-titulo" class="admin-input" placeholder="Ej: Two Sum">
                        </div>
                        <div class="editor-meta-row">
                            <div class="admin-field-group">
                                <label class="admin-label">Dificultad (rating)</label>
                                <input type="number" id="edit-dificultad" class="admin-input" placeholder="1000" min="800" max="3500">
                            </div>
                            <div class="admin-field-group">
                                <label class="admin-label">Tags (separados por coma)</label>
                                <input type="text" id="edit-tags" class="admin-input" placeholder="math, dp, strings">
                            </div>
                        </div>
                        <div class="admin-field-group">
                            <label class="admin-label">Descripción del Problema * (Markdown habilitado)</label>
                            <div class="editor-md-container">
                                <textarea id="edit-desc" class="admin-textarea" rows="12" placeholder="Escribe el enunciado aquí..."></textarea>
                                <div id="edit-preview" class="admin-preview-pane markdown-body">
                                    <p style="opacity:0.3; padding:1rem; text-align:center;">Previsualización en tiempo real...</p>
                                </div>
                            </div>
                            <p class="admin-help-text">Soporte para LaTeX: Usa $$ para fórmulas (ej: $$x^2$$).</p>
                        </div>
                    </div>

                    <!-- Columna derecha: testcases + ejecución -->
                    <div class="editor-right">
                        <div class="editor-testcases-header">
                            <h4 class="admin-section-title">Casos de Prueba</h4>
                            <button class="btn-admin btn-admin--ghost btn-sm" id="btn-add-testcase">
                                <i class="fa-solid fa-plus"></i> Añadir Caso
                            </button>
                        </div>
                        <div id="testcases-container"></div>

                        <!-- Área de ejecución simulada -->
                        <div class="editor-run-panel">
                            <h4 class="admin-section-title">Probar Veredicto</h4>
                            <p style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:.75rem;">
                                Escribe un código de prueba para verificar el primer caso de prueba.
                            </p>
                            <select id="editor-lang" class="admin-select" style="margin-bottom:.5rem;">
                                <option value="cpp">C++</option>
                                <option value="java">Java</option>
                                <option value="python">Python</option>
                            </select>
                            <textarea id="editor-code" class="code-editor" style="height:120px;" placeholder="// Escribe código de prueba..."></textarea>
                            <button class="btn-admin btn-admin--ghost" id="btn-run-editor" style="margin-top:.5rem;">
                                <i class="fa-solid fa-play"></i> Ejecutar
                            </button>
                            <div id="editor-run-output" class="run-output" style="display:none;"></div>
                        </div>

                        <!-- Acciones finales -->
                        <div class="editor-actions">
                            <button class="btn-admin btn-admin--primary" id="btn-guardar-problema">
                                <i class="fa-solid fa-floppy-disk"></i> Guardar
                            </button>
                            <button class="btn-admin btn-admin--gold" id="btn-publicar-problema">
                                <i class="fa-solid fa-paper-plane"></i> Guardar y Publicar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- TAB: Gestión de Profesores -->
            <section id="tab-profesores" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <h2 class="admin-tab-title">Gestión de Profesores (Jueces/Coaches)</h2>
                    <button class="btn-admin btn-admin--gold" id="btn-add-profesor">
                        <i class="fa-solid fa-plus"></i> Añadir Profesor
                    </button>
                </div>
                <div id="form-add-profesor" class="admin-inline-form" style="display:none;">
                    <input type="text" id="profesor-new-name" class="admin-input" placeholder="Nombre completo">
                    <input type="email" id="profesor-new-email" class="admin-input" placeholder="profesor@tecnm.mx">
                    <input type="password" id="profesor-new-pass" class="admin-input" placeholder="Contraseña temporal">
                    <button class="btn-admin btn-admin--primary" id="btn-save-profesor"><i class="fa-solid fa-check"></i> Guardar</button>
                    <button class="btn-admin btn-admin--ghost" id="btn-cancel-profesor"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead><tr><th>Nombre</th><th>Correo</th><th>Eventos (Juez/Coach)</th><th>Acciones</th></tr></thead>
                        <tbody id="tabla-profesores-body"></tbody>
                    </table>
                </div>
            </section>

            <!-- TAB: Concursos -->
            <section id="tab-concursos" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <h2 class="admin-tab-title">Historial de Concursos</h2>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr><th>Título</th><th>Estado</th><th>Problemas</th><th>Submissions</th><th>Exportar</th></tr>
                        </thead>
                        <tbody id="tabla-concursos-body"></tbody>
                    </table>
                </div>
            <!-- TAB: Auditoría (V4) -->
            <section id="tab-auditoria" class="admin-tab" style="display:none;">
                <div class="admin-tab-header">
                    <div>
                        <h2 class="admin-tab-title">Logs de Auditoría</h2>
                        <p class="admin-tab-sub">Monitorea las acciones críticas realizadas en la plataforma.</p>
                    </div>
                    <button class="btn-admin btn-admin--ghost" id="btn-refresh-audit">
                        <i class="fa-solid fa-arrows-rotate"></i> Actualizar
                    </button>
                </div>
                <div class="admin-filters" style="margin-bottom:1rem;">
                    <select id="filter-audit-concurso" class="admin-select" onchange="renderAuditoria()">
                        <option value="">Todos los Concursos / Global</option>
                    </select>
                </div>
                <div class="admin-table-wrap">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Usuario</th>
                                <th>Acción</th>
                                <th>Detalle</th>
                            </tr>
                        </thead>
                        <tbody id="tabla-auditoria-body"></tbody>
                    </table>
                </div>
            </section>

        </main>
    </div>`;
};

// ── Lógica del Admin Panel ─────────────────────────────

let bancoPagina = 1;
const BANCO_POR_PAGINA = 20;
let bancoFiltrado = [];

function bindAdminEvents() {
    // Tabs
    document.querySelectorAll('.admin-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderTab(btn.dataset.tab);
        });
    });

    document.getElementById('admin-logout').addEventListener('click', () => {
        AuthState.logout(); window.router.navigate('/');
    });

    // Banco
    document.getElementById('btn-import-omegaup').addEventListener('click', importarDeOmegaUp);
    document.getElementById('btn-import-cf').addEventListener('click', importarDeCodeforces);
    document.getElementById('btn-nuevo-problema').addEventListener('click', () => abrirEditor(null));
    document.getElementById('filter-search').addEventListener('input', () => { bancoPagina = 1; renderBanco(); });
    document.getElementById('filter-dificultad').addEventListener('change', () => { bancoPagina = 1; renderBanco(); });
    document.getElementById('filter-fuente').addEventListener('change', () => { bancoPagina = 1; renderBanco(); });

    // Editor
    document.getElementById('btn-cancelar-editor').addEventListener('click', () => renderTab('tab-banco'));
    document.getElementById('btn-add-testcase').addEventListener('click', addTestcaseRow);
    document.getElementById('btn-run-editor').addEventListener('click', runEditorCode);
    document.getElementById('btn-guardar-problema').addEventListener('click', () => guardarProblema(false));
    document.getElementById('btn-publicar-problema').addEventListener('click', () => guardarProblema(true));

    // Profesores
    document.getElementById('btn-add-profesor').addEventListener('click', () => {
        document.getElementById('form-add-profesor').style.display = 'flex';
    });
    document.getElementById('btn-cancel-profesor').addEventListener('click', () => {
        document.getElementById('form-add-profesor').style.display = 'none';
    });
    document.getElementById('btn-save-profesor').addEventListener('click', saveProfesor);
    document.getElementById('btn-nueva-sede').addEventListener('click', nuevaSede);
    document.getElementById('btn-refresh-audit').addEventListener('click', renderAuditoria);

    renderBanco();
    renderProfesores();
    renderConcursos();
}

function renderTab(tabId) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    const tab = document.getElementById(tabId);
    if (tab) tab.style.display = 'block';

    if (tabId === 'tab-banco') renderBanco();
    if (tabId === 'tab-profesores') renderProfesores();
    if (tabId === 'tab-concursos') renderConcursos();
    if (tabId === 'tab-sedes') renderSedes();
    if (tabId === 'tab-analiticas') renderAnaliticas();
    if (tabId === 'tab-auditoria') renderAuditoria();
}

async function renderBanco() {
    const body = document.getElementById('tabla-problemas-body');
    if (body) body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;opacity:.4;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando...</td></tr>';

    const search = document.getElementById('filter-search')?.value || '';
    const diff = document.getElementById('filter-dificultad')?.value || '';
    const fuente = document.getElementById('filter-fuente')?.value || '';

    const { data: pagina, count } = await AuthState.db.getProblemas(bancoPagina, BANCO_POR_PAGINA, {
        search,
        dificultad: diff,
        fuente: fuente
    });

    if (document.getElementById('banco-count')) {
        document.getElementById('banco-count').textContent = `${pagina.length} mostrados (Total: ${count})`;
    }

    const inicio = (bancoPagina - 1) * BANCO_POR_PAGINA;

    if (!body) return;
    body.innerHTML = pagina.map((p, i) => `
        <tr>
            <td>${inicio + i + 1}</td>
            <td class="problema-titulo">${p.titulo}</td>
            <td><span class="diff-badge diff-${getDiffClass(p.dificultad)}">${p.dificultad || '?'}</span></td>
            <td class="tags-cell">${(p.tags || []).slice(0, 3).map(t => `<span class="tag-chip">${t}</span>`).join('')}</td>
            <td><span class="fuente-badge">${p.fuente || 'local'}</span></td>
            <td class="acciones-cell">
                <button class="btn-tbl" onclick="window._adminEditProblema('${p.id}')"><i class="fa-solid fa-pen"></i></button>
                <button class="btn-tbl btn-tbl--danger" onclick="window._adminDeleteProblema('${p.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="6" style="text-align:center;padding:2rem;opacity:.4;">No hay problemas con ese filtro.</td></tr>';

    renderPaginacion(count);

    window._adminEditProblema = async (id) => {
        const prob = await AuthState.db.getProblemaById(id);
        abrirEditor(prob);
    };
    window._adminDeleteProblema = async (id) => {
        if (await UIModal.confirm('Eliminar Problema', '¿Seguro que deseas eliminar este problema del banco?')) {
            try {
                await AuthState.db.deleteProblema(id);
                renderBanco();
                UIToast.success('Problema eliminado correctamente.');
            } catch (e) { UIToast.error('No se pudo eliminar el problema.'); }
        }
    };
}

function renderPaginacion(total) {
    const totalPaginas = Math.ceil(total / BANCO_POR_PAGINA);
    const pag = document.getElementById('banco-pagination');
    if (!pag) return;
    pag.innerHTML = '';
    for (let i = 1; i <= totalPaginas; i++) {
        const btn = document.createElement('button');
        btn.className = `pag-btn${i === bancoPagina ? ' active' : ''}`;
        btn.textContent = i;
        btn.onclick = () => { bancoPagina = i; renderBanco(); };
        pag.appendChild(btn);
    }
}

async function renderSedes() {
    const list = document.getElementById('sedes-body');
    if (!list) return;
    list.innerHTML = '<tr><td colspan="4" style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando sedes...</td></tr>';

    const { data: sedes, error } = await supabase.from('icpc_sedes').select('*');
    if (error) { list.innerHTML = '<tr><td colspan="4">Error al cargar sedes.</td></tr>'; return; }

    list.innerHTML = sedes.map(s => `
        <tr>
            <td><strong>${s.nombre}</strong><br><small style="opacity:0.6;">${s.direccion || 'Sin dirección'}</small></td>
            <td>${s.capacidad}</td>
            <td><span class="status-pill--done" style="padding:2px 8px; border-radius:4px; font-size:0.7rem;">${s.activa ? 'ACTIVA' : 'INACTIVA'}</span></td>
            <td class="acciones-cell">
                <button class="btn-tbl btn-tbl--danger" onclick="window._deleteSede('${s.id}')"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;padding:2rem;opacity:.4;">No hay sedes registradas.</td></tr>';

    window._deleteSede = async (id) => {
        if (await UIModal.confirm('Eliminar Sede', '¿Seguro que deseas eliminar esta sede?')) {
            await supabase.from('icpc_sedes').delete().eq('id', id);
            renderSedes();
        }
    };
}

async function nuevaSede() {
    const nombre = await UIModal.prompt('Nueva Sede', 'Nombre del Laboratorio / Espacio:', 'Lab A');
    if (!nombre) return;
    const cap = await UIModal.prompt('Capacidad', 'Número de computadoras:', '30');
    if (!cap) return;

    await supabase.from('icpc_sedes').insert({
        nombre,
        capacidad: parseInt(cap),
        activa: true
    });
    renderSedes();
}

async function renderAnaliticas() {
    const statActivity = document.getElementById('stat-activity');
    const chartVeredictos = document.getElementById('chart-veredictos');
    const chartLenguajes = document.getElementById('chart-lenguajes');

    if (statActivity) statActivity.textContent = '...';

    // 1. Submissions hoy
    const { count } = await supabase
        .from('icpc_submissions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 86400000).toISOString());

    if (statActivity) statActivity.textContent = count || 0;

    // 2. Veredictos
    const { data: subsV } = await supabase.from('icpc_submissions').select('veredicto');
    const vCounts = (subsV || []).reduce((acc, s) => { acc[s.veredicto] = (acc[s.veredicto] || 0) + 1; return acc; }, {});
    const vMax = Math.max(...Object.values(vCounts), 1);

    if (chartVeredictos) {
        chartVeredictos.innerHTML = Object.entries(vCounts).slice(0, 5).map(([v, c]) => `
            <div class="chart-bar-wrap">
                <span class="chart-bar-label">${v}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width:${(c / vMax) * 100}%; background:${v === 'AC' ? '#22c55e' : '#ef4444'};"></div>
                </div>
                <span class="chart-bar-val">${c}</span>
            </div>
        `).join('') || '<p style="opacity:0.4;">Sin datos.</p>';
    }

    // 3. Lenguajes
    const { data: subsL } = await supabase.from('icpc_submissions').select('lenguaje');
    const lCounts = (subsL || []).reduce((acc, s) => { acc[s.lenguaje] = (acc[s.lenguaje] || 0) + 1; return acc; }, {});
    const lMax = Math.max(...Object.values(lCounts), 1);

    if (chartLenguajes) {
        chartLenguajes.innerHTML = Object.entries(lCounts).slice(0, 5).map(([l, c]) => `
            <div class="chart-bar-wrap">
                <span class="chart-bar-label">${l}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width:${(c / lMax) * 100}%; background:var(--tecnm-blue);"></div>
                </div>
                <span class="chart-bar-val">${c}</span>
            </div>
        `).join('') || '<p style="opacity:0.4;">Sin datos.</p>';
    }
}

function getDiffClass(d) {
    if (!d) return 'medio';
    if (d <= 1000) return 'facil';
    if (d <= 1400) return 'medio';
    if (d <= 1800) return 'dificil';
    return 'experto';
}

async function importarDeCodeforces() {
    const btn = document.getElementById('btn-import-cf');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando...';
    btn.disabled = true;

    try {
        const res = await fetch('https://codeforces.com/api/problemset.problems');
        const data = await res.json();
        if (data.status !== 'OK') throw new Error('API error');

        const problemas = data.result.problems
            .filter(p => p.rating && p.rating >= 800 && p.rating <= 2000 && p.tags?.length)
            .slice(0, 300)
            .map(p => ({
                id: `cf_${p.contestId}_${p.index}`,
                titulo: p.name,
                dificultad: p.rating,
                tags: p.tags,
                fuente: 'codeforces',
                descripcion: `<h3>${p.name}</h3><p><em>Problema de Codeforces — Ronda ${p.contestId}, Problema ${p.index}</em></p><p>Ver enunciado completo en: <a href="https://codeforces.com/problemset/problem/${p.contestId}/${p.index}" target="_blank" style="color:var(--tecnm-gold);">codeforces.com/problem/${p.contestId}/${p.index}</a></p>`,
                casos_prueba: [],
                publicado: true
            }));

        await AuthState.db.saveProblemasLote(problemas);
        const count = problemas.length;
        btn.innerHTML = `<i class="fa-solid fa-check"></i> ${count} importados`;
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Importar de Codeforces';
            btn.disabled = false;
        }, 3000);
        renderBanco();
    } catch (e) {
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Error (sin conexión)';
        btn.disabled = false;
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-down"></i> Importar de Codeforces'; btn.disabled = false; }, 3000);
    }
}

function abrirEditor(problema) {
    renderTab('tab-editor');
    document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('[data-tab="tab-editor"]').classList.add('active');

    document.getElementById('editor-titulo-tab').textContent = problema ? 'Editar Problema' : 'Nuevo Problema';

    // Zen Mode Logic
    const zenBtn = document.getElementById('btn-zen-mode');
    if (zenBtn) {
        zenBtn.onclick = () => {
            const editorMain = document.querySelector('.admin-main');
            editorMain.classList.toggle('zen-active');
            zenBtn.innerHTML = editorMain.classList.contains('zen-active')
                ? '<i class="fa-solid fa-compress"></i> Salir Zen'
                : '<i class="fa-solid fa-expand"></i> Zen Mode';
        };
    }

    document.getElementById('edit-id').value = problema?.id || '';
    document.getElementById('edit-titulo').value = problema?.titulo || '';
    document.getElementById('edit-dificultad').value = problema?.dificultad || 1000;
    document.getElementById('edit-tags').value = (problema?.tags || []).join(', ');
    document.getElementById('edit-desc').value = problema?.descripcion || problema?.desc || '';

    const preview = document.getElementById('edit-preview');
    const updatePreview = () => {
        const text = document.getElementById('edit-desc').value;
        const html = marked.parse(text);
        preview.innerHTML = html;
        if (typeof renderMathInElement === 'function') {
            renderMathInElement(preview, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });
        }
    };
    document.getElementById('edit-desc').oninput = updatePreview;
    updatePreview();

    const container = document.getElementById('testcases-container');
    container.innerHTML = '';
    const testcases = problema?.testcases?.length ? problema.testcases : [{ input: '', expected: '' }];
    testcases.forEach(tc => addTestcaseRow(tc));
}

function addTestcaseRow(tc = {}) {
    const container = document.getElementById('testcases-container');
    const row = document.createElement('div');
    row.className = 'testcase-row';
    row.innerHTML = `
        <div class="testcase-field">
            <label class="admin-label">Input</label>
            <textarea class="admin-textarea tc-input" rows="3" placeholder="Entrada esperada">${tc.input || ''}</textarea>
        </div>
        <div class="testcase-field">
            <label class="admin-label">Output esperado</label>
            <textarea class="admin-textarea tc-expected" rows="3" placeholder="Salida esperada">${tc.expected || tc.output || ''}</textarea>
        </div>
        <button class="btn-tbl btn-tbl--danger tc-remove" title="Eliminar"><i class="fa-solid fa-xmark"></i></button>
    `;
    row.querySelector('.tc-remove').onclick = () => row.remove();
    container.appendChild(row);
}

function runEditorCode() {
    const code = document.getElementById('editor-code').value;
    const lang = document.getElementById('editor-lang').value;
    const tcInputs = [...document.querySelectorAll('.tc-input')].map(el => el.value);
    const tcExpecteds = [...document.querySelectorAll('.tc-expected')].map(el => el.value);

    const ejemplo = { input: tcInputs[0] || '', output: tcExpecteds[0] || '' };
    const resultado = JudgeSim.run(code, lang, ejemplo);

    const outputEl = document.getElementById('editor-run-output');
    outputEl.style.display = 'block';
    outputEl.innerHTML = `
        <div class="run-output-header">
            <span class="verd-badge verd-${resultado.ok ? 'ac' : 'wa'}">${resultado.ok ? 'AC' : 'WA'}</span>
            <span style="font-size:.8rem;color:rgba(255,255,255,.4);">Output simulado</span>
        </div>
        <pre class="run-pre">${resultado.output || '(sin salida)'}</pre>
    `;
}

async function guardarProblema(publicar) {
    const idEl = document.getElementById('edit-id');
    const id = idEl.value || `admin_${crypto.randomUUID().slice(0, 8)}`;
    const titulo = document.getElementById('edit-titulo').value.trim();
    const diff = parseInt(document.getElementById('edit-dificultad').value) || 1000;
    const tags = document.getElementById('edit-tags').value.split(',').map(t => t.trim()).filter(Boolean);
    const desc = document.getElementById('edit-desc').value.trim();

    if (!titulo || !desc) { UIModal.alert('Campos Incompletos', 'Completa Título y Descripción.'); return; }

    const inputs = [...document.querySelectorAll('.tc-input')].map(el => el.value.trim());
    const expecteds = [...document.querySelectorAll('.tc-expected')].map(el => el.value.trim());
    const casos_prueba = inputs.map((inp, i) => ({ input: inp, output: expecteds[i] || '' })).filter(tc => tc.input);

    try {
        await AuthState.db.saveProblema({
            id, titulo, dificultad: diff, tags,
            descripcion: desc,
            casos_prueba,
            fuente: 'admin',
            publicado: publicar,
            creado_por: AuthState.user.email || 'admin'
        });
        UIToast.success(publicar ? 'Problema publicado!' : 'Borrador guardado.');
        renderTab('tab-banco');
    } catch (e) {
        UIToast.error('No se pudo guardar el problema.');
    }
}

function renderProfesores() {
    const body = document.getElementById('tabla-profesores-body');
    if (!body) return;
    const usuarios = AuthState.db.getUsuarios();

    body.innerHTML = usuarios.length
        ? usuarios.map(u => {
            const concursos = AuthState.db.getConcursos();
            const esJuez = concursos.filter(c => c.jueces_ids.includes(u.email)).length;
            const esCoach = concursos.filter(c => c.coaches_ids.includes(u.email)).length;
            return `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span style="color:var(--tecnm-blue);font-weight:600;">${esJuez} J</span> / <span style="color:var(--tecnm-gold);font-weight:600;">${esCoach} C</span></td>
                <td><button class="btn-tbl btn-tbl--danger" onclick="window._removeProfesor('${u.email}')"><i class="fa-solid fa-trash"></i> Eliminar</button></td>
            </tr>`;
        }).join('')
        : '<tr><td colspan="4" style="text-align:center;padding:2rem;opacity:.4;">No hay profesores registrados.</td></tr>';

    window._removeProfesor = async (email) => {
        if (await UIModal.confirm('Eliminar Profesor', `¿Eliminar al profesor ${email}? Perderá acceso a sus eventos.`)) {
            AuthState.db.removeUsuario(email); renderProfesores();
        }
    };
}

async function saveProfesor() {
    const name = document.getElementById('profesor-new-name').value.trim();
    const email = document.getElementById('profesor-new-email').value.trim();
    const pass = document.getElementById('profesor-new-pass').value.trim();
    if (!name || !email || !pass) { await UIModal.alert('Campos Incompletos', 'Completa todos los campos para añadir un profesor.'); return; }

    AuthState.db.addUsuario(email, name, pass);

    document.getElementById('form-add-profesor').style.display = 'none';
    document.getElementById('profesor-new-name').value = '';
    document.getElementById('profesor-new-email').value = '';
    document.getElementById('profesor-new-pass').value = '';
    renderProfesores();
}

async function renderConcursos() {
    const body = document.getElementById('tabla-concursos-body');
    if (!body) return;
    body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1.5rem;opacity:.4;"><i class="fa-solid fa-spinner fa-spin"></i></td></tr>';

    const concursos = await AuthState.db.getConcursos();
    if (!concursos.length) {
        body.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:2rem;opacity:.4;">No hay concursos aún.</td></tr>';
        return;
    }

    const rows = await Promise.all(concursos.map(async c => {
        return `
        <tr>
            <td>${c.titulo || 'Sin título'}</td>
            <td><span class="estado-badge estado-${c.estado}">${c.estado}</span></td>
            <td>${(c.problemas || []).length} problemas</td>
            <td>—</td>
            <td>
                <button class="btn-tbl" onclick="window._exportarConcurso('${c.id}')"><i class="fa-solid fa-file-csv"></i> CSV</button>
            </td>
        </tr>`;
    }));
    body.innerHTML = rows.join('');

    window._exportarConcurso = async (id) => {
        const { data: subs } = await supabase.from('icpc_submissions').select('*').eq('concurso_id', id);
        if (!subs?.length) { UIToast.info('No hay submissions para este concurso.'); return; }
        const csv = 'Equipo,Problema,Veredicto,Tiempo(ms),Timestamp\n' +
            subs.map(s => `${s.equipo},${s.problema_id},${s.veredicto},${s.tiempo_ms || 0},${s.ts_servidor || s.timestamp}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = `concurso_${id}.csv`; a.click();
    };
}

// ── Importar de OmegaUp (Problemas en ESPAÑOL) ────────────────────────────
async function importarDeOmegaUp() {
    const btn = document.getElementById('btn-import-omegaup');

    // Modal de configuración interactiva
    const config = await UIModal.confirm(
        '🇲🇽 Importar desde OmegaUp',
        `OmegaUp tiene más de 10,000 problemas en español (OMI, ICPC México).\n\n¿Deseas importar los 200 mejores problemas en español ordenados por calidad?\n\n(Los problemas se guardarán en Supabase y estarán disponibles para todos.)`
    );
    if (!config) return;

    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Importando desde OmegaUp...';
    btn.disabled = true;

    try {
        // OmegaUp API pública — no requiere autenticación para leer
        const ROWCOUNT = 200;
        const url = `https://omegaup.com/api/problem/list/?page=1&order_by=quality&offset=0&rowcount=${ROWCOUNT}&language=es`;

        const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();

        if (data.status !== 'ok') throw new Error('OmegaUp API error: ' + data.status);

        const problemas = data.results.map(p => {
            // Mapear dificultad OmegaUp (0.0–3.0) → escala ICPC (800–2800)
            const diff = mapOmegaUpDiff(p.difficulty);

            // Limpiar tags: remover prefijos internos de OmegaUp
            const tags = (p.tags || [])
                .map(t => t.name)
                .filter(t => !t.startsWith('problemLevel') && !t.startsWith('problemRestricted'))
                .map(t => t
                    .replace('problemTag', '')
                    .replace('problemTopic', '')
                    .replace(/([A-Z])/g, ' $1').trim()
                )
                .filter(Boolean)
                .slice(0, 5);

            return {
                id: `ou_${p.alias}`,
                titulo: p.title,
                descripcion: buildOmegaUpDesc(p),
                dificultad: diff,
                tags,
                fuente: 'omegaup',
                tiempo_limite: 2000,
                memoria_limite: 256,
                casos_prueba: [],
                publicado: true,
                creado_por: 'omegaup-import'
            };
        });

        await AuthState.db.saveProblemasLote(problemas);

        btn.innerHTML = `<i class="fa-solid fa-check"></i> ${problemas.length} problemas en ES importados`;
        setTimeout(() => {
            btn.innerHTML = '<i class="fa-solid fa-globe"></i> OmegaUp (ES)';
            btn.disabled = false;
        }, 4000);
        renderBanco();

        UIModal.alert(
            '✅ Importación Exitosa',
            `Se importaron <strong>${problemas.length} problemas en español</strong> desde OmegaUp.\n\n` +
            `Incluye problemas de: OMI, ICPC México, OMIPS y más.\n\n` +
            `Puedes buscarlos filtrando por fuente "OmegaUp".`
        );

    } catch (e) {
        console.error('OmegaUp import error:', e);
        btn.innerHTML = '<i class="fa-solid fa-xmark"></i> Error';
        btn.disabled = false;
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-globe"></i> OmegaUp (ES)'; }, 3000);
        UIModal.alert('Error de Importación', 'No se pudo conectar con OmegaUp. Verifica tu conexión a internet.');
    }
}

/**
 * Mapea la dificultad de OmegaUp (escala 0–3) a la escala Codeforces (800–2800)
 * OmegaUp: 0=trivial, 1=fácil, 2=medio, 3=difícil
 */
function mapOmegaUpDiff(diff) {
    if (!diff && diff !== 0) return 1200;
    if (diff < 0.5) return 800;
    if (diff < 1.0) return 1000;
    if (diff < 1.5) return 1200;
    if (diff < 2.0) return 1400;
    if (diff < 2.5) return 1800;
    if (diff < 3.0) return 2200;
    return 2800;
}

/**
 * Genera una descripción HTML para un problema de OmegaUp
 */
function buildOmegaUpDesc(p) {
    const acRate = p.submissions > 0 ? ((p.accepted / p.submissions) * 100).toFixed(1) : 'N/A';
    return `
<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:1rem;margin-bottom:1rem;">
    <div style="display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem;">
        <span style="background:#1a73e8;color:white;padding:3px 10px;border-radius:20px;font-size:.8rem;font-weight:700;">OmegaUp</span>
        ${p.quality_seal ? '<span style="color:#f59e0b;font-size:.85rem;"><i class="fa-solid fa-seal"></i> Quality Seal</span>' : ''}
    </div>
    <p style="color:rgba(255,255,255,.6);font-size:.9rem;margin:0;">
        Ver el enunciado completo en:
        <a href="https://omegaup.com/arena/problem/${p.alias}/" target="_blank" style="color:var(--tecnm-gold);font-weight:600;">
            omegaup.com/arena/problem/${p.alias}
        </a>
    </p>
    <div style="display:flex;gap:1.5rem;margin-top:.75rem;font-size:.8rem;color:rgba(255,255,255,.4);">
        <span><i class="fa-solid fa-check-circle" style="color:var(--status-ac);"></i> ${p.accepted} aceptados</span>
        <span><i class="fa-solid fa-paper-plane"></i> ${p.submissions} envíos</span>
        <span><i class="fa-solid fa-percent"></i> ${acRate}% aceptación</span>
    </div>
</div>
<p style="color:rgba(255,255,255,.5);font-style:italic;font-size:.9rem;">
    Este problema está disponible en español en OmegaUp. Haz clic en el enlace para ver el enunciado completo.
</p>
    `.trim();
}

/**
 * Auto-traducir texto usando MyMemory API (gratuita, sin clave)
 * Límite: ~5000 palabras/día por IP
 */
async function autoTraducirTexto(texto, de = 'en', a = 'es') {
    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(texto)}&langpair=${de}|${a}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.responseStatus === 200 && data.responseData?.translatedText) {
            return data.responseData.translatedText;
        }
        return texto; // Fall back al original si falla
    } catch {
        return texto;
    }
}

async function renderAuditoria() {
    const sel = document.getElementById('filter-audit-concurso');

    // Poblar selector si está vacío
    if (sel && sel.options.length <= 1) {
        const concs = await AuthState.db.getConcursos();
        concs.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.titulo;
            sel.appendChild(opt);
        });
    }

    const body = document.getElementById('tabla-auditoria-body');
    if (!body) return;

    body.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:1.5rem;opacity:.4;"><i class="fa-solid fa-spinner fa-spin"></i> Cargando logs...</td></tr>';

    try {
        let query = supabase.from('icpc_logs_auditoria').select('*').order('created_at', { ascending: false }).limit(100);

        const concursoId = sel?.value;
        if (concursoId) {
            query = query.ilike('detalles', `%${concursoId}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        body.innerHTML = data.length
            ? data.map(log => `
                <tr>
                    <td><small>${new Date(log.created_at).toLocaleString()}</small></td>
                    <td><strong>${log.usuario_email}</strong></td>
                    <td><span class="status-pill--done" style="font-size:0.7rem;">${log.accion}</span></td>
                    <td><small style="opacity:0.7;">${log.detalles}</small></td>
                </tr>
            `).join('')
            : '<tr><td colspan="4" style="text-align:center;padding:2rem;opacity:.4;">No hay registros de auditoría aún.</td></tr>';

    } catch (e) {
        console.error(e);
        body.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--status-re);">Error al cargar auditoría. Verifica que la tabla exista.</td></tr>';
    }
}

