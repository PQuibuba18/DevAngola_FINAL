
const MessageModel = require('../models/messageModel');

const messageController = {

  
  async listConversations(req, res) {
    try {
      const conversations = await MessageModel.listConversations(req.userId);
      return res.json(conversations);
    } catch (err) {
      console.error('Erro ao listar conversas:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  
  async unreadCount(req, res) {
    try {
      const count = await MessageModel.unreadCount(req.userId);
      return res.json({ count });
    } catch (err) {
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  
  async startConversation(req, res) {
    try {
      const { targetUserId } = req.body;
      if (!targetUserId) return res.status(400).json({ error: 'targetUserId obrigatório.' });
      if (Number(targetUserId) === req.userId) {
        return res.status(400).json({ error: 'Não podes enviar mensagem para ti mesmo.' });
      }
      const conversationId = await MessageModel.findOrCreateConversation(req.userId, Number(targetUserId));
      return res.json({ conversationId });
    } catch (err) {
      console.error('Erro ao iniciar conversa:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  
  async getMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const belongs = await MessageModel.userBelongs(conversationId, req.userId);
      if (!belongs) return res.status(403).json({ error: 'Acesso negado.' });

      const messages = await MessageModel.getMessages(conversationId, req.userId);
      return res.json(messages);
    } catch (err) {
      console.error('Erro ao buscar mensagens:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },

  
  async sendMessage(req, res) {
    try {
      const { conversationId } = req.params;
      const { content } = req.body;
      if (!content?.trim()) return res.status(400).json({ error: 'Mensagem vazia.' });

      const belongs = await MessageModel.userBelongs(conversationId, req.userId);
      if (!belongs) return res.status(403).json({ error: 'Acesso negado.' });

      const message = await MessageModel.send(conversationId, req.userId, content.trim());
      if (!message) return res.status(404).json({ error: 'Conversa não encontrada.' });
      return res.status(201).json(message);
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
      return res.status(500).json({ error: 'Erro interno.' });
    }
  },
};

module.exports = messageController;
