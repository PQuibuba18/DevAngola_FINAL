const jwt = require('jsonwebtoken');
const db  = require('../config/db');

// ─── authMiddleware ────────────────────────────────────────────────────────
// Verifica apenas a assinatura do token JWT.
// Preenche req.userId e req.userRole a partir do payload.
// NÃO faz consulta ao banco — é usado em rotas de utilizador comum.
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido.' });

  const token = authHeader.split(' ')[1];
  if (!token)  return res.status(401).json({ error: 'Formato do token inválido.' });

  try {
    const decoded    = jwt.verify(token, process.env.JWT_SECRET);
    req.userId       = decoded.id;
    req.userRole     = decoded.role || 'user';
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
}

// ─── adminMiddleware ───────────────────────────────────────────────────────
// Usado DEPOIS de authMiddleware em rotas administrativas.
// Verifica no BANCO DE DADOS (não no token) que o utilizador:
//   1. ainda existe
//   2. tem role = 'admin'
//   3. está activo (is_active = true)
//
// Por que banco e não token?
//   - Se o admin for removido ou banido, o token antigo (válido até 7 dias)
//     continuaria a dar acesso se verificássemos apenas o payload.
//   - A consulta é leve (PK lookup) e ocorre apenas em rotas /api/admin/*.
async function adminMiddleware(req, res, next) {
  try {
    const result = await db.query(
      'SELECT role, is_active FROM users WHERE id = $1',
      [req.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Utilizador não encontrado.' });
    }

    if (user.is_active === false) {
      return res.status(403).json({ error: 'Conta suspensa.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
    }

    // Actualiza req.userRole com o valor actual do banco
    req.userRole = user.role;
    next();
  } catch (err) {
    console.error('adminMiddleware error:', err.message);
    return res.status(500).json({ error: 'Erro interno de autorização.' });
  }
}

// ─── bannedCheck ──────────────────────────────────────────────────────────
// Middleware opcional para rotas onde utilizadores banidos não devem ter acesso.
// Pode ser adicionado a qualquer rota sensível sem ser obrigatório em todas.
async function bannedCheck(req, res, next) {
  try {
    const result = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [req.userId]
    );
    const user = result.rows[0];
    if (!user || user.is_active === false) {
      return res.status(403).json({ error: 'Conta suspensa.' });
    }
    next();
  } catch (err) {
    console.error('bannedCheck error:', err.message);
    return res.status(500).json({ error: 'Erro interno.' });
  }
}

module.exports = { authMiddleware, adminMiddleware, bannedCheck };
