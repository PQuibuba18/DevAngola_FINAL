-- Migration 015: Adiciona colunas OCR à tabela de verificação
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS ocr_confidence INTEGER DEFAULT 0;
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS ocr_method     VARCHAR(50);
ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS ocr_reason     TEXT;
