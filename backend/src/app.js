require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app  = express();
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

// ── Validação de variáveis de ambiente no startup ─────────────────────────
const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('[startup] Variáveis de ambiente em falta:', missing.join(', '));
  process.exit(1);
}

// ── Logger mínimo — sem stacks em produção, sem secrets nos logs ──────────
function log(level, msg, meta = {}) {
  const entry = {
    ts:    new Date().toISOString(),
    level,
    msg,
    // Nunca loga req.body nem headers completos (podem conter passwords/tokens)
    ...meta,
  };
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (!isProd) {
    console.log(JSON.stringify(entry));
  }
}

// Exporta log para uso nos controllers
app.set('log', log);

// ── Helmet — security headers HTTP ───────────────────────────────────────
// Adiciona: X-DNS-Prefetch-Control, X-Frame-Options, X-Content-Type-Options,
//           Referrer-Policy, X-XSS-Protection, HSTS (em HTTPS)
// crossOriginResourcePolicy: permite que o frontend (outro domínio) carregue
// imagens/recursos servidos pela API
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// ── CORS ──────────────────────────────────────────────────────────────────
const allowed = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: (o, cb) => (!o || allowed.includes(o)) ? cb(null, true) : cb(new Error('CORS')),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate limiting ─────────────────────────────────────────────────────────
// Rate limit global — protecção base contra DDoS/spam
const globalLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              200,             // 200 requests por IP por janela
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Muitas requisições. Tenta novamente em 15 minutos.' },
  skip: (req) => req.path === '/api/health', // health check não limita
});

// Rate limit de autenticação — mais restritivo para prevenir brute force
const authLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutos
  max:              10,              // 10 tentativas de login por IP por janela
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Demasiadas tentativas. Aguarda 15 minutos.' },
});

// Rate limit de quiz — previne submissões rápidas múltiplas
const quizLimiter = rateLimit({
  windowMs:         60 * 60 * 1000, // 1 hora
  max:              5,               // 5 submissões por hora por IP
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Limite de tentativas do quiz atingido. Aguarda 1 hora.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));       // limite no body JSON
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Logging de requests (sem dados sensíveis) ─────────────────────────────
app.use((req, _, next) => {
  // Não loga o body — pode conter passwords
  log('info', `${req.method} ${req.path}`, { ip: req.ip });
  next();
});

// ── Rotas ─────────────────────────────────────────────────────────────────
app.use('/api/auth',     authLimiter, require('./routes/authRoutes'));
app.use('/api/posts',                 require('./routes/postRoutes'));
app.use('/api/users',                 require('./routes/userRoutes'));
app.use('/api/messages',              require('./routes/messageRoutes'));
app.use('/api/admin',                 require('./routes/adminRoutes'));
app.use('/api/ranking',               require('./routes/rankingRoutes'));
app.use('/api/quiz',     quizLimiter, require('./routes/quizRoutes'));
app.use('/api/jobs',                  require('./routes/jobRoutes'));
app.use('/api/rooms',                 require('./routes/roomRoutes'));

app.use('/api/skills',        require('./routes/skillRoutes'));
app.use('/api/projects',      require('./routes/projectRoutes'));
app.use('/api/mentors',       require('./routes/mentorRoutes'));
app.use('/api/verification',  require('./routes/verificationRoutes'));

app.get('/api/health', (_, res) =>
  res.json({ status: 'OK', timestamp: new Date(), version: '1.0.0' })
);

app.use((_, res) => res.status(404).json({ error: 'Rota não encontrada.' }));

// ── Error handler global ──────────────────────────────────────────────────
// Não expõe stack traces em produção
// Trata erros do Multer de forma específica
app.use((err, req, res, _next) => {
  // Erros do Multer (upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Ficheiro demasiado grande.' });
  }
  if (err.message?.includes('Tipo de ficheiro')) {
    return res.status(400).json({ error: err.message });
  }

  // Log do erro completo internamente (nunca ao cliente)
  log('error', err.message, {
    path:   req.path,
    method: req.method,
    stack:  isProd ? undefined : err.stack,
  });

  return res.status(500).json({ error: 'Erro interno.' });
});

app.listen(PORT, () => log('info', `API iniciada na porta ${PORT}`));
module.exports = app;
