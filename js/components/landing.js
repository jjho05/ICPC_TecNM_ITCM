import { AuthState } from '../core/authState.js';

export const LandingView = () => {
    // Carga asíncrona de eventos tras el render inicial
    setTimeout(renderProximosConcursos, 100);

    return `
    <div class="landing-page view-enter">
        <div class="landing-content">

        <!-- HERO -->
        <section class="hero-section">
            <div class="hero-content">
                <div class="hero-badge">
                    <span class="badge-dot"></span>
                    <span class="badge-mono">SISTEMA ICPC · ITCM · 2026</span>
                </div>

                <h1 class="hero-heading">
                    Concursos de<br>
                    <span class="hero-heading-accent">Programación</span><br>
                    <span class="hero-heading-muted">Competitiva</span>
                </h1>

                <div class="hero-terminal">
                    <span class="terminal-prompt">$</span>
                    <span class="terminal-text">icpc.itcm.edu.mx --list-events</span>
                    <span class="terminal-cursor">█</span>
                </div>

                <div class="hero-stats">
                    <div class="hstat">
                        <span class="hstat-value">ITCM</span>
                        <span class="hstat-label">Ciudad Madero</span>
                    </div>
                    <div class="hstat-divider"></div>
                    <div class="hstat">
                        <span class="hstat-value">AC</span>
                        <span class="hstat-label">Veredicto en vivo</span>
                    </div>
                </div>
            </div>

            <div class="hero-access">
                <div class="ha-card ha-card--alumno">
                    <div class="ha-card-header">
                        <i class="fa-solid fa-terminal ha-icon ha-icon--gold"></i>
                        <div>
                            <p class="ha-role">Competidor</p>
                            <p class="ha-desc">Accede a La Arena y envía soluciones al concurso en vivo.</p>
                        </div>
                    </div>
                    <button class="btn-icpc btn-icpc--gold" data-route="/checkin-alumno">
                        Check-in y Competir <i class="fa-solid fa-bolt"></i>
                    </button>
                </div>
                
                <div class="ha-card ha-card--coach">
                    <div class="ha-card-header">
                        <i class="fa-solid fa-user-tie ha-icon"></i>
                        <p class="ha-role">Profesor / Juez</p>
                    </div>
                    <button class="btn-icpc btn-icpc--primary" data-route="/login-profesor" style="width:100%;">
                        Panel de Control <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>
        </section>

        <!-- SECCIÓN DE PRÓXIMOS EVENTOS (DINÁMICA) -->
        <section class="events-section">
            <div class="section-header">
                <h2 class="section-title"><i class="fa-regular fa-calendar-days"></i> Próximos Concursos</h2>
                <div class="section-line"></div>
            </div>
            <div id="landing-events-list" class="events-grid">
                <div class="event-skeleton">Buscando nuevos retos...</div>
            </div>
        </section>

        <div class="feature-band">
            <div class="feature-item"><i class="fa-solid fa-gavel"></i> <span>Juez automático</span></div>
            <div class="fband-sep"></div>
            <div class="feature-item"><i class="fa-solid fa-chart-bar"></i> <span>Real-time Scoreboard</span></div>
            <div class="fband-sep"></div>
            <div class="feature-item"><i class="fa-solid fa-code"></i> <span>IDE Integrado</span></div>
        </div>

    </div>

    <style>
        .events-section { padding: 4rem 2rem; max-width: 1200px; margin: 0 auto; }
        .section-header { display: flex; align-items: center; gap: 2rem; margin-bottom: 3rem; }
        .section-title { font-size: 2rem; font-weight: 800; color: white; white-space: nowrap; margin: 0; }
        .section-line { height: 2px; flex-grow: 1; background: linear-gradient(90deg, var(--tecnm-gold), transparent); opacity: 0.3; }
        
        .events-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 2rem; }
        .event-card { 
            background: rgba(30, 41, 59, 0.5); 
            border: 1px solid rgba(255,255,255,0.1); 
            border-radius: 20px; 
            padding: 2rem; 
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            backdrop-filter: blur(10px);
        }
        .event-card:hover { 
            transform: translateY(-5px); 
            border-color: var(--tecnm-gold); 
            background: rgba(30, 41, 59, 0.8);
            box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
        }
        .event-date { font-family: var(--font-mono); color: var(--tecnm-gold); font-size: 0.85rem; margin-bottom: 1rem; display: block; }
        .event-name { font-size: 1.4rem; font-weight: 700; color: white; margin-bottom: 1rem; line-height: 1.2; }
        .event-meta { display: flex; gap: 1rem; font-size: 0.8rem; opacity: 0.6; margin-bottom: 2rem; }
        .event-footer { display: flex; justify-content: space-between; align-items: flex-end; }
        .event-skeleton { color: rgba(255,255,255,0.3); font-style: italic; padding: 2rem; }
    </style>
    `;
};

async function renderProximosConcursos() {
    const list = document.getElementById('landing-events-list');
    if (!list) return;

    try {
        const concursos = await AuthState.db.getConcursos();
        const programados = concursos.filter(c => c.estado === 'programado' || c.estado === 'activo')
            .sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));

        if (programados.length === 0) {
            list.innerHTML = '<div class="event-skeleton">No hay concursos programados próximamente. ¡Vuelve pronto!</div>';
            return;
        }

        list.innerHTML = programados.map(c => {
            const dateStr = new Date(c.fecha_inicio).toLocaleDateString('es-MX', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
            });
            const timeStr = new Date(c.fecha_inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

            return `
            <div class="event-card">
                <span class="event-date"><i class="fa-regular fa-clock"></i> ${dateStr} @ ${timeStr}</span>
                <h3 class="event-name">${c.titulo}</h3>
                <div class="event-meta">
                    <span><i class="fa-solid fa-users"></i> Equipos de 1-${c.max_integrantes || 3}</span>
                    <span><i class="fa-solid fa-code"></i> C++, Java, Py</span>
                </div>
                <div class="event-footer">
                    <button class="btn-icpc ${c.estado === 'activo' ? 'btn-icpc--gold' : 'btn-icpc--primary'}" 
                        onclick="window.router.navigate('${c.estado === 'activo' ? '/checkin-alumno' : '/checkin-alumno'}')">
                        ${c.estado === 'activo' ? '¡COMPETIR AHORA!' : 'Registrarse / Ver'} <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </div>
            </div>`;
        }).join('');
    } catch (e) {
        console.error("Error cargando eventos", e);
        list.innerHTML = '<div class="event-skeleton">Error al cargar eventos. Por favor refresca la página.</div>';
    }
}
