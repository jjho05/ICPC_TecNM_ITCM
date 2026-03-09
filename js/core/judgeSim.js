// ══════════════════════════════════════════════════════
//  JudgeSim — Evaluador simulado de código
//  Simula el comportamiento de un juez ICPC real:
//  Veredictos: AC | WA | TLE | MLE | RE | CE | PE
// ══════════════════════════════════════════════════════

// Colores y nombres en español para cada veredicto
export const VEREDICTOS = {
    AC: { nombre: 'Aceptado', color: '#22c55e', icon: 'fa-circle-check' },
    WA: { nombre: 'Respuesta Incorrecta', color: '#ef4444', icon: 'fa-circle-xmark' },
    TLE: { nombre: 'T\u00edmite de Tiempo', color: '#f59e0b', icon: 'fa-clock' },
    MLE: { nombre: 'L\u00edmite de Memoria', color: '#8b5cf6', icon: 'fa-memory' },
    RE: { nombre: 'Error de Ejecuci\u00f3n', color: '#f97316', icon: 'fa-bomb' },
    CE: { nombre: 'Error de Compilaci\u00f3n', color: '#6b7280', icon: 'fa-code' },
    PE: { nombre: 'Error de Presentaci\u00f3n', color: '#06b6d4', icon: 'fa-align-left' },
};

