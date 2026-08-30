# 🚀 Guia Completo: Deploy DevAngola na Vercel

## 📋 Resumo da Arquitetura

- **Frontend**: React (SPA) → Vercel Hosting
- **Backend**: Node.js/Express → Vercel Serverless Functions
- **Database**: PostgreSQL Neon → Neon (fornecedor externo)

---

## 1️⃣ PREPARAÇÃO DO PROJETO

### 1.1 Estrutura Necessária para Vercel

A Vercel precisa de uma estrutura específica. Você tem 2 opções:

#### **OPÇÃO A: Monorepo (Recomendado)**

```
devangola/
├── vercel.json
├── .gitignore
├── backend/
│   ├── package.json
│   ├── src/
│   └── api/                    # ← Pasta especial para funções serverless
│       └── [...route].js       # Arquivo que redireciona para Express
├── frontend/
│   ├── package.json
│   └── src/
└── public/                     # Assets estáticos
```

#### **OPÇÃO B: Repos Separados**

- Faça deploy do frontend e backend como projetos separados na Vercel
- Mais simples, mas menos integrado

**Vou usar a OPÇÃO A (mais profissional)**

### 1.2 Criar Arquivo de Configuração Vercel

Crie `vercel.json` na raiz do projeto:

```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/build",
  "functions": {
    "api/**/*.js": {
      "runtime": "nodejs18.x"
    }
  },
  "rewrites": [
    {
      "source": "/api/:match*",
      "destination": "/api/:match*"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "FRONTEND_URL": "@frontend_url"
  }
}
```

---

## 2️⃣ PREPARAR O BACKEND PARA VERCEL

### 2.1 Adaptar o Backend para Serverless

Você precisa modificar o `app.js` para exportar como handler:

**Crie o arquivo `api/index.js`** (pasta `api` na raiz):

```javascript
// api/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

const allowed = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
  "https://seu-dominio.vercel.app", // ← seu domínio Vercel
].filter(Boolean);

app.use(
  cors({
    origin: (o, cb) =>
      !o || allowed.includes(o)
        ? cb(null, true)
        : cb(new Error("CORS bloqueado")),
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir uploads (você pode usar S3 em produção)
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

// Rotas
app.use("/api/auth", require("../backend/src/routes/authRoutes"));
app.use("/api/posts", require("../backend/src/routes/postRoutes"));
app.use("/api/users", require("../backend/src/routes/userRoutes"));
app.use("/api/messages", require("../backend/src/routes/messageRoutes"));
app.use("/api/admin", require("../backend/src/routes/adminRoutes"));
app.use("/api/ranking", require("../backend/src/routes/rankingRoutes"));

app.get("/api/health", (_, res) => res.json({ status: "OK", ts: new Date() }));
app.use((_, res) => res.status(404).json({ error: "Rota não encontrada." }));
app.use((err, _, res, __) => {
  console.error(err.message);
  res.status(500).json({ error: "Erro interno." });
});

// Para desenvolvimento local
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () =>
    console.log(`DevAngola API → http://localhost:${PORT}/api`),
  );
}

