const db = require('../config/db');

const eventsController = {

  async list(req, res) {
    try {
      const { category, city, status = 'upcoming' } = req.query;
      const params = [status];
      let where = 'WHERE e.status=$1';
      if (category) { params.push(category); where += ` AND e.category=$${params.length}`; }
      if (city)     { params.push(city);     where += ` AND e.city=$${params.length}`; }
      params.push(30);
      const r = await db.query(`
        SELECT e.*,
          u.name AS organizer_name, u.avatar_url AS organizer_avatar,
          (SELECT COUNT(*)::int FROM event_participants ep WHERE ep.event_id=e.id) AS participants_count,
          ${req.userId ? `(SELECT 1 FROM event_participants WHERE event_id=e.id AND user_id=${req.userId}) IS NOT NULL AS is_registered` : 'FALSE AS is_registered'}
        FROM events e
        JOIN users u ON u.id=e.organizer_id
        ${where}
        ORDER BY e.is_featured DESC, e.start_date ASC
        LIMIT $${params.length}
      `, params);
      return res.json(r.rows);
    } catch (err) {
      console.error('events.list:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async getOne(req, res) {
    try {
      const r = await db.query(`
        SELECT e.*, u.name AS organizer_name, u.avatar_url AS organizer_avatar,
          (SELECT COUNT(*)::int FROM event_participants WHERE event_id=e.id) AS participants_count
        FROM events e JOIN users u ON u.id=e.organizer_id WHERE e.id=$1
      `, [req.params.id]);
      if (!r.rows[0]) return res.status(404).json({ error: 'Evento não encontrado.' });
      return res.json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async create(req, res) {
    try {
      const { title, description, category, location_name, city, is_online, online_url,
              start_date, end_date, registration_url, max_participants, is_free, price } = req.body;
      if (!title || !description || !category || !start_date)
        return res.status(400).json({ error: 'Campos obrigatórios em falta.' });
      const r = await db.query(`
        INSERT INTO events (organizer_id, title, description, category, location_name, city,
          is_online, online_url, start_date, end_date, registration_url, max_participants, is_free, price)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *
      `, [req.userId, title, description, category, location_name||null, city||'Luanda',
          !!is_online, online_url||null, start_date, end_date||null,
          registration_url||null, max_participants||null, is_free !== false, price||null]);
      return res.status(201).json(r.rows[0]);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async register(req, res) {
    try {
      const ev = await db.query('SELECT max_participants, status FROM events WHERE id=$1', [req.params.id]);
      if (!ev.rows[0]) return res.status(404).json({ error: 'Evento não encontrado.' });
      if (ev.rows[0].status !== 'upcoming') return res.status(400).json({ error: 'Inscrições encerradas.' });
      if (ev.rows[0].max_participants) {
        const count = await db.query('SELECT COUNT(*) FROM event_participants WHERE event_id=$1', [req.params.id]);
        if (parseInt(count.rows[0].count) >= ev.rows[0].max_participants)
          return res.status(400).json({ error: 'Evento lotado.' });
      }
      await db.query(
        'INSERT INTO event_participants (event_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
        [req.params.id, req.userId]
      );
      return res.json({ message: 'Inscrição confirmada!' });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async unregister(req, res) {
    try {
      await db.query('DELETE FROM event_participants WHERE event_id=$1 AND user_id=$2', [req.params.id, req.userId]);
      return res.json({ message: 'Inscrição cancelada.' });
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = eventsController;
