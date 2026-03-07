import { AuthState } from '../core/authState.js';
import { JudgeSim } from '../core/judgeSim.js';
import { PROBLEMS_SEED } from '../data/problemsSeed.js';

// ══════════════════════════════════════════════════════
//  Área de Práctica — Sandbox sin auth, sin scoreboard
// ══════════════════════════════════════════════════════

let practicaProblema = null;

export const PracticaView = () => {
    // Poblar db si está vacía (primer uso)
    if (AuthState.db.getProblemas().length === 0) {
        AuthState.db.saveProblemasLote(PROBLEMS_SEED);
    }

    setTimeout(() => {
        initPractica();
    }, 100);

    return `
    <div class="arena-layout practica-mode view-enter">
        <!-- Panel Izquierdo -->
        <aside class="arena-panel-left">
            <div class="practica-header-section">
                <div class="practica-badge">
                    <i class="fa-solid fa-flask"></i> Área de Práctica
                </div>
                <p class="practica-sub">Sin registro · Sin límite de tiempo · Sin scoreboard</p>
            </div>

            <!-- Filtros -->
            <div class="practica-filters">
                <input type="text" id="practica-search" class="practica-search-input" placeholder="🔍 Buscar por título o tag...">
                <div class="practica-filter-row">
                    <select id="practica-dif" class="practica-filter-select">
                        <option value="">Toda dificultad</option>
                        <option value="easy">Fácil (≤ 1000)</option>
                        <option value="medium">Medio (1001–1400)</option>
                        <option value="hard">Difícil (1400+)</option>
                    </select>
                    <select id="practica-tag" class="practica-filter-select">
                        <option value="">Todo tag</option>
                        <option value="math">Math</option>
                        <option value="strings">Strings</option>
                        <option value="graphs">Graphs</option>
                        <option value="dp">DP</option>
                        <option value="greedy">Greedy</option>
                        <option value="sorting">Sorting</option>
                        <option value="implementation">Implementation</option>
                    </select>
                </div>
            </div>

            <!-- Lista de problemas -->
            <div id="practica-prob-list" class="practica-prob-list"></div>

            <!-- Contenido del problema -->
            <div id="practica-prob-content" class="arena-prob-content">
                <div style="text-align:center;padding:2rem;color:rgba(255,255,255,.3);">
                    <i class="fa-solid fa-hand-pointer" style="font-size:1.5rem;display:block;margin-bottom:.5rem;"></i>
                    Selecciona un problema de la lista.
                </div>
            </div>
        </aside>

        <!-- Panel Derecho: Editor -->
        <main class="arena-editor-panel">
            <div class="arena-editor-toolbar">
                <div class="arena-user-info">
                    <i class="fa-solid fa-code" style="color:var(--tecnm-gold);"></i>
                    <span>Modo Práctica Libre</span>
                </div>
                <select id="practica-lang" class="arena-lang-select">
                    <option value="cpp">C++ 17</option>
                    <option value="java">Java 17</option>
                    <option value="python">Python 3</option>
                </select>
            </div>

            <div class="arena-editor-wrap">
                <div class="arena-line-nums" id="practica-line-nums">1</div>
                <textarea
                    id="practica-code"
                    class="code-editor arena-code"
                    spellcheck="false"
                    placeholder="// Escribe tu solución aquí..."
                ></textarea>
            </div>

            <div class="arena-editor-footer">
                <button class="btn-arena btn-arena--ghost" id="btn-practica-limpiar">
                    <i class="fa-solid fa-trash-can"></i> Limpiar
                </button>
                <button class="btn-arena btn-arena--ghost" id="btn-practica-probar" disabled>
                    <i class="fa-solid fa-play"></i> Probar
                </button>
                <button class="btn-arena btn-arena--gold" id="btn-practica-enviar" disabled>
                    <i class="fa-solid fa-check-circle"></i> Evaluar
                </button>
            </div>

            <!-- Panel de output -->
            <div id="practica-output-panel" class="arena-output-panel">
                <div class="arena-output-header">
                    <span id="practica-output-title">Output</span>
                    <span id="practica-verd-badge"></span>
                </div>
                <pre id="practica-output-pre" class="arena-output-pre">Selecciona un problema y escribe tu código.</pre>
            </div>
        </main>
    </div>`;
};

function initPractica() {
    renderPracticaList();

    document.getElementById('practica-search').addEventListener('input', renderPracticaList);
    document.getElementById('practica-dif').addEventListener('change', renderPracticaList);
    document.getElementById('practica-tag').addEventListener('change', renderPracticaList);
    document.getElementById('practica-code').addEventListener('input', updatePracticaLineNums);
    document.getElementById('btn-practica-limpiar').addEventListener('click', () => {
        document.getElementById('practica-code').value = '';
        updatePracticaLineNums();
    });
    document.getElementById('btn-practica-probar').addEventListener('click', () => probarPractica(false));
    document.getElementById('btn-practica-enviar').addEventListener('click', () => probarPractica(true));
}

