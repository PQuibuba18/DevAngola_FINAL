const QuizModel = require('../models/quizModel');

const quizController = {

  async getQuestions(req, res) {
    try {
      // Verifica cooldown antes de devolver perguntas
      const onCooldown = await QuizModel.isOnCooldown(req.userId);
      if (onCooldown) {
        return res.status(429).json({
          error: 'Já fizeste o quiz nas últimas 24 horas. Aguarda antes de repetir.',
          cooldown: true,
        });
      }

      const questions = await QuizModel.getRandom();
      if (questions.length < 5)
        return res.status(503).json({ error: 'Banco de perguntas insuficiente. Contacta o administrador.' });
      return res.json(questions);
    } catch (err) {
      console.error('quizController.getQuestions:', err.message);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async submit(req, res) {
    try {
      // Verifica cooldown na submissão também (defesa em profundidade)
      const onCooldown = await QuizModel.isOnCooldown(req.userId);
      if (onCooldown) {
        return res.status(429).json({
          error: 'Já submeteste o quiz nas últimas 24 horas.',
          cooldown: true,
        });
      }

      const { answers } = req.body;
      if (!Array.isArray(answers) || answers.length !== 5)
        return res.status(400).json({ error: 'São necessárias exactamente 5 respostas.' });

      for (const a of answers) {
        if (!a.questionId || !['a','b','c','d'].includes(a.answer))
          return res.status(400).json({ error: 'Formato de resposta inválido.' });
      }

      const score = await QuizModel.evaluate(answers);
      const level = QuizModel.scoreToLevel(score);
      await QuizModel.saveResult(req.userId, score, level);

      return res.json({ score, total: 5, level, message: `Nível atribuído: ${level}` });
    } catch (err) {
      console.error('quizController.submit:', err.message);
      return res.status(500).json({ error: 'Erro ao processar quiz.' });
    }
  },

  async status(req, res) {
    try {
      const needs      = await QuizModel.needsQuiz(req.userId);
      const onCooldown = await QuizModel.isOnCooldown(req.userId);
      return res.json({ needsQuiz: needs, onCooldown });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  async adminList(req, res) {
    try { return res.json(await QuizModel.getAll()); }
    catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async adminCreate(req, res) {
    try {
      const { question, option_a, option_b, option_c, option_d, correct, category, difficulty } = req.body;
      if (!question || !option_a || !option_b || !option_c || !option_d || !correct)
        return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
      if (!['a','b','c','d'].includes(correct))
        return res.status(400).json({ error: 'Resposta correcta inválida.' });
      const q = await QuizModel.create({
        question, option_a, option_b, option_c, option_d, correct,
        category: category || 'geral', difficulty: Number(difficulty) || 1,
      });
      return res.status(201).json(q);
    } catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },

  async adminDelete(req, res) {
    try { await QuizModel.delete(req.params.id); return res.json({ message: 'Pergunta removida.' }); }
    catch (err) { return res.status(500).json({ error: 'Erro interno.' }); }
  },
};

module.exports = quizController;
