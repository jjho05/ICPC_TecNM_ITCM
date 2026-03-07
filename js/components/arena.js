import { AuthState } from '../core/authState.js';
import { JudgeSim } from '../core/judgeSim.js';
import { ConcursoSecurity } from '../core/concursoSecurity.js';
import { UIModal } from './ui/modal.js';

// ══════════════════════════════════════════════════════
//  La Arena — Editor de código + Juez + Scoreboard
// ══════════════════════════════════════════════════════

let arenaTimer = null;
let concursoEndTime = null;
let problemaActivo = null;

export const ArenaView = () => {
    setTimeout(async () => {
        if (!AuthState.isAlumno()) { window.router.navigate('/'); return; }

        // Activar Seguridad
        ConcursoSecurity.init();

        const goFullscreen = await UIModal.confirm(
            '🛡️ Modo Concurso Activado',
            'Esta competencia requiere Pantalla Completa obligatoria. No podrás copiar, pegar ni salir de la pestaña sin ser detectado. ¿Deseas entrar?'
        );

        if (goFullscreen) {
            await ConcursoSecurity.requestFullscreen();
            initArena();
        } else {
            ConcursoSecurity.destroy();
            window.router.navigate('/');
        }

        // Detectar si sale de fullscreen para alertar
        ConcursoSecurity.handleFullscreenExit(() => {
            if (ConcursoSecurity.isActive) {
                UIModal.alert('⚠️ Alerta de Seguridad', 'Has salido de la pantalla completa. Por favor re-ingresa para continuar con el concurso.');
            }
        });

        // Cleanup al salir de la ruta (se maneja en el router globalmente mejor, 
        // pero aquí añadimos un listener de seguridad)
        const onNav = () => {
            if (window.location.pathname !== '/arena') {
                ConcursoSecurity.destroy();
                window.removeEventListener('popstate', onNav);
            }
        };
        window.addEventListener('popstate', onNav);
    }, 100);

    return `
    <div class="arena-layout view-enter">
        <header class="arena-topbar">
        <!-- Panel Izquierdo -->
        <aside class="arena-panel-left">
            <div class="arena-panel-tabs">
                <button class="apanel-tab active" data-apanel="ap-problema">Problema</button>
                <button class="apanel-tab" data-apanel="ap-ranking">Ranking</button>
            </div>

            <div id="ap-problema" class="apanel-content">
                <div id="arena-timer" class="arena-timer">⏱ --:--:--</div>
                <div id="arena-prob-list" class="arena-prob-list"></div>
                <div id="arena-prob-content" class="arena-prob-content">
                    <p style="color:rgba(255,255,255,.3);text-align:center;padding:3rem;">
                        Selecciona un problema de la lista.
                    </p>
                </div>
            </div>

            <div id="ap-ranking" class="apanel-content" style="display:none;">
                <div id="arena-scoreboard"></div>
            </div>
        </aside>

        <!-- Panel Derecho: Editor -->
        <main class="arena-editor-panel">
            <div class="arena-editor-toolbar">
                <div class="arena-user-info">
                    <i class="fa-solid fa-terminal" style="color:var(--tecnm-gold);"></i>
                    <span id="arena-team-name">—</span>
                </div>
                <select id="arena-lang" class="arena-lang-select">
                    <option value="cpp">C++ 17</option>
                    <option value="java">Java 17</option>
                    <option value="python">Python 3</option>
                </select>
            </div>

            <div class="arena-editor-wrap">
                <div class="arena-line-nums" id="arena-line-nums">1</div>
                <textarea
                    id="arena-code"
                    class="code-editor arena-code"
                    spellcheck="false"
                    placeholder="// Escribe tu solución aquí..."
                ></textarea>
            </div>

            <div class="arena-editor-footer">
                <button class="btn-arena btn-arena--ghost" id="btn-arena-probar">
                    <i class="fa-solid fa-play"></i> Probar
                </button>
                <button class="btn-arena btn-arena--gold" id="btn-arena-enviar" disabled>
                    <i class="fa-solid fa-paper-plane"></i> Enviar
                </button>
            </div>

            <!-- Panel de veredicto/output -->
            <div id="arena-output-panel" class="arena-output-panel">
                <div class="arena-output-header">
                    <span id="arena-output-title">Output</span>
                    <span id="arena-verd-badge"></span>
                </div>
                <pre id="arena-output-pre" class="arena-output-pre">
Selecciona un problema y escribe tu código.</pre>
            </div>
        </main>
    </div>`;
};

