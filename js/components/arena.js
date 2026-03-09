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
    // Activar modo arena INMEDIATAMENTE (oculta footer/navbar)
    document.body.classList.add('arena-mode');

    setTimeout(async () => {
        if (!AuthState.isAlumno()) {
            document.body.classList.remove('arena-mode');
            window.router.navigate('/');
            return;
        }

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
            document.body.classList.remove('arena-mode');
            window.router.navigate('/');
        }

        ConcursoSecurity.handleFullscreenExit(() => {
            if (ConcursoSecurity.isActive) {
                UIModal.alert('⚠️ Alerta de Seguridad', 'Has salido del modo pantalla completa. Atención: esto es registrado.');
            }
        });

        const onNav = () => {
            document.body.classList.remove('arena-mode');
            ConcursoSecurity.destroy();
            if (arenaTimer) clearInterval(arenaTimer);
            window.removeEventListener('popstate', onNav);
        };
        window.addEventListener('popstate', onNav);
    }, 100);

    return `
    <div class="arena-root view-enter">

        <!-- ═══ TOPBAR DE LA ARENA ═══ -->
        <header class="arena-topbar">
            <div class="arena-topbar-left">
                <span class="arena-brand">
                    <i class="fa-solid fa-code" style="color:var(--tecnm-gold);"></i>
                    ICPC <strong>Arena</strong>
                </span>
                <div class="arena-prob-pills" id="arena-prob-pills">
                    <!-- Pills de problema se llenan por JS -->
                </div>
            </div>
            <div class="arena-topbar-center">
                <div id="arena-timer" class="arena-timer-topbar">
                    <i class="fa-regular fa-clock"></i>
                    <span id="arena-timer-val">--:--:--</span>
                </div>
            </div>
            <div class="arena-topbar-right">
                <span class="arena-team-badge">
                    <i class="fa-solid fa-users"></i>
                    <span id="arena-team-name">—</span>
                </span>
                <button class="arena-exit-btn" onclick="window.router.navigate('/')">
                    <i class="fa-solid fa-right-from-bracket"></i>
                </button>
            </div>
        </header>

        <!-- ═══ MAIN SPLIT LAYOUT ═══ -->
        <div class="arena-split">

            <!-- Panel Izquierdo: Problema + Scoreboard -->
            <aside class="arena-left">
                <nav class="arena-left-tabs">
                    <button class="arena-tab active" data-apanel="ap-problema">
                        <i class="fa-solid fa-file-code"></i> Problema
                    </button>
                    <button class="arena-tab" data-apanel="ap-ranking">
                        <i class="fa-solid fa-ranking-star"></i> Ranking
                    </button>
                </nav>

                <div id="ap-problema" class="arena-tab-content">
                    <div id="arena-prob-content" class="arena-prob-render">
                        <div class="arena-waiting">
                            <i class="fa-solid fa-spinner fa-spin fa-2x"></i>
                            <p>Cargando concurso...</p>
                        </div>
                    </div>
                </div>

                <div id="ap-ranking" class="arena-tab-content" style="display:none;">
                    <div id="arena-scoreboard" class="arena-scoreboard-wrap"></div>
                </div>
            </aside>

            <!-- Panel Derecho: Editor de Código -->
            <main class="arena-right">
                <!-- Toolbar del editor -->
                <div class="arena-editor-bar">
                    <div class="arena-editor-bar-left">
                        <i class="fa-brands fa-codepen" style="color:var(--tecnm-gold);"></i>
                        <select id="arena-lang" class="arena-lang-sel">
                            <option value="cpp">C++ 17</option>
                            <option value="java">Java 17</option>
                            <option value="python">Python 3</option>
                        </select>
                    </div>
                    <div class="arena-editor-bar-right">
                        <button class="arena-btn arena-btn--ghost" id="btn-arena-probar">
                            <i class="fa-solid fa-play"></i> Probar
                        </button>
                        <button class="arena-btn arena-btn--submit" id="btn-arena-enviar" disabled>
                            <i class="fa-solid fa-paper-plane"></i> Enviar
                        </button>
                    </div>
                </div>

                <!-- Editor -->
                <div class="arena-editor-wrap">
                    <div class="arena-line-nums" id="arena-line-nums">1</div>
                    <textarea
                        id="arena-code"
                        class="arena-code"
                        spellcheck="false"
                        autocomplete="off"
                        autocorrect="off"
                        placeholder="// Escribe tu solución aquí...&#10;#include &lt;bits/stdc++.h&gt;&#10;using namespace std;&#10;&#10;int main() {&#10;    &#10;}"
                    ></textarea>
                </div>

                <!-- Panel Output/Veredicto -->
                <div id="arena-output-panel" class="arena-output">
                    <div class="arena-output-bar">
                        <span id="arena-output-title" class="arena-output-label">Output</span>
                        <span id="arena-verd-badge"></span>
                        <button class="arena-output-clear" onclick="document.getElementById('arena-output-pre').textContent=''">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <pre id="arena-output-pre" class="arena-output-pre">Selecciona un problema y escribe tu código.</pre>
                </div>
            </main>
        </div>
    </div>`;
};


