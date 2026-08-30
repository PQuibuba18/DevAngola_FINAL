require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const rateLimit = require('express-rate-limit');
const path      = require('path');

const app    = express();
const isProd = process.env.NODE_ENV === 'production';

const REQUIRED_ENV = ['DATABASE_URL', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error('[startup] Variáveis em falta:', missing.join(', '));
}

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

const allowed = ['http://localhost:3000', process.env.FRONTEND_URL].filter(Boolean);
app.use(cors({
  origin: (o, cb) => (!o || allowed.includes(o)) ? cb(null, true) : cb(new Error('CORS')),
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Muitas requisições. Tenta novamente em 15 minutos.' },
  skip: (req) => req.path === '/api/health',
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas tentativas. Aguarda 15 minutos.' },
});
const quizLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, max: 5, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Limite de tentativas do quiz atingido. Aguarda 1 hora.' },
});

app.use(globalLimiter);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../backend/uploads')));

app.use('/api/auth',     authLimiter, require('../backend/src/routes/authRoutes'));
app.use('/api/posts',                 require('../backend/src/routes/postRoutes'));
app.use('/api/users',                 require('../backend/src/routes/userRoutes'));
app.use('/api/messages',              require('../backend/src/routes/messageRoutes'));
app.use('/api/admin',                 require('../backend/src/routes/adminRoutes'));
app.use('/api/ranking',               require('../backend/src/routes/rankingRoutes'));
app.use('/api/quiz',     quizLimiter, require('../backend/src/routes/quizRoutes'));
app.use('/api/jobs',                  require('../backend/src/routes/jobRoutes'));
app.use('/api/rooms',                 require('../backend/src/routes/roomRoutes'));

app.use('/api/skills',        require('../backend/src/routes/skillRoutes'));
app.use('/api/projects',      require('../backend/src/routes/projectRoutes'));
app.use('/api/mentors',       require('../backend/src/routes/mentorRoutes'));
app.use('/api/verification',  require('../backend/src/routes/verificationRoutes'));

app.get('/api/health', (_, res) =>
  res.json({ status: 'OK', timestamp: new Date(), version: '1.0.0' })
);

app.use((_, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
app.use((err, req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE')
    return res.status(400).json({ error: 'Ficheiro demasiado grande.' });
  if (err.message?.includes('Tipo de ficheiro'))
    return res.status(400).json({ error: err.message });
  console.error(isProd ? err.message : err.stack);
  return res.status(500).json({ error: 'Erro interno.' });
});

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log('API → http://localhost:' + PORT + '/api'));
}

module.exports = app;
