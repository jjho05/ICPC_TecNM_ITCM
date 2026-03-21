// ══════════════════════════════════════════════════════
//  pdfService.js — Generador de Certificados de Participación
//  GAP 6: Certificados PDF oficiales con branding TecNM/ITCM
//  Requiere: jspdf (ya cargado en index.html)
// ══════════════════════════════════════════════════════

import { AuthState } from './authState.js';
import { supabase } from './supabaseClient.js';

/**
 * Genera y descarga un certificado de participación en PDF.
 * @param {string} emailAlumno - Correo del alumno
 * @param {string} concursoId  - ID del concurso
 */
export async function generarCertificado(emailAlumno, concursoId) {
    if (!window.jspdf?.jsPDF) {
        console.error('jsPDF no disponible');
        return false;
    }

    const { jsPDF } = window.jspdf;

    // 1. Obtener datos del concurso
    const concurso = await AuthState.db.getConcursoById(concursoId);
    if (!concurso) { console.error('Concurso no encontrado:', concursoId); return false; }

    // 2. Obtener datos del participante
    const { data: participante } = await supabase
        .from('icpc_participantes')
        .select('nombre, equipo')
        .eq('email', emailAlumno.toLowerCase())
        .eq('concurso_id', concursoId)
        .single();

    const nombre = participante?.nombre || emailAlumno;
    const equipo = participante?.equipo || '—';
    const fechaConcurso = concurso.fecha_inicio
        ? new Date(concurso.fecha_inicio).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('es-MX');

    // 3. Crear el PDF
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    const W = 297; // Ancho A4 landscape
    const H = 210; // Alto A4 landscape

    // Fondo azul institucional TecNM
    doc.setFillColor(27, 57, 106); // --tecnm-blue
    doc.rect(0, 0, W, H, 'F');

    // Banda dorada superior
    doc.setFillColor(200, 162, 8); // --tecnm-gold
    doc.rect(0, 0, W, 8, 'F');

    // Banda dorada inferior
    doc.rect(0, H - 8, W, 8, 'F');

    // Banda blanca decorativa izquierda
    doc.setFillColor(255, 255, 255);
    doc.rect(18, 15, 1.5, H - 30, 'F');

    // Banda blanca decorativa derecha
    doc.rect(W - 19.5, 15, 1.5, H - 30, 'F');

    // Título CERTIFICADO
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(200, 162, 8); // dorado
    doc.text('CERTIFICADO', W / 2, 38, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('DE PARTICIPACIÓN', W / 2, 50, { align: 'center' });

    // Línea divisora
    doc.setDrawColor(200, 162, 8);
    doc.setLineWidth(0.5);
    doc.line(50, 57, W - 50, 57);

    // Texto "Se otorga a:"
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(180, 200, 230);
    doc.text('Se otorga al equipo participante:', W / 2, 68, { align: 'center' });

    // Nombre del alumno / equipo
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(255, 255, 255);
    doc.text(nombre, W / 2, 83, { align: 'center' });

    // Equipo
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(200, 162, 8);
    doc.text(`Equipo: ${equipo}`, W / 2, 93, { align: 'center' });

    // Cuerpo del texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(180, 200, 230);
    const cuerpo = `Por su participación en el concurso de programación:`;
    doc.text(cuerpo, W / 2, 107, { align: 'center' });

    // Nombre del concurso
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    const tituloLines = doc.splitTextToSize(concurso.titulo, 200);
    doc.text(tituloLines, W / 2, 120, { align: 'center' });

    // Fecha
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(180, 200, 230);
    doc.text(`Celebrado el ${fechaConcurso}`, W / 2, 137, { align: 'center' });

    // Línea divisora final
    doc.setDrawColor(200, 162, 8);
    doc.line(50, 148, W - 50, 148);

    // Firma institucional
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('Instituto Tecnológico de Ciudad Madero', W / 2, 158, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 200, 230);
    doc.text('TecNM — Tecnológico Nacional de México', W / 2, 164, { align: 'center' });

    // Sello/código del certificado
    const codigo = `ISPC-${concursoId.slice(-6).toUpperCase()}-${emailAlumno.slice(0, 4).toUpperCase()}`;
    doc.setFontSize(8);
    doc.setTextColor(100, 130, 170);
    doc.text(`Folio: ${codigo}`, W - 20, H - 12, { align: 'right' });

    // Guardar PDF
    doc.save(`certificado_${nombre.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Obtiene la lista de concursos finalizados donde el alumno participó.
 * @param {string} emailAlumno
 * @returns {Promise<Array>}
 */
export async function getConcursosFinalizadosAlumno(emailAlumno) {
    const { data, error } = await supabase
        .from('icpc_participantes')
        .select('concurso_id')
        .eq('email', emailAlumno.toLowerCase());

    if (error || !data?.length) return [];

    const concursoIds = data.map(p => p.concurso_id);
    const { data: concursos } = await supabase
        .from('icpc_concursos')
        .select('id, titulo, fecha_inicio, estado')
        .in('id', concursoIds)
        .eq('estado', 'finalizado');

    return concursos || [];
}
