# 🚀 Quick Deploy Guide - Vercel

## Passo 1: Preparação Local (5 min)

```bash
# No diretório backend/
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL

# No diretório frontend/
cp .env.example .env
# Deixe como está para desenvolvimento local

# Teste localmente
cd backend && npm run dev    # Terminal 1
cd frontend && npm start     # Terminal 2
```

**✅ Teste:** Acesse http://localhost:3000

---

## Passo 2: Preparar Banco de Dados (10 min)

### 2.1 Criar Neon PostgreSQL

1. Vá para https://neon.tech/
2. Crie uma conta (GitHub é mais rápido)
3. Crie um novo projeto
4. Copie a **Connection String (Pooled)**

### 2.2 Executar Migrations

```bash
# Instale psql (PostgreSQL client) ou use um GUI como DBeaver

# Via psql:
psql "postgresql://seu_user:seu_password@ep-xyz.neon.tech/devangola?sslmode=require" < backend/schema_v4.sql

# Via Node.js (alternativa):
NODE_ENV=production DATABASE_URL="postgresql://..." node backend/scripts/setup-db.js
```

**✅ Verificar:** Acesse Neon dashboard → Query editor → `SELECT * FROM users LIMIT 1;`

---

## Passo 3: GitHub (2 min)

```bash
git add .
git commit -m "prep: deploy to vercel"
git push origin main
```

---

## Passo 4: Vercel Setup (15 min)

### 4.1 Conectar Repositório

1. Vá para https://vercel.com/
2. Login com GitHub
3. "New Project" → Selecione `devangola`
4. "Import"

### 4.2 Configurar Build (IMPORTANTE!)

**Framework Preset:** None (monorepo customizado)

**Build Command:**

```
cd frontend && npm install && npm run build
```

**Output Directory:**

```
frontend/build
```

**Root Directory:** `.` (ou deixe vazio)

### 4.3 Environment Variables

Clique em "Environment Variables" e adicione:

| Nome           | Valor                                                                           |
| -------------- | ------------------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://seu_user:seu_password@ep-xyz.neon.tech/devangola?sslmode=require` |
| `FRONTEND_URL` | `https://seu-projeto-xxxxx.vercel.app`                                          |
| `JWT_SECRET`   | Copie do seu .env local                                                         |

**⚠️ Nota:** O `FRONTEND_URL` você descobre APÓS o primeiro deploy

### 4.4 Deploy

Clique em "Deploy" e aguarde ~2-3 minutos

---

## Passo 5: Atualizar FRONTEND_URL (2 min)

Após o primeiro deploy bem-sucedido:

1. Copie seu URL da Vercel (ex: `https://devangola-abc123.vercel.app`)
2. Volte em Settings → Environment Variables
3. Edite `FRONTEND_URL` com a URL completa
4. Clique em "Deployments" → "Redeploy" no último deploy
5. Aguarde completar

---

## Passo 6: Testar Produção (5 min)

```bash
# Testar health check
curl https://seu-projeto.vercel.app/api/health

# Resultado esperado:
# {"status":"OK","timestamp":"2024-01-15T..."}
```

Acesse https://seu-projeto.vercel.app no navegador

---

## 🎯 Checklist Final

- [ ] Banco Neon criado e migrations aplicadas
- [ ] Arquivo `vercel.json` criado
- [ ] Pasta `api/` criada com `index.js`
- [ ] `.env.example` nos diretórios backend/ e frontend/
- [ ] Teste local funcionando
- [ ] Push para GitHub
- [ ] Deploy na Vercel realizado
- [ ] Variáveis de ambiente adicionadas
- [ ] Redeploy com FRONTEND_URL correto
- [ ] API respondendo (health check)
- [ ] Frontend carregando

---

## 🚨 Problemas Comuns

### "Cannot find module"

→ Verifique os paths relativos em `api/index.js`

### "CORS Error"

→ `FRONTEND_URL` incorreto ou não atualizado no Vercel

### "DATABASE_URL is undefined"

→ Confirm que foi adicionada em Environment Variables

### Uploads não funcionam

→ Normal! Vercel não permite armazenar arquivos. Use S3/Cloudinary (ver guia completo)

---

## 📞 Suporte

Se algo der errado:

1. Verifique a aba "Deployments" → "Logs" na Vercel
2. Veja a seção "TROUBLESHOOTING" no DEPLOYMENT_VERCEL.md
3. Teste localmente: `npm run dev` no backend

**Boa sorte! 🚀**
