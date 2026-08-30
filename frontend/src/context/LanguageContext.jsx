// context/LanguageContext.jsx
// Sistema de i18n global — todas as strings traduzíveis vivem aqui.
// Qualquer componente usa: const { t } = useLang()

import { createContext, useContext } from 'react';

const LanguageContext = createContext('pt');

export const LanguageProvider = LanguageContext.Provider;
export const useLang = () => {
  const lang = useContext(LanguageContext);
  return { lang, t: DICT[lang] || DICT.pt };
};

// ── Dicionário completo ────────────────────────────────────────
export const DICT = {
  pt: {
    // Nav
    feed: 'Feed', rooms: 'Salas', users: 'Utilizadores',
    messages: 'Mensagens', ranking: 'Ranking', publish: 'Publicar',
    profile: 'O Meu Perfil', settings: 'Configurações',
    adminPanel: 'Painel Admin', logout: 'Sair',

    // Auth
    login: 'Entrar', register: 'Criar conta',
    email: 'E-mail', password: 'Senha', name: 'Nome Completo',
    level: 'Nível', nationality: 'Nacionalidade',
    alreadyHaveAccount: 'Já tens conta?', noAccount: 'Ainda não tens conta?',
    loginHere: 'Entra aqui', registerHere: 'Cria a tua conta',
    loginSubtitle: 'Acede à tua conta',
    registerSubtitle: 'Preenche os teus dados para começar',
    emailPlaceholder: 'utilizador@devangola.ao',
    passwordPlaceholder: 'A tua senha', passwordHint: 'Mínimo 6 caracteres',
    levelPlaceholder: 'Selecciona o teu nível',
    exclusivePlatform: 'Plataforma exclusiva para programadores angolanos',
    portfolioLabel: 'Portfólio',
    portfolioRequired: '(obrigatório · formato .zip)',
    portfolioPlaceholder: 'Clica para anexar o teu portfólio .zip',
    portfolioHint: 'O portfólio serve para verificar que és programador.',
    portfolioMissing: 'Por favor, anexa o teu portfólio em formato ZIP.',
    portfolioWrongFormat: 'O portfólio deve ser um ficheiro .zip.',

    // Feed
    shareIdea: 'Partilha um projecto ou ideia com a comunidade...',
    noPostsYet: 'Sem posts ainda',
    noPostsDesc: 'Sê o primeiro a partilhar um projecto com a comunidade.',
    publishNow: 'Publicar agora',
    roomsByLevel: 'Salas por nível',
    likes: 'Gostos', comments: 'Comentários', download: 'Baixar',
    noComments: 'Sem comentários ainda.',
    writeComment: 'Escreve um comentário...', send: 'Enviar',

    // NewPost
    publishPost: 'Publicar projecto',
    publishSubtitle: 'Partilha o teu trabalho com a comunidade DevAngola',
    titleLabel: 'Título', titlePlaceholder: 'Ex: Sistema de pagamentos Multicaixa',
    descLabel: 'Descrição', descPlaceholder: 'Descreve o projecto — tecnologias, desafios, resultados...',
    imageLabel: 'Imagem', imageOptional: '(opcional)',
    imageHint: 'Clica para adicionar imagem', imageSubHint: 'JPG, PNG · máx. 10 MB',
    fileLabel: 'Código do Projecto (.zip)', selectFile: 'Seleccionar ficheiro',
    fileHint: 'PDF, ZIP, DOCX · máx. 50 MB',
    openSourceTitle: 'Projecto Open Source',
    openSourceText: 'Ao partilhar o código-fonte na DevAngola, o teu projecto fica disponível para toda a comunidade. Confirmas que este código é Open Source?',
    openSourceConfirm: 'Sim, confirmo que este projecto é Open Source.',
    openSourceRequired: 'Deves confirmar que o projecto é Open Source antes de publicar.',
    cancel: 'Cancelar', backToFeed: '← Voltar ao feed',
    titleRequired: 'Título e conteúdo são obrigatórios.',

    // Profile
    myProfile: 'O Meu Perfil',
    changePhoto: 'Alterar foto', save: 'Guardar',
    identifierLabel: 'Identificador', editIdentifier: 'Editar',
    identifierPlaceholder: 'Ex: Programador Web, Dev React, Full Stack...',
    identifierUpdated: 'Identificador actualizado!',
    photoUpdated: 'Foto actualizada com sucesso.',
    memberSince: 'Membro desde',

    // Settings
    settingsTitle: 'Configurações',
    themeTitle: 'Tema', themeDesc: 'Escolhe o aspecto visual da aplicação.',
    lightTheme: 'Claro', darkTheme: 'Escuro',
    langTitle: 'Idioma', langDesc: 'Idioma da interface.',
    savePrefs: 'Guardar preferências',
    prefsSaved: 'Preferências guardadas!', prefsError: 'Erro ao guardar.',

    // Ranking
    rankingTitle: 'Top 5 Programadores',
    rankingSubtitle: 'Posts × 1pt + Gostos × 2pts — actualiza em tempo real.',
    posts: 'posts', points: 'pts',

    // Messages
    messagesTitle: 'Mensagens', searchConv: 'Buscar conversa...',
    noConversations: 'Ainda não tens conversas.',
    noConvHint: 'Vai à lista de utilizadores e clica no ícone de mensagem.',
    viewUsers: 'Ver utilizadores',
    selectConv: 'Selecciona uma conversa',
    selectConvHint: 'Escolhe uma conversa à esquerda ou começa uma nova.',
    writeMessage: 'Escreve uma mensagem...', noMessages: 'Sem mensagens',

    // Salas
    roomsTitle: 'Salas de Conhecimento',
    roomsSubtitle: 'Selecciona uma sala e conecta-te com profissionais do teu nível',
    members: 'membros', noMembers: 'Sem membros nesta sala ainda.',
    viewProfile: 'Ver perfil',

    // Users
    usersTitle: 'Utilizadores',
    searchUsers: 'Buscar por nome ou email...', allLevels: 'Todos os níveis',
    noUsersFound: 'Nenhum utilizador encontrado.',
    sendMessage: 'Mensagem',

    // Errors
    genericError: 'Erro. Tenta novamente.',
    loginError: 'Email ou senha incorrectos.',
    suspendedAccount: 'Conta suspensa. Contacta o administrador.',

    // Levels
    iniciante: 'Iniciante', junior: 'Júnior',
    pleno: 'Pleno', senior: 'Sénior',
  },

  en: {
    // Nav
    feed: 'Feed', rooms: 'Rooms', users: 'Users',
    messages: 'Messages', ranking: 'Ranking', publish: 'Publish',
    profile: 'My Profile', settings: 'Settings',
    adminPanel: 'Admin Panel', logout: 'Sign out',

    // Auth
    login: 'Sign in', register: 'Create account',
    email: 'E-mail', password: 'Password', name: 'Full Name',
    level: 'Level', nationality: 'Nationality',
    alreadyHaveAccount: 'Already have an account?', noAccount: "Don't have an account?",
    loginHere: 'Sign in here', registerHere: 'Create your account',
    loginSubtitle: 'Access your account',
    registerSubtitle: 'Fill in your details to get started',
    emailPlaceholder: 'user@devangola.ao',
    passwordPlaceholder: 'Your password', passwordHint: 'Minimum 6 characters',
    levelPlaceholder: 'Select your level',
    exclusivePlatform: 'Exclusive platform for Angolan developers',
    portfolioLabel: 'Portfolio',
    portfolioRequired: '(required · .zip format)',
    portfolioPlaceholder: 'Click to attach your portfolio .zip',
    portfolioHint: 'The portfolio verifies that you are a developer.',
    portfolioMissing: 'Please attach your portfolio as a ZIP file.',
    portfolioWrongFormat: 'The portfolio must be a .zip file.',

    // Feed
    shareIdea: 'Share a project or idea with the community...',
    noPostsYet: 'No posts yet',
    noPostsDesc: 'Be the first to share a project with the community.',
    publishNow: 'Publish now',
    roomsByLevel: 'Rooms by level',
    likes: 'Likes', comments: 'Comments', download: 'Download',
    noComments: 'No comments yet.',
    writeComment: 'Write a comment...', send: 'Send',

    // NewPost
    publishPost: 'Publish project',
    publishSubtitle: 'Share your work with the DevAngola community',
    titleLabel: 'Title', titlePlaceholder: 'Ex: Multicaixa payment system',
    descLabel: 'Description', descPlaceholder: 'Describe the project — tech, challenges, results...',
    imageLabel: 'Image', imageOptional: '(optional)',
    imageHint: 'Click to add image', imageSubHint: 'JPG, PNG · max 10 MB',
    fileLabel: 'Project Code (.zip)', selectFile: 'Select file',
    fileHint: 'PDF, ZIP, DOCX · max 50 MB',
    openSourceTitle: 'Open Source Project',
    openSourceText: 'By sharing source code on DevAngola, your project becomes available to the whole community. Do you confirm this code is Open Source?',
    openSourceConfirm: 'Yes, I confirm this project is Open Source.',
    openSourceRequired: 'You must confirm the project is Open Source before publishing.',
    cancel: 'Cancel', backToFeed: '← Back to feed',
    titleRequired: 'Title and content are required.',

    // Profile
    myProfile: 'My Profile',
    changePhoto: 'Change photo', save: 'Save',
    identifierLabel: 'Identifier', editIdentifier: 'Edit',
    identifierPlaceholder: 'Ex: Web Developer, React Dev, Full Stack...',
    identifierUpdated: 'Identifier updated!',
    photoUpdated: 'Photo updated successfully.',
    memberSince: 'Member since',

    // Settings
    settingsTitle: 'Settings',
    themeTitle: 'Theme', themeDesc: 'Choose the visual appearance of the app.',
    lightTheme: 'Light', darkTheme: 'Dark',
    langTitle: 'Language', langDesc: 'Interface language.',
    savePrefs: 'Save preferences',
    prefsSaved: 'Preferences saved!', prefsError: 'Error saving.',

    // Ranking
    rankingTitle: 'Top 5 Developers',
    rankingSubtitle: 'Posts × 1pt + Likes × 2pts — updates in real time.',
    posts: 'posts', points: 'pts',

    // Messages
    messagesTitle: 'Messages', searchConv: 'Search conversation...',
    noConversations: "You don't have any conversations yet.",
    noConvHint: 'Go to the users list and click the message icon.',
    viewUsers: 'View users',
    selectConv: 'Select a conversation',
    selectConvHint: 'Choose a conversation on the left or start a new one.',
    writeMessage: 'Write a message...', noMessages: 'No messages',

    // Salas
    roomsTitle: 'Knowledge Rooms',
    roomsSubtitle: 'Select a room and connect with professionals at your level',
    members: 'members', noMembers: 'No members in this room yet.',
    viewProfile: 'View profile',

    // Users
    usersTitle: 'Users',
    searchUsers: 'Search by name or email...', allLevels: 'All levels',
    noUsersFound: 'No users found.',
    sendMessage: 'Message',

    // Errors
    genericError: 'Error. Please try again.',
    loginError: 'Incorrect email or password.',
    suspendedAccount: 'Account suspended. Contact the administrator.',

    // Levels
    iniciante: 'Beginner', junior: 'Junior',
    pleno: 'Mid-level', senior: 'Senior',
  },
};
