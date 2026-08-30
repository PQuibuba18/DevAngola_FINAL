# DevAngola — Setup Rápido

## Pré-requisitos
- Node.js 20+
- Conta no [Neon](https://neon.tech) (base de dados PostgreSQL gratuita)
- Conta no [Cloudinary](https://cloudinary.com) (opcional — uploads)

---

## 1. Backend

```bash
cd backend
cp .env.example .env
# Edita .env com as tuas credenciais do Neon e JWT_SECRET
npm install
npm run migrate       # aplica as migrations no banco
npm run dev           # inicia o servidor em http://localhost:5000
```

## 2. Frontend Web

```bash
cd frontend
cp .env.example .env  # ou cria .env com REACT_APP_API_URL=http://localhost:5000/api
npm install
npm start             # inicia em http://localhost:3000
```

## 3. Mobile (React Native + Expo)

```bash
cd mobile
cp .env.example .env
# Edita .env: EXPO_PUBLIC_API_URL=http://10.0.2.2:5000/api (emulador Android)
# ou:          EXPO_PUBLIC_API_URL=http://IP_LOCAL:5000/api (dispositivo físico)
npm install
npx expo start --android
```

---

## 4. Tornar-se Admin

Após criar conta:
```sql
-- No Neon SQL Editor:
UPDATE users SET role = 'admin' WHERE email = 'teu@email.com';
```

Depois em Configurações → "Actualizar Sessão".

---

## 5. Estrutura do projecto

```
devangola/
  backend/          → API REST (Node.js + Express)
  frontend/         → Web (React 18)
  mobile/           → App Android (React Native + Expo)
  api/              → Vercel serverless entry point
  vercel.json       → Configuração de deploy Vercel
```

## 6. Deploy (Vercel)

1. Importa o repositório em vercel.com
2. Em Settings → Environment Variables, adiciona:
   - DATABASE_URL
   - JWT_SECRET
   - FRONTEND_URL (URL do teu projecto Vercel)
   - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

Ver `DEPLOYMENT_VERCEL.md` para instruções detalhadas.
