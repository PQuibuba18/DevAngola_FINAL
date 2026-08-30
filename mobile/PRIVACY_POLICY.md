# Política de Privacidade — DevAngola

**Última actualização:** [DATA DE PUBLICAÇÃO]
**Versão da app:** 1.0.0

## 1. Quem somos

O DevAngola é uma plataforma profissional e comunitária para programadores angolanos.
Responsável pelo tratamento de dados: [NOME LEGAL DA EMPRESA/ENTIDADE]
Contacto: privacidade@devangola.ao

---

## 2. Dados que recolhemos

### 2.1 Dados que o utilizador fornece directamente

| Dado | Finalidade | Retenção |
|---|---|---|
| Nome e email | Criação e identificação da conta | Até eliminação da conta |
| Senha (hash bcrypt) | Autenticação segura — nunca armazenada em texto simples | Até eliminação da conta |
| Nível de programação | Personalização e matching | Até eliminação da conta |
| Foto de perfil (opcional) | Identificação na comunidade | Até remoção pelo utilizador |
| Identificador/bio (opcional) | Perfil público | Até remoção pelo utilizador |
| Posts e comentários | Conteúdo comunitário | Até eliminação pelo utilizador ou moderador |
| Mensagens privadas | Comunicação entre utilizadores | Até eliminação da conta |
| Skills declaradas | Matching de vagas e projectos | Até remoção pelo utilizador |
| Documento de identificação (opcional) | Verificação de identidade angolana | **Eliminado após revisão** |

### 2.2 Dados recolhidos automaticamente

| Dado | Finalidade |
|---|---|
| Endereço IP | Segurança e rate limiting |
| Registo de pedidos HTTP | Diagnóstico de erros (sem dados pessoais nos logs) |

---

## 3. Documentos de identidade — tratamento especial

Quando o utilizador opta pela verificação de identidade:

- O documento é enviado por HTTPS com encriptação TLS 1.3
- É armazenado de forma cifrada em storage privado (não acessível publicamente)
- Apenas administradores autorizados têm acesso para revisão
- **Após aprovação ou rejeição, o documento é eliminado permanentemente**
- O sistema regista apenas o resultado: `identidade verificada: sim/não`
- O número do documento não é armazenado em nenhuma base de dados
- O utilizador pode retirar o pedido de verificação antes da revisão

---

## 4. Como usamos os dados

- Fornecer os serviços da plataforma (feed, mensagens, vagas, projectos)
- Personalizar a experiência (nível, skills, preferências)
- Garantir segurança (autenticação, moderação)
- Matching entre programadores e oportunidades
- Comunicar actualizações importantes da plataforma

Não vendemos dados a terceiros. Não usamos dados para publicidade.

---

## 5. Partilha de dados

| Com quem | O quê | Porquê |
|---|---|---|
| Outros utilizadores | Perfil público, posts, comentários | Funcionalidade da comunidade |
| Cloudinary (opcional) | Imagens e ficheiros | Armazenamento de media |
| Neon / Supabase | Dados da conta | Infraestrutura de base de dados |
| Vercel | Logs de pedidos HTTP | Infraestrutura de servidor |

---

## 6. Segurança

- Senhas: hash bcrypt com salt
- Tokens JWT: assinados com chave secreta, validade de 7 dias
- Comunicação: HTTPS (TLS 1.3)
- Tokens móveis: armazenados em iOS Keychain / Android Keystore
- Rate limiting: protecção contra brute force
- Documentos de identidade: cifrados em repouso, eliminados após revisão

---

## 7. Direitos do utilizador

O utilizador pode a qualquer momento:

- Consultar os seus dados (perfil, posts, histórico)
- Corrigir dados incorrectos (editar perfil)
- Eliminar a conta e todos os dados associados
- Revogar a verificação de identidade (antes da revisão)
- Exportar o seu conteúdo (funcionalidade a implementar)

Para exercer estes direitos: privacidade@devangola.ao

---

## 8. Eliminação de conta

Para eliminar a conta: Perfil → Definições → Eliminar conta

Após eliminação:
- Dados da conta são removidos em 30 dias
- Posts podem ser anonimizados em vez de eliminados (decisão do utilizador)
- Mensagens são eliminadas

URL alternativa: https://devangola.ao/eliminar-conta

---

## 9. Crianças

O DevAngola é destinado exclusivamente a utilizadores com 18 ou mais anos. Não recolhemos dados de menores de forma consciente.

---

## 10. Alterações a esta política

Notificamos os utilizadores por email com 30 dias de antecedência em caso de alterações materiais.

---

## 11. Contacto

Questões sobre privacidade: privacidade@devangola.ao
