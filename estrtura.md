# Backend

cd backend
cp .env.example .env # preenche DATABASE_URL e JWT_SECRET
npm install
npm run dev

# Frontend (outro terminal)

cd frontend
cp .env.example .env
npm install
npm run dev

src/
├── index.js ← importa CSS na ordem certa
├── App.jsx ← rotas
├── services/api.js ← axios com JWT
├── context/AuthContext.jsx ← estado global
├── components/
│ ├── Navbar.jsx ← usa ./ui/Avatar, ./ui/Icons
│ ├── PostCard.jsx ← usa ./ui/Avatar, ./ui/Badge, ./ui/Icons
│ ├── PrivateRoute.jsx
│ └── ui/
│ ├── Icons.jsx ← 18 ícones SVG inline
│ ├── Button.jsx
│ ├── Input.jsx
│ ├── Select.jsx
│ ├── Avatar.jsx
│ └── Badge.jsx
├── pages/
│ ├── Login.jsx / Register.jsx
│ ├── Feed.jsx / NewPost.jsx / PostDetail.jsx
│ ├── Salas.jsx / Usuarios.jsx / Perfil.jsx
│ └── Messages.jsx ← sistema de mensagens completo
└── styles/
├── tokens.css ← variáveis de design
├── global.css ← reset + utilitários
├── components/
│ ├── components.css ← btn, input, card, badge, avatar
│ └── navbar.css
└── pages/
├── auth.css ← login centrado, sem split-panel
└── pages.css ← feed, posts, salas, users, messages


backend/
├── .env.example          ← fora do src (configuração)
├── package.json          ← fora do src (dependências)
├── schema.sql            ← fora do src (base de dados)
├── uploads/              ← fora do src (ficheiros enviados)
│   └── .gitkeep
└── src/                  ← todo o código está aqui dentro
    ├── app.js
    ├── config/
    │   └── db.js
    ├── controllers/
    │   ├── authController.js
    │   ├── messageController.js
    │   ├── postController.js
    │   └── userController.js
    ├── middlewares/
    │   ├── auth.js
    │   └── upload.js
    ├── models/
    │   ├── messageModel.js
    │   ├── postModel.js
    │   └── userModel.js
    └── routes/
        ├── authRoutes.js
        ├── messageRoutes.js
        ├── postRoutes.js
        └── userRoutes.js