export const JudgeSim = {

    /**
     * Evalúa un envío y retorna un veredicto simulado.
     * @param {string} code     - Código fuente del alumno
     * @param {string} lang     - 'cpp' | 'java' | 'python'
     * @param {object} problema - Objeto del problema (casos_prueba o ejemplos)
     * @param {number} tiempoLimite - ms límite (default 2000)
     * @returns {{ veredicto, tiempo_ms, memoria_kb, output, mensaje, penaliza }}
     */
    evaluate(code, lang, problema, tiempoLimite = 2000) {

        // ── CE: Código vacío o sin estructura mínima ──────────────────
        if (!code || code.trim().length < 5) {
            return this._result('CE', 0, 0, '', 'Código fuente vacío o incompleto.', false);
        }
        const ceCheck = this._checkCompilationErrors(code, lang);
        if (ceCheck) return this._result('CE', 0, 0, '', ceCheck, false);

        // ── TLE: Loops infinitos detectable estáticamente ─────────────
        if (this._hasInfiniteLoop(code)) {
            return this._result('TLE', tiempoLimite + 1, 0, '', 'Tiempo límite excedido (posible bucle infinito).', true);
        }

        // ── Simular tiempo y memoria ──────────────────────────────────
        const tiempo_ms = Math.floor(Math.random() * 600) + 15;
        const memoria_kb = Math.floor(Math.random() * 40000) + 4096; // 4–44 MB

        // ── TLE: tiempo > límite (5% de probabilidad extra) ──────────
        if (tiempo_ms > tiempoLimite || Math.random() < 0.05) {
            return this._result('TLE', tiempoLimite + Math.floor(Math.random() * 500), memoria_kb, '', 'Tiempo límite excedido.', true);
        }

        // ── MLE: memoria excede 256 MB (3% de probabilidad) ──────────
        if (memoria_kb > 262144 || Math.random() < 0.03) {
            return this._result('MLE', tiempo_ms, 268000, '', 'Límite de memoria excedido (> 256 MB).', true);
        }

        // ── Resolver contra casos de prueba ───────────────────────────
        const casos = problema.casos_prueba?.length
            ? problema.casos_prueba
            : (problema.testcases || problema.ejemplos || []);

        if (!casos.length) {
            // Sin casos → AC si código no vacío
            return this._result('AC', tiempo_ms, memoria_kb, '(sin salida verificable)', '¡Código enviado exitosamente!', false);
        }

        // Evaluar todos los casos (hasta los primeros 5 para performance)
        for (let i = 0; i < Math.min(casos.length, 5); i++) {
            const tc = casos[i];
            const expected = (tc.salida_esperada || tc.output || tc.expected || '').trim();
            const simulated = this._simulateOutput(code, lang, tc.input || tc.entrada || '', expected);

            // RE: 8% de probabilidad si respuesta incorrecta
            if (!this._compareOutput(simulated, expected) && Math.random() < 0.08) {
                return this._result('RE', tiempo_ms, memoria_kb, simulated,
                    `Error de ejecución en caso ${i + 1}: segmentation fault / null pointer.`, true);
            }

            if (!this._compareOutput(simulated, expected)) {
                // PE: si la respuesta es "casi" correcta (espacios/newlines distintos)
                if (simulated.trim().replace(/\s+/g, ' ') === expected.trim().replace(/\s+/g, ' ')) {
                    return this._result('PE', tiempo_ms, memoria_kb, simulated,
                        `Error de presentación en caso ${i + 1}: formato de salida incorrecto (espacios/newlines).`, true);
                }
                return this._result('WA', tiempo_ms, memoria_kb, simulated,
                    `Respuesta incorrecta en caso ${i + 1}.`, true);
            }
        }

        return this._result('AC', tiempo_ms, memoria_kb,
            casos[0] ? (casos[0].salida_esperada || casos[0].output || casos[0].expected || '') : '',
            '¡Respuesta Correcta! Todos los casos de prueba pasaron.', false);
    },

    /**
     * Modo "Probar" — Solo ejecuta contra el primer ejemplo visible, sin guardar.
     */
    run(code, lang, ejemplo) {
        if (!code || code.trim().length < 5) {
            return { output: '-- Error de compilación: código vacío --', ok: false };
        }
        const ceCheck = this._checkCompilationErrors(code, lang);
        if (ceCheck) return { output: `-- Error de compilación: ${ceCheck} --`, ok: false };

        const expected = (ejemplo.salida_esperada || ejemplo.output || ejemplo.expected || '').trim();
        const simulated = this._simulateOutput(code, lang, ejemplo.input || ejemplo.entrada || '', expected);
        const ok = this._compareOutput(simulated, expected);
        return { output: simulated, ok };
    },

    // ── Internos ─────────────────────────────────────────────────────

    _result(veredicto, tiempo_ms, memoria_kb, output, mensaje, penaliza) {
        return { veredicto, tiempo_ms, memoria_kb, output, mensaje, penaliza };
    },

    _checkCompilationErrors(code, lang) {
        if (lang === 'cpp') {
            if (!code.includes('main')) return 'No se encontró función main().';
            if ((code.match(/{/g) || []).length !== (code.match(/}/g) || []).length) return 'Llaves {} no balanceadas.';
        }
        if (lang === 'java') {
            if (!code.includes('class')) return 'No se encontró definición de clase.';
            if (!code.includes('main')) return 'No se encontró método main.';
        }
        if (lang === 'python') {
            const indentError = / {1,3}[^\s]/.test(code) && !/^( {4}|\t)/.test(code.split('\n').find(l => l.startsWith(' ')) || '');
            if (indentError && code.includes(':') && !code.startsWith('#')) return 'Posible error de indentación.';
        }
        return null;
    },

    _hasInfiniteLoop(code) {
        return [
            /while\s*\(\s*true\s*\)/i,
            /while\s*\(\s*1\s*\)/,
            /for\s*\(\s*;\s*;\s*\)/,
            /while True:/
        ].some(p => p.test(code));
    },

    _simulateOutput(code, lang, input, expected) {
        const exp = (expected || '').trim();
        // Si el código hardcodea literalmente la respuesta → AC simulado
        if (exp && code.includes(exp)) return exp;

        const hasArith = /[+\-*\/]/.test(code);
        const hasIO = /print|cout|System\.out|printf|scanf|input|cin/.test(code);

        if (hasIO && exp) {
            // 65% de AC si el código parece completo y tiene I/O+aritmética
            const prob = hasArith ? 0.65 : 0.45;
            return Math.random() < prob ? exp : this._mutateOutput(exp);
        }
        return exp ? this._mutateOutput(exp) : '0';
    },

    _mutateOutput(str) {
        const n = parseInt(str);
        if (!isNaN(n)) return String(n + (Math.random() > 0.5 ? 1 : -1));
        if (str.toLowerCase() === 'yes') return 'No';
        if (str.toLowerCase() === 'no') return 'Yes';
        if (str.toLowerCase() === 'si') return 'No';
        const lines = str.split('\n');
        if (lines.length > 1) return lines.slice(0, -1).join('\n'); // Quitar última línea
        return str.split('').reverse().join('');
    },

    _compareOutput(actual, expected) {
        if (!actual && !expected) return true;
        if (!actual || !expected) return false;
        return actual.trim().toLowerCase() === expected.trim().toLowerCase();
    }
};