module.exports = app;
```

### 2.2 Atualizar package.json do Backend

```json
{
  "name": "devangola-backend",
  "version": "1.0.0",
  "description": "API REST da rede social DevAngola",
  "main": "api/index.js",
  "scripts": {
    "start": "node api/index.js",
    "dev": "nodemon api/index.js"
  },
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "pg": "^8.11.3"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 2.3 Configurar Variáveis de Ambiente

Na raiz do projeto, crie `.env.local` (local):

```env
DATABASE_URL=postgresql://user:password@neon-db.neondb.io/devangola?sslmode=require
PORT=5000
FRONTEND_URL=http://localhost:3000
JWT_SECRET=sua_chave_secreta_aqui_muito_importante
```

---

## 3️⃣ PREPARAR FRONTEND

### 3.1 Configurar URL da API

Atualize o arquivo [frontend/src/services/api.js](frontend/src/services/api.js):

```javascript
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export default API_BASE_URL;
```

### 3.2 Atualizar os Serviços API

Em `frontend/src/services/api.js` e `messagesApi.js`:

```javascript
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Adicionar token JWT automaticamente
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

### 3.3 Variáveis de Ambiente Frontend

Crie `.env` na pasta `frontend`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 4️⃣ CONFIGURAR BANCO DE DADOS (Neon PostgreSQL)

### 4.1 Criar Conta no Neon

1. Acesse [https://neon.tech/](https://neon.tech/)
2. Sign up com GitHub
3. Crie um projeto
4. Crie um banco de dados

### 4.2 Obter Connection String

Na dashboard do Neon:

1. Vá em "Connection string"
2. Escolha "Pooled"
3. Copie a string (exemplo):
   ```
   postgresql://neon_user:password@ep-xyz.neon.tech/devangola?sslmode=require
   ```

### 4.3 Executar Migrations

Antes de fazer deploy, é crucial que você tenha as estruturas de banco de dados criadas:

**Opção 1: Usar psql localmente**

```bash
psql "postgresql://user:password@ep-xyz.neon.tech/devangola?sslmode=require" < backend/schema_v4.sql
```

**Opção 2: Script Node.js de Setup**

Crie `backend/scripts/setup-db.js`:

```javascript
const { Pool } = require("pg");
const fs = require("fs");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupDatabase() {
  try {
    const schema = fs.readFileSync("./schema_v4.sql", "utf-8");
    await pool.query(schema);
    console.log("✅ Banco de dados inicializado com sucesso!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao inicializar BD:", err.message);
    process.exit(1);
  }
}

setupDatabase();
```

Execute:

```bash
NODE_ENV=production DATABASE_URL="postgresql://..." node backend/scripts/setup-db.js
```

---

## 5️⃣ FAZER PUSH PARA GITHUB

```bash
# Na raiz do projeto
git add .
git commit -m "feat: preparar para deployment Vercel"
git push origin main
```

---

## 6️⃣ DEPLOY NA VERCEL

### 6.1 Conectar Projeto

1. Acesse [https://vercel.com/](https://vercel.com/)
2. Login com GitHub
3. Clique em "New Project"
4. Selecione seu repositório `devangola`
5. Clique em "Import"

### 6.2 Configurar Build

Na página de configuração:

**Build Command:**

```
cd frontend && npm install && npm run build
```

**Output Directory:**

```
frontend/build
```

**Root Directory:** (deixe vazio ou coloque `.`)

### 6.3 Adicionar Variáveis de Ambiente

Clique em "Environment Variables" e adicione:

| Nome           | Valor                                                               |
| -------------- | ------------------------------------------------------------------- |
| `DATABASE_URL` | `postgresql://user:pass@ep-xyz.neon.tech/devangola?sslmode=require` |
| `FRONTEND_URL` | `https://seu-projeto.vercel.app`                                    |
| `JWT_SECRET`   | `gere-uma-chave-segura-aqui`                                        |

### 6.4 Fazer Deploy

Clique em "Deploy" e aguarde!

---

## 7️⃣ PROBLEMA: Uploads de Ficheiros

A Vercel é **serverless** e usa **ephemeral storage** (arquivos desaparecem após requisição).

### Solução: Usar S3 (AWS) ou Similar

#### **Opção A: AWS S3**

1. Crie conta em AWS
2. Crie bucket S3
3. Instale no backend:

   ```bash
   npm install aws-sdk dotenv
   ```

4. Atualize `backend/src/middlewares/upload.js`:

   ```javascript
   const multer = require("multer");
   const AWS = require("aws-sdk");
   const multerS3 = require("multer-s3");

   const s3 = new AWS.S3({
     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
   });

   const upload = multer({
     storage: multerS3({
       s3: s3,
       bucket: process.env.AWS_S3_BUCKET,
       metadata: (req, file, cb) => {
         cb(null, { fieldName: file.fieldname });
       },
       key: (req, file, cb) => {
         cb(null, Date.now().toString() + "-" + file.originalname);
       },
     }),
   });

   module.exports = upload;
   ```

5. Adicione na Vercel:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_S3_BUCKET`

#### **Opção B: Cloudinary (mais simples)**

1. Cadastre em [https://cloudinary.com/](https://cloudinary.com/)
2. Use o API deles no upload

---

## 8️⃣ CHECKLIST PRÉ-DEPLOYMENT

- [ ] Arquivo `vercel.json` criado na raiz
- [ ] `api/index.js` configurado como handler
- [ ] `package.json` atualizado com `engines.node`
- [ ] `.env` local testado (npm run dev)
- [ ] Banco de dados Neon criado e migrations aplicadas
- [ ] Frontend configurado com REACT_APP_API_URL
- [ ] Todas as variáveis de ambiente no Vercel definidas
- [ ] Teste local completo (frontend + backend)
- [ ] Push para GitHub
- [ ] Deploy na Vercel

---

## 9️⃣ TESTES PÓS-DEPLOYMENT

```bash
# Testar health check
curl https://seu-projeto.vercel.app/api/health

# Testar login
curl -X POST https://seu-projeto.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"123456"}'
```

---

## 🔟 TROUBLESHOOTING

### Erro: "Cannot find module"

- Verifique caminhos relativos em `api/index.js`
- Use paths absolutos quando necessário

### Erro: "DATABASE_URL is not defined"

- Confirme que a variável foi adicionada no Vercel
- Tente fazer redeploy

### CORS Error

- Atualize `allowed` em `api/index.js` com seu domínio Vercel
- Redeploy

### Uploads não funcionam

- Configure S3 ou Cloudinary como descrito na seção 7

---

## 📞 Resumo do Processo

1. ✅ Preparar estrutura (vercel.json, api/)
2. ✅ Adaptar backend para serverless
3. ✅ Configurar frontend com variáveis
4. ✅ Setup banco de dados Neon
5. ✅ Push para GitHub
6. ✅ Conectar na Vercel
7. ✅ Configurar variáveis de ambiente
8. ✅ Deploy e testar

Boa sorte! 🎉