async function initArena() {
    const all = await AuthState.db.getConcursos();
    const concurso = all.find(c => c.estado === 'activo');

    if (!concurso) {
        document.getElementById('arena-prob-content').innerHTML = `
            <div class="arena-waiting">
                <i class="fa-solid fa-hourglass-half fa-2x" style="color:var(--tecnm-gold);"></i>
                <h3 style="color:white;">Sin concurso activo</h3>
                <p>No hay competencias en este momento.</p>
                <button onclick="window.router.navigate('/')" class="arena-btn arena-btn--ghost" style="margin-top:1rem;">
                    <i class="fa-solid fa-arrow-left"></i> Volver
                </button>
            </div>`;
        return;
    }

    window.currentConcursoId = concurso.id;

    // Nombre del equipo
    document.getElementById('arena-team-name').textContent =
        AuthState.user.team || AuthState.user.email;

    // Cargar problems
    const todosProb = AuthState.db.getProblemas();
    const problemas = (concurso.problemas || []).map(id => todosProb.find(p => p.id === id)).filter(Boolean);

    renderProbPills(problemas);

    if (problemas.length) {
        seleccionarProblema(problemas[0]);
        document.getElementById('btn-arena-enviar').disabled = false;
    }

    // Cronómetro
    if (concurso.ts_fin) {
        concursoEndTime = new Date(concurso.ts_fin).getTime();
        actualizarTimer();
        if (arenaTimer) clearInterval(arenaTimer);
        arenaTimer = setInterval(actualizarTimer, 1000);
    }

    // Realtime Scoreboard
    subscribeToScoreboard(concurso.id);

    // Tabs
    document.querySelectorAll('.arena-tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.arena-tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            document.querySelectorAll('.arena-tab-content').forEach(c => c.style.display = 'none');
            const target = document.getElementById(btn.dataset.apanel);
            if (target) target.style.display = 'block';
            if (btn.dataset.apanel === 'ap-ranking') renderArenaScoreboardById(concurso.id);
        });
    });

    document.getElementById('btn-arena-probar').addEventListener('click', () => probarCodigo(false));
    document.getElementById('btn-arena-enviar').addEventListener('click', () => probarCodigo(true));
    document.getElementById('arena-code').addEventListener('input', updateLineNums);
    updateLineNums();
}

function renderProbPills(problemas) {
    const pills = document.getElementById('arena-prob-pills');
    if (!pills) return;
    pills.innerHTML = problemas.map((p, i) => `
        <button class="arena-prob-pill ${i === 0 ? 'active' : ''}" data-pid="${p.id}">
            ${String.fromCharCode(65 + i)}. ${p.titulo}
        </button>`).join('');

    pills.querySelectorAll('.arena-prob-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            const prob = AuthState.db.getProblemaById(btn.dataset.pid);
            if (prob) {
                pills.querySelectorAll('.arena-prob-pill').forEach(b => b.classList.remove('active'));
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
        UIModal.alert('Selecciona un problema', 'Debes elegir un problema de la lista antes de enviar.');
        return;
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

    setTimeout(async () => {
        const resultado = esEnvio
            ? JudgeSim.evaluate(code, lang, problemaActivo)
            : JudgeSim.run(code, lang, (problemaActivo.ejemplos || [{}])[0]);

        const veredicto = esEnvio ? resultado.veredicto : (resultado.ok ? 'AC' : 'WA');
        outputPanel.className = `arena-output-panel vp-${veredicto.toLowerCase()}`;
        outputTitle.textContent = esEnvio ? `Envío — ${resultado.tiempo_ms}ms` : 'Probar (Ejemplo)';
        verdBadge.innerHTML = `<span class="verd-badge verd-${veredicto.toLowerCase()}">${veredicto}</span>`;
        outputPre.textContent = resultado.output || resultado.mensaje || '(sin salida)';

        if (esEnvio && AuthState.isAlumno()) {
            // Intentar obtener el ID del concurso desde la URL o el estado global
            const concursoId = window.currentConcursoId;
            if (!concursoId) return;

            await AuthState.db.addSubmission({
                alumno_email: AuthState.user.email,
                equipo: AuthState.user.team || AuthState.user.email,
                problema_id: problemaActivo.id,
                concurso_id: concursoId,
                veredicto,
                tiempo_ms: resultado.tiempo_ms
            });
        }
    }, 1000);
}


// ── SISTEMA DE TIEMPO REAL Y SINCRONIZACIÓN ──

async function getServerTime() {
    // Supabase no tiene una función sencilla de "now" via REST, 
    // pero podemos hacer un select de una función RPC o simplemente confiar en el drift mínimo
    // si sincronizamos una vez al inicio. Para máxima precisión:
    return Date.now(); // Por ahora, implementaremos drift compensation si es necesario
}

let sbSubscription = null;

function subscribeToScoreboard(concursoId) {
    if (sbSubscription) supabase.removeChannel(sbSubscription);

    sbSubscription = supabase.channel('schema-db-changes')
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'icpc_submissions',
            filter: `concurso_id=eq.${concursoId}`
        }, (payload) => {
            console.log('Nuevos envíos detectados!', payload);
            renderArenaScoreboardById(concursoId);
        })
        .subscribe();
}