function initArena() {
    const concurso = AuthState.db.getConcursoActivo();
    if (!concurso) {
        document.getElementById('arena-prob-content').innerHTML = `
            <div style="text-align:center;padding:3rem;color:rgba(255,255,255,.35);">
                <i class="fa-solid fa-lock" style="font-size:2rem;margin-bottom:1rem;display:block;"></i>
                No hay concurso activo en este momento.<br>
                <button onclick="window.router.navigate('/')" class="btn-arena btn-arena--ghost" style="margin-top:1rem;">
                    Volver al Inicio
                </button>
            </div>`;
        return;
    }

    // Mostrar nombre de equipo
    document.getElementById('arena-team-name').textContent =
        `${AuthState.user.team || AuthState.user.email}`;

    // Cargar problemas del concurso
    const problemas = (concurso.problemas || []).map(id => AuthState.db.getProblemaById(id)).filter(Boolean);
    renderProbList(problemas);

    if (problemas.length) {
        seleccionarProblema(problemas[0]);
        document.getElementById('btn-arena-enviar').disabled = false;
    }

    // Timer
    if (concurso.duracion_min && concurso.inicio_ts) {
        const fin = new Date(concurso.inicio_ts).getTime() + concurso.duracion_min * 60000;
        concursoEndTime = fin;
        actualizarTimer();
        arenaTimer = setInterval(actualizarTimer, 1000);
    }

    // Tabs
    document.querySelectorAll('.apanel-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.apanel-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.apanel-content').forEach(c => c.style.display = 'none');
            const target = document.getElementById(btn.dataset.apanel);
            if (target) { target.style.display = 'block'; }
            if (btn.dataset.apanel === 'ap-ranking') renderArenaScoreboard(concurso);
        });
    });

    // Botones
    document.getElementById('btn-arena-probar').addEventListener('click', () => probarCodigo(false));
    document.getElementById('btn-arena-enviar').addEventListener('click', () => probarCodigo(true));

    // Line numbers
    document.getElementById('arena-code').addEventListener('input', updateLineNums);

    updateLineNums();
}

function renderProbList(problemas) {
    const list = document.getElementById('arena-prob-list');
    if (!list) return;
    list.innerHTML = problemas.map((p, i) => `
        <button class="arena-prob-btn" data-pid="${p.id}">
            <span class="prob-letter">${String.fromCharCode(65 + i)}</span>
            <span class="prob-name">${p.titulo}</span>
            <span class="diff-small">${p.dificultad || ''}</span>
        </button>`).join('');

    list.querySelectorAll('.arena-prob-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const prob = AuthState.db.getProblemaById(btn.dataset.pid);
            if (prob) {
                list.querySelectorAll('.arena-prob-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                seleccionarProblema(prob);
            }
        });
    });
}

function seleccionarProblema(prob) {
    problemaActivo = prob;
    const content = document.getElementById('arena-prob-content');
    if (!content) return;

    const ejemplos = (prob.ejemplos || []).slice(0, 2).map(ej => `
        <div class="ejemplo-block">
            <div class="ejemplo-col">
                <div class="ejemplo-header">Input</div>
                <pre class="ejemplo-pre">${ej.input}</pre>
            </div>
            <div class="ejemplo-col">
                <div class="ejemplo-header">Output</div>
                <pre class="ejemplo-pre">${ej.output}</pre>
            </div>
        </div>`).join('');

    content.innerHTML = `
        <div class="prob-render">
            ${prob.desc || '<p>Sin descripción.</p>'}
            ${ejemplos ? `<h4 class="ejemplos-title">Ejemplos</h4>${ejemplos}` : ''}
        </div>`;

    // Actualizar output panel
    document.getElementById('arena-output-pre').textContent = 'Escribe tu código y presiona Probar o Enviar.';
    document.getElementById('arena-verd-badge').innerHTML = '';
}