function renderPracticaList() {
    const search = document.getElementById('practica-search')?.value?.toLowerCase() || '';
    const dif = document.getElementById('practica-dif')?.value || '';
    const tag = document.getElementById('practica-tag')?.value || '';

    // Combinar: banco local + db (problemas del admin/codeforces)
    const local = PROBLEMS_SEED;
    const db = AuthState.db.getProblemas().filter(p => p.id.startsWith('cf_') || p.fuente === 'admin');
    const todos = [...local, ...db.filter(dp => !local.find(l => l.id === dp.id))];

    const filtrado = todos.filter(p => {
        const matchSearch = !search || p.titulo.toLowerCase().includes(search) || (p.tags || []).join(' ').includes(search);
        const matchTag = !tag || (p.tags || []).includes(tag);
        const matchDif = !dif ||
            (dif === 'easy' && p.dificultad <= 1000) ||
            (dif === 'medium' && p.dificultad > 1000 && p.dificultad <= 1400) ||
            (dif === 'hard' && p.dificultad > 1400);
        return matchSearch && matchTag && matchDif;
    });

    const list = document.getElementById('practica-prob-list');
    if (!list) return;

    list.innerHTML = filtrado.slice(0, 80).map(p => `
        <button class="practica-prob-item ${practicaProblema?.id === p.id ? 'active' : ''}" data-pid="${p.id}">
            <div class="ppi-info">
                <span class="ppi-title">${p.titulo}</span>
                <span class="ppi-tags">${(p.tags || []).slice(0, 2).join(', ')}</span>
            </div>
            <span class="diff-badge diff-${p.dificultad <= 1000 ? 'facil' : p.dificultad <= 1400 ? 'medio' : 'dificil'}">${p.dificultad || '?'}</span>
        </button>`).join('') ||
        '<p style="color:rgba(255,255,255,.3);text-align:center;padding:1.5rem;">Sin resultados.</p>';

    list.querySelectorAll('.practica-prob-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const prob = PROBLEMS_SEED.find(p => p.id === btn.dataset.pid)
                || AuthState.db.getProblemaById(btn.dataset.pid);
            if (prob) seleccionarPracticaProblema(prob);
        });
    });
}

function seleccionarPracticaProblema(prob) {
    practicaProblema = prob;
    renderPracticaList();

    const content = document.getElementById('practica-prob-content');
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
            ${prob.desc}
            ${ejemplos ? `<h4 class="ejemplos-title">Ejemplos</h4>${ejemplos}` : ''}
        </div>`;

    document.getElementById('btn-practica-probar').disabled = false;
    document.getElementById('btn-practica-enviar').disabled = false;
    document.getElementById('practica-output-pre').textContent = 'Escribe tu código y presiona Probar o Evaluar.';
    document.getElementById('practica-verd-badge').innerHTML = '';
}

function probarPractica(esEvaluar) {
    if (!practicaProblema) return;
    const code = document.getElementById('practica-code').value;
    const lang = document.getElementById('practica-lang').value;

    const outputPanel = document.getElementById('practica-output-panel');
    const outputPre = document.getElementById('practica-output-pre');
    const verdBadge = document.getElementById('practica-verd-badge');
    const outputTitle = document.getElementById('practica-output-title');

    outputPanel.className = 'arena-output-panel loading';
    outputPre.textContent = '⏳ Evaluando...';
    verdBadge.innerHTML = '';

    setTimeout(() => {
        const resultado = esEvaluar
            ? JudgeSim.evaluate(code, lang, practicaProblema)
            : JudgeSim.run(code, lang, (practicaProblema.ejemplos || [{}])[0]);

        const veredicto = esEvaluar ? resultado.veredicto : (resultado.ok ? 'AC' : 'WA');
        outputPanel.className = `arena-output-panel vp-${veredicto.toLowerCase()}`;
        outputTitle.textContent = esEvaluar ? `Evaluación — ${resultado.tiempo_ms}ms` : 'Output (Ejemplo)';
        verdBadge.innerHTML = `<span class="verd-badge verd-${veredicto.toLowerCase()}">${veredicto}</span>`;
        outputPre.textContent = resultado.output || resultado.mensaje || '(sin salida)';
        // Práctica NO registra submissions — es sandbox
    }, 800);
}

function updatePracticaLineNums() {
    const code = document.getElementById('practica-code')?.value || '';
    const nums = document.getElementById('practica-line-nums');
    if (nums) nums.textContent = Array.from({ length: code.split('\n').length }, (_, i) => i + 1).join('\n');
}
