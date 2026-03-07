export const LandingView = () => `
<div class="landing-page view-enter">
    <div class="landing-content">

    <!-- HERO: oscuro, denso, competitivo -->
    <section class="hero-section">
        <div class="hero-content">

            <!-- Badge de estado -->
            <div class="hero-badge">
                <span class="badge-dot"></span>
                <span class="badge-mono">SISTEMA ICPC · ITCM · 2026</span>
            </div>

            <!-- Título principal -->
            <h1 class="hero-heading">
                Concursos de<br>
                <span class="hero-heading-accent">Programación</span><br>
                <span class="hero-heading-muted">Competitiva</span>
            </h1>

            <!-- Subtítulo tipo terminal -->
            <div class="hero-terminal">
                <span class="terminal-prompt">$</span>
                <span class="terminal-text">icpc.itcm.edu.mx --start-contest --region=MX</span>
                <span class="terminal-cursor">█</span>
            </div>

            <!-- Stats horizontales -->
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
                <div class="hstat-divider"></div>
                <div class="hstat">
                    <span class="hstat-value">5h</span>
                    <span class="hstat-label">Duración estándar</span>
                </div>
            </div>
        </div>

        <!-- Panel de acceso a la derecha -->
        <div class="hero-access">
            
            <div class="ha-card ha-card--admin">
                <div class="ha-card-header">
                    <i class="fa-solid fa-shield-halved ha-icon" style="color: #94a3b8;"></i>
                    <div>
                        <p class="ha-role">Administrador / Juez</p>
                        <p class="ha-desc" style="font-size:0.8rem; opacity:0.8;">Creador de concursos y banco de problemas.</p>
                    </div>
                </div>
                <button class="btn-icpc btn-icpc--ghost" style="font-size: 0.85rem; padding: 0.5rem;" data-route="/login-admin">
                    Acceso Administrativo <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>

            <div class="ha-card ha-card--coach">
                <div class="ha-card-header">
                    <i class="fa-solid fa-user-tie ha-icon"></i>
                    <div>
                        <p class="ha-role">Profesor (Juez/Coach)</p>
                        <p class="ha-desc">Gestión de eventos, asignación de problemas y administración de equipos.</p>
                    </div>
                </div>
                <button class="btn-icpc btn-icpc--primary" data-route="/login-profesor">
                    Entrar al Panel Profesor <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>

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

        </div>
    </section>

    <!-- Banda de características -->
    <div class="feature-band">
        <div class="feature-item">
            <i class="fa-solid fa-gavel"></i>
            <span>Juez automático con veredicto en segundos</span>
        </div>
        <div class="fband-sep"></div>
        <div class="feature-item">
            <i class="fa-solid fa-chart-bar"></i>
            <span>Scoreboard en tiempo real</span>
        </div>
        <div class="fband-sep"></div>
        <div class="feature-item">
            <i class="fa-solid fa-code"></i>
            <span>Editor de código integrado</span>
        </div>
        <div class="fband-sep"></div>
        <div class="feature-item">
            <i class="fa-solid fa-lock"></i>
            <span>Acceso controlado por Coach</span>
        </div>
    </div>

</div>
`;
