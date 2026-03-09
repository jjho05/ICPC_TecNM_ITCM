import { AuthState } from '../core/authState.js';
import { supabase } from '../core/supabaseClient.js';
import { UIModal } from './ui/modal.js';

export const StaffDashboardView = () => {
    setTimeout(() => {
        // En este sistema, un staff puede ser un Profesor o un Alumno con rol específico.
        // Por simplicidad, permitiremos a Profesores acceder a esta vista de logística.
        if (!AuthState.user) { window.router.navigate('/'); return; }

        initStaffDashboard();
    }, 100);

    return `
    <div class="staff-layout view-enter">
        <header class="staff-topbar">
            <div class="staff-topbar-left">
                <i class="fa-solid fa-parachute-box" style="color:var(--tecnm-gold); font-size:1.5rem;"></i>
                <div>
                    <h2 style="margin:0; font-size:1.2rem;">Logística de Globos (Staff)</h2>
                    <span style="font-size:0.8rem; opacity:0.7;">Panel de entregas en tiempo real</span>
                </div>
            </div>
            <div id="staff-concurso-info" style="font-weight:600; color:var(--tecnm-gold);"></div>
            <button class="coach-logout-btn" onclick="window.router.navigate('/')">
                <i class="fa-solid fa-arrow-left"></i> Volver
            </button>
        </header>

        <div class="staff-body">
            <div class="staff-stats-grid">
                <div class="staff-stat-card">
                    <span class="staff-stat-val" id="count-pendientes">0</span>
                    <span class="staff-stat-label">Pendientes</span>
                </div>
                <div class="staff-stat-card">
                    <span class="staff-stat-val" id="count-entregados">0</span>
                    <span class="staff-stat-label">Entregados hoy</span>
                </div>
            </div>

            <div class="staff-card">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
                    <h3 style="margin:0;"><i class="fa-solid fa-list-check"></i> Cola de Entregas</h3>
                    <button class="btn btn-ghost btn-sm" onclick="renderBalloonList()">
                        <i class="fa-solid fa-rotate"></i> Actualizar
                    </button>
                </div>
                
                <div class="staff-table-wrap">
                    <table class="staff-table">
                        <thead>
                            <tr>
                                <th>Estado</th>
                                <th>Equipo</th>
                                <th>Problema</th>
                                <th>Color</th>
                                <th>Hora AC</th>
                                <th>Acción</th>
                            </tr>
                        </thead>
                        <tbody id="balloon-list-body">
                            <tr><td colspan="6" style="text-align:center; padding:3rem; opacity:0.5;">Cargando entregas...</td></tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>

    <style>
        .staff-layout { min-height:100vh; background:#0f172a; color:white; }
        .staff-topbar { background:#1e293b; padding:1rem 2rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid rgba(255,255,255,0.1); }
        .staff-body { padding:2rem; max-width:1200px; margin:0 auto; }
        .staff-stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1.5rem; margin-bottom:2rem; }
        .staff-stat-card { background:#1e293b; padding:1.5rem; border-radius:12px; text-align:center; border:1px solid rgba(255,255,255,0.05); }
        .staff-stat-val { display:block; font-size:2.5rem; font-weight:800; color:var(--tecnm-gold); }
        .staff-stat-label { font-size:0.9rem; text-transform:uppercase; letter-spacing:1px; opacity:0.6; }
        .staff-card { background:#1e293b; border-radius:16px; padding:2rem; border:1px solid rgba(255,255,255,0.05); }
        .staff-table { width:100%; border-collapse:collapse; text-align:left; }
        .staff-table th { padding:1rem; border-bottom:2px solid rgba(255,255,255,0.1); font-size:0.85rem; text-transform:uppercase; color:var(--tecnm-gold); }
        .staff-table td { padding:1rem; border-bottom:1px solid rgba(255,255,255,0.05); vertical-align:middle; }
        .balloon-dot { display:inline-block; width:20px; height:20px; border-radius:50%; box-shadow: 0 0 10px rgba(255,255,255,0.2); border:2px solid white; }
        .status-pill { padding:0.3rem 0.8rem; border-radius:100px; font-size:0.75rem; font-weight:700; }
        .status-pill--pending { background:rgba(245,158,11,0.2); color:#f59e0b; }
        .status-pill--done { background:rgba(34,197,94,0.2); color:#22c55e; }
    </style>
    `;
};

async function initStaffDashboard() {
    const concursos = await AuthState.db.getConcursos();
    const activo = concursos.find(c => c.estado === 'activo');

    if (!activo) {
        document.getElementById('balloon-list-body').innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem; opacity:0.5;">No hay concurso activo para gestionar globos.</td></tr>';
        return;
    }

    window.currentStaffConcursoId = activo.id;
    document.getElementById('staff-concurso-info').textContent = activo.titulo;

    // Suscripción Realtime para nuevos globos
    supabase.channel('staff-balloons')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'icpc_globos_delivery',
            filter: `concurso_id=eq.${activo.id}`
        }, () => {
            renderBalloonList();
        })
        .subscribe();

    renderBalloonList();
}

window.renderBalloonList = async () => {
    const cid = window.currentStaffConcursoId;
    if (!cid) return;

    const { data: list, error } = await supabase
        .from('icpc_globos_delivery')
        .select('*')
        .eq('concurso_id', cid)
        .order('ts_ac', { ascending: false });

    if (error) return;

    const body = document.getElementById('balloon-list-body');
    const pCount = document.getElementById('count-pendientes');
    const dCount = document.getElementById('count-entregados');

    const pendientes = list.filter(x => !x.entregado);
    const entregados = list.filter(x => x.entregado);

    if (pCount) pCount.textContent = pendientes.length;
    if (dCount) dCount.textContent = entregados.length;

    if (list.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:3rem; opacity:0.5;">Aun no hay globos para entregar.</td></tr>';
        return;
    }

    body.innerHTML = list.map(b => `
        <tr>
            <td>
                <span class="status-pill ${b.entregado ? 'status-pill--done' : 'status-pill--pending'}">
                    ${b.entregado ? 'ENTREGADO' : 'PENDIENTE'}
                </span>
            </td>
            <td style="font-weight:700; color:white;">${b.equipo_nombre}</td>
            <td><code style="background:rgba(255,255,255,0.1); padding:0.2rem 0.5rem; border-radius:4px;">${b.problema_id}</code></td>
            <td>
                <div style="display:flex; align-items:center; gap:0.5rem;">
                    <span class="balloon-dot" style="background-color:${b.color}"></span>
                    <span style="font-size:0.8rem; opacity:0.7;">${b.color}</span>
                </div>
            </td>
            <td style="font-size:0.85rem; opacity:0.6;">${new Date(b.ts_ac).toLocaleTimeString()}</td>
            <td>
                ${!b.entregado ? `
                    <button class="btn btn-primary btn-sm" onclick="markBalloonDelivered('${b.id}')">
                        <i class="fa-solid fa-check"></i> Entregar
                    </button>
                ` : `
                    <span style="color:var(--status-ac); font-size:0.8rem;"><i class="fa-solid fa-circle-check"></i> Hecho</span>
                `}
            </td>
        </tr>
    `).join('');
};

window.markBalloonDelivered = async (id) => {
    const { error } = await supabase
        .from('icpc_globos_delivery')
        .update({
            entregado: true,
            ts_entrega: new Date().toISOString(),
            entregado_por: AuthState.user.email
        })
        .eq('id', id);

    if (!error) {
        // La suscripción Realtime se encargará de refrescar la lista
    }
};
