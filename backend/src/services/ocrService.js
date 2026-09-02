// services/ocrService.js
// Chama o script Python de OCR para analisar documentos de BI
// Gratuito — usa Tesseract localmente, sem API externa

const { spawn } = require('child_process');
const path      = require('path');
const fs        = require('fs');

const SCRIPT = path.join(__dirname, 'ocr', 'analyze_bi.py');
const TIMEOUT = 60000; // 60s — PDFs com múltiplas páginas podem demorar

/**
 * Analisa um ficheiro e verifica se é um BI angolano
 * @param {string} filePath - caminho local do ficheiro
 * @returns {Promise<{is_angolan, confidence, method, reason, keywords_found}>}
 */
function analyzeBI(filePath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(filePath)) {
      return resolve({ success: false, is_angolan: false, confidence: 0,
        reason: 'Ficheiro não encontrado para análise OCR.' });
    }

    const proc = spawn('python3', [SCRIPT, filePath], {
      timeout: TIMEOUT,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        console.error('[ocr] Script terminou com código', code, stderr?.slice(0, 200));
        return resolve({ success: false, is_angolan: false, confidence: 0,
          reason: 'Erro interno no OCR.', method: 'error' });
      }

      try {
        const result = JSON.parse(stdout.trim());
        return resolve(result);
      } catch {
        return resolve({ success: false, is_angolan: false, confidence: 0,
          reason: 'Resposta inválida do OCR.', method: 'error' });
      }
    });

    proc.on('error', (err) => {
      console.error('[ocr] Erro ao iniciar Python:', err.message);
      resolve({ success: false, is_angolan: false, confidence: 0,
        reason: 'Python3 não disponível no servidor.', method: 'error' });
    });
  });
}

module.exports = { analyzeBI };