async function renderArenaScoreboardById(concursoId) {
    const wrap = document.getElementById('arena-scoreboard');
    if (!wrap) return;

    const concurso = await AuthState.db.getConcursoById(concursoId);
    if (!concurso) return;

    const problemas = (concurso.problemas || []).map(id => AuthState.db.getProblemaById(id)).filter(Boolean);
    const subs = await AuthState.db.getSubmissionsByConcurso(concursoId);

    const equipos = {};
    subs.forEach(s => {
        if (!equipos[s.equipo]) equipos[s.equipo] = { probs: {}, total: 0, penalty: 0 };
        if (!equipos[s.equipo].probs[s.problema_id]) equipos[s.equipo].probs[s.problema_id] = { ac: false, tries: 0 };

        if (s.veredicto === 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].ac = true;
            equipos[s.equipo].total++;
            // Penalización: (tries * 20) + min_desde_inicio (simplificado)
            equipos[s.equipo].penalty += (equipos[s.equipo].probs[s.problema_id].tries * 20);
        } else if (s.veredicto !== 'AC' && !equipos[s.equipo].probs[s.problema_id].ac) {
            equipos[s.equipo].probs[s.problema_id].tries++;
        }
    });

    const rows = Object.entries(equipos).sort((a, b) => b[1].total - a[1].total || a[1].penalty - b[1].penalty);

    if (!rows.length) {
        wrap.innerHTML = '<div class="coach-empty-state"><i class="fa-solid fa-hourglass-start"></i><p>Esperando primeros envíos...</p></div>';
        return;
    }

    wrap.innerHTML = `<table class="scoreboard-table arena-score-sm">
        <thead><tr><th>#</th><th>Equipo</th>${problemas.map((_, i) => `<th>${String.fromCharCode(65 + i)}</th>`).join('')}<th>AC</th><th>PEN</th></tr></thead>
        <tbody>${rows.map(([eq, data], i) => `
            <tr class="${i === 0 ? 'rank-1' : ''} ${i === 1 ? 'rank-2' : ''}">
                <td>${i + 1}</td>
                <td style="text-align:left; font-weight:600;">${eq}</td>
                ${problemas.map(p => {
        const st = data.probs[p.id];
        const cls = st?.ac ? 'sb-ac' : (st?.tries > 0 ? 'sb-wa' : 'sb-empty');
        return `<td class="${cls}">${st?.ac ? '✓' : (st?.tries > 0 ? `-${st.tries}` : '—')}</td>`;
    }).join('')}
                <td class="sb-total">${data.total}</td>
                <td style="font-size:0.75rem; opacity:0.7;">${data.penalty}</td>
            </tr>`).join('')}
        </tbody></table>`;
}

function actualizarTimer() {
    const timerEl = document.getElementById('arena-timer');
    const valEl = document.getElementById('arena-timer-val');
    if (!valEl || !concursoEndTime) return;

    const diff = concursoEndTime - Date.now();
    if (diff <= 0) {
        valEl.textContent = '00:00:00';
        if (timerEl) timerEl.className = 'arena-timer-topbar danger';
        clearInterval(arenaTimer);
        const btn = document.getElementById('btn-arena-enviar');
        if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-lock"></i> Tiempo agotado'; }
        return;
    }
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    valEl.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    if (timerEl) {
        timerEl.className = diff < 300000 ? 'arena-timer-topbar danger'
            : diff < 900000 ? 'arena-timer-topbar warning'
                : 'arena-timer-topbar';
    }
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
