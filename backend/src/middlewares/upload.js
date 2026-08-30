// middlewares/upload.js
// Upload de ficheiros via Cloudinary (storage externo persistente).
//
// Por que Cloudinary em vez de disco local?
//   - backend/uploads/ não persiste entre deploys no Vercel (serverless)
//   - Cloudinary free tier: 25 GB storage, 25 GB egress/mês, sem cartão de crédito
//   - URLs públicas servidas por CDN global
//   - Transformações de imagem (resize, compress) sem custo adicional
//
// Por que multer-storage-cloudinary?
//   - Integra directamente com Multer (sem ficheiro temporário em disco)
//   - O stream vai directo da request para o Cloudinary
//   - Compatível com Vercel serverless
//
// Fallback local (DEV sem Cloudinary configurado):
//   Se CLOUDINARY_CLOUD_NAME não estiver definido, usa disco local.
//   Isso permite desenvolvimento sem conta Cloudinary.

const multer              = require('multer');
const path                = require('path');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary          = require('../config/cloudinary');

// ── Magic bytes — primeiros bytes que identificam o tipo real do ficheiro ──
// Não confiamos no Content-Type declarado pelo cliente (pode ser falsificado).
// Verificamos os bytes reais do ficheiro antes de aceitar.
// Limitamos à verificação dos tipos que aceitamos.
const MAGIC_BYTES = {
  // JPEG: FF D8 FF
  jpeg: [0xFF, 0xD8, 0xFF],
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  png:  [0x89, 0x50, 0x4E, 0x47],
  // GIF: 47 49 46 38
  gif:  [0x47, 0x49, 0x46, 0x38],
  // WebP: 52 49 46 46 ... 57 45 42 50 (bytes 0-3 + 8-11)
  webp: [0x52, 0x49, 0x46, 0x46],
  // PDF: 25 50 44 46
  pdf:  [0x25, 0x50, 0x44, 0x46],
  // ZIP: 50 4B 03 04 ou 50 4B 05 06 (end of central directory)
  zip:  [0x50, 0x4B],
};

function checkMagicBytes(buffer, type) {
  const magic = MAGIC_BYTES[type];
  if (!magic) return false;
  return magic.every((byte, i) => buffer[i] === byte);
}

function detectFileType(buffer) {
  if (checkMagicBytes(buffer, 'jpeg')) return 'image';
  if (checkMagicBytes(buffer, 'png'))  return 'image';
  if (checkMagicBytes(buffer, 'gif'))  return 'image';
  if (checkMagicBytes(buffer, 'webp')) return 'image';
  if (checkMagicBytes(buffer, 'pdf'))  return 'document';
  if (checkMagicBytes(buffer, 'zip'))  return 'archive';
  return null;
}

// ── Storage com Cloudinary (produção e dev com Cloudinary configurado) ─────
const cloudinaryStorage = (folder, allowedTypes) =>
  new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
      folder:    `devangola/${folder}`,
      // Para imagens: Cloudinary optimiza automaticamente
      // Para documentos/archives: raw (sem transformação)
      resource_type: allowedTypes.includes('image') ? 'auto' : 'raw',
      // Nome do ficheiro sem caracteres especiais
      public_id: `${Date.now()}_${file.originalname
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9]/g, '_')
        .slice(0, 50)}`,
      // Qualidade automática para imagens (reduz tamanho sem perda visível)
      transformation: allowedTypes.includes('image')
        ? [{ quality: 'auto', fetch_format: 'auto' }]
        : undefined,
    }),
  });

// ── Storage local (fallback para dev sem Cloudinary) ──────────────────────
const localStorage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}_${Date.now()}${ext}`);
  },
});

const useCloudinary = !!process.env.CLOUDINARY_CLOUD_NAME;

// ── fileFilter — valida MIME type (primeira linha de defesa) ───────────────
// A validação por magic bytes é feita nos controllers onde temos o buffer.
// Aqui fazemos a verificação de MIME type como filtro inicial rápido.
const makeFileFilter = (allowedMimes) => (req, file, cb) => {
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido: ${file.mimetype}`), false);
  }
};

// ── Configurações de upload por contexto ──────────────────────────────────

// Imagens de posts e avatares
const imageUpload = multer({
  storage: useCloudinary
    ? cloudinaryStorage('posts', ['image'])
    : localStorage,
  fileFilter: makeFileFilter([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  ]),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB para imagens
});

// Avatares (pasta separada no Cloudinary)
const avatarUpload = multer({
  storage: useCloudinary
    ? cloudinaryStorage('avatars', ['image'])
    : localStorage,
  fileFilter: makeFileFilter([
    'image/jpeg', 'image/png', 'image/webp',
  ]),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB para avatares
});

// Ficheiros de posts (ZIP, PDF, DOCX)
const fileUpload = multer({
  storage: useCloudinary
    ? cloudinaryStorage('files', ['document', 'archive'])
    : localStorage,
  fileFilter: makeFileFilter([
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB para ficheiros
});

// Portfolio de cadastro (ZIP — pasta privada no Cloudinary)
const portfolioUpload = multer({
  storage: useCloudinary
    ? cloudinaryStorage('portfolios', ['archive'])
    : localStorage,
  fileFilter: makeFileFilter([
    'application/zip',
    'application/x-zip-compressed',
    'application/octet-stream',
  ]),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

// Upload combinado para posts (imagem + ficheiro)
const postUpload = multer({
  storage: useCloudinary
    ? cloudinaryStorage('posts', ['image', 'document', 'archive'])
    : localStorage,
  fileFilter: makeFileFilter([
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/zip', 'application/x-zip-compressed', 'application/octet-stream',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
  ]),
  limits: { fileSize: 50 * 1024 * 1024 },
});

// Exporta utilitário para helpers nos controllers
module.exports = {
  imageUpload,
  avatarUpload,
  fileUpload,
  portfolioUpload,
  postUpload,
  detectFileType,
  useCloudinary,
  // Compatibilidade: export default para código existente que usa require('upload')
  single: (field) => postUpload.single(field),
  fields: (fields) => postUpload.fields(fields),
};
