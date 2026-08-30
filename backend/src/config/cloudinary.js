// config/cloudinary.js
// Configura e exporta a instância do Cloudinary.
// Credenciais sempre lidas de variáveis de ambiente — nunca hardcoded.

const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true, // sempre HTTPS
});

// Valida no startup que as variáveis estão definidas
if (!process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY    ||
    !process.env.CLOUDINARY_API_SECRET) {
  console.warn(
    '[cloudinary] ATENÇÃO: variáveis CLOUDINARY_* não definidas. ' +
    'Uploads não funcionarão correctamente.'
  );
}

module.exports = cloudinary;