function probarCodigo(esEnvio) {
    if (!problemaActivo) {
        alert('Selecciona un problema primero.'); return;
    }
    const code = document.getElementById('arena-code').value;
    const lang = document.getElementById('arena-lang').value;

    const outputPanel = document.getElementById('arena-output-panel');
    const outputPre = document.getElementById('arena-output-pre');
    const verdBadge = document.getElementById('arena-verd-badge');
    const outputTitle = document.getElementById('arena-output-title');

    outputPanel.className = 'arena-output-panel loading';
    outputPre.textContent = '⏳ Evaluando...';
    verdBadge.innerHTML = '';

    setTimeout(() => {
        const resultado = esEnvio
            ? JudgeSim.evaluate(code, lang, problemaActivo)
            : JudgeSim.run(code, lang, (problemaActivo.ejemplos || [{}])[0]);

        const veredicto = esEnvio ? resultado.veredicto : (resultado.ok ? 'AC' : 'WA');
        outputPanel.className = `arena-output-panel vp-${veredicto.toLowerCase()}`;
        outputTitle.textContent = esEnvio ? `Envío — ${resultado.tiempo_ms}ms` : 'Probar (Ejemplo)';
        verdBadge.innerHTML = `<span class="verd-badge verd-${veredicto.toLowerCase()}">${veredicto}</span>`;
        outputPre.textContent = resultado.output || resultado.mensaje || '(sin salida)';

        if (esEnvio && AuthState.isAlumno()) {
            const concurso = AuthState.db.getConcursoActivo();
            AuthState.db.addSubmission({
                alumno_email: AuthState.user.email,
                equipo: AuthState.user.team || AuthState.user.email,
                problema_id: problemaActivo.id,
                concurso_id: concurso?.id,
                veredicto,
                tiempo_ms: resultado.tiempo_ms
            });
        }
    }, 800);
}

function actualizarTimer() {
    const el = document.getElementById('arena-timer');
    if (!el || !concursoEndTime) return;
    const diff = concursoEndTime - Date.now();
    if (diff <= 0) {
        el.textContent = '⏱ 00:00:00';
        el.style.color = '#ef4444';
        clearInterval(arenaTimer);
        document.getElementById('btn-arena-enviar').disabled = true;
        document.getElementById('btn-arena-enviar').textContent = 'Tiempo agotado';
        return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `⏱ ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    el.style.color = diff < 600000 ? '#f59e0b' : '';
}

function updateLineNums() {
    const code = document.getElementById('arena-code')?.value || '';
    const lines = code.split('\n').length;
    const nums = document.getElementById('arena-line-nums');
    if (nums) nums.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}

function renderArenaScoreboard(concurso) {
    const wrap = document.getElementById('arena-scoreboard');
    if (!wrap) return;
    const problemas = (concurso.problemas || []).map(id => AuthState.db.getProblemaById(id)).filter(Boolean);
    const subs = AuthState.db.getSubmissionsByConcurso(concurso.id);

    const equipos = {};
    subs.forEach(s => {
        if (!equipos[s.equipo]) equipos[s.equipo] = { probs: {}, total: 0 };
        if (!equipos[s.equipo].probs[s.problema_id]) equipos[s.equipo].probs[s.problema_id] = false;
        if (s.veredicto === 'AC') { equipos[s.equipo].probs[s.problema_id] = true; equipos[s.equipo].total++; }
    });

    const rows = Object.entries(equipos).sort((a, b) => b[1].total - a[1].total);
    if (!rows.length) { wrap.innerHTML = '<p style="color:rgba(255,255,255,.3);padding:2rem;text-align:center;">Sin submissions.</p>'; return; }

    wrap.innerHTML = `<table class="scoreboard-table arena-score-sm">
        <thead><tr><th>#</th><th>Equipo</th>${problemas.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}<th>AC</th></tr></thead>
        <tbody>${rows.map(([eq, data], i) => `
            <tr class="${i === 0 ? 'rank-1' : ''}">
                <td>${i + 1}</td><td>${eq}</td>
                ${problemas.map(p => `<td class="${data.probs[p.id] ? 'sb-ac' : 'sb-empty'}">${data.probs[p.id] ? '✓' : '—'}</td>`).join('')}
                <td class="sb-total">${data.total}</td>
            </tr>`).join('')}
        </tbody></table>`;
}
