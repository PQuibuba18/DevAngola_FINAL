# DevAngola Mobile — Guia de Build Android

## Pré-requisitos

1. Conta na [Expo](https://expo.dev) (gratuita)
2. EAS CLI instalado: `npm install -g eas-cli`
3. Login no EAS: `eas login`

## 1. Configurar o projecto EAS

```bash
cd mobile
eas init --id SEU_EAS_PROJECT_ID
```

Substitui `SUBSTITUI_PELO_EAS_PROJECT_ID` em `app.json` pelo ID devolvido.

## 2. Configurar variáveis de ambiente no EAS

```bash
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://devangola.vercel.app/api
```

## 3. Gerar APK de preview (para testes)

```bash
eas build --platform android --profile preview
```

O EAS compila na cloud. Não precisas de Android Studio nem Java.
O APK pode ser instalado directamente no telemóvel.

## 4. Gerar AAB de produção (para Play Store)

```bash
eas build --platform android --profile production
```

O AAB (Android App Bundle) é o formato exigido pela Play Store desde 2021.

## 5. Keystore

O EAS gera e gere automaticamente a keystore na primeira compilação.
**IMPORTANTE**: guarda o keystore em local seguro — sem ele não podes actualizar o app.

```bash
eas credentials
```

## 6. Publicar na Play Store

### 6.1 Google Play Console
- Cria conta em: https://play.google.com/console
- Taxa única: USD 25

### 6.2 Criar a app
- Package name: `ao.devangola.app`
- App name: DevAngola
- Content rating: Everyone (sem conteúdo impróprio)

### 6.3 Data Safety (obrigatório)
Declara na Play Console o que o app recolhe:

| Dado | Recolhido | Partilhado | Finalidade |
|---|---|---|---|
| Nome | Sim | Não | Funcionalidade do app |
| Email | Sim | Não | Conta do utilizador |
| Foto de perfil | Sim | Sim (outros utilizadores) | Funcionalidade |
| Fotos (posts) | Sim | Sim (comunidade) | Funcionalidade |
| Mensagens | Sim | Sim (destinatário) | Comunicação |
| Documentos de identidade | Sim | Não | Verificação de identidade |

**Nota sobre documentos de identidade**: o Google exige que a política de privacidade explique claramente como estes são tratados. O documento é eliminado após revisão. Declarar em Data Safety como "Sensitive info — Government IDs".

### 6.4 Permissões a declarar
- `READ_EXTERNAL_STORAGE` — selecção de imagens
- `CAMERA` — (futuro) câmara para documentos
- `INTERNET` — ligação à API
- `ACCESS_NETWORK_STATE` — verificar conectividade

### 6.5 Privacy Policy
URL obrigatória. Cria uma página em:
`https://devangola.ao/privacidade`

(Ver o ficheiro `PRIVACY_POLICY.md` para o conteúdo.)

### 6.6 Account deletion
A Play Store exige que o utilizador possa eliminar a conta:
- Dentro do app (botão nas definições) — a implementar
- Via URL: `https://devangola.ao/eliminar-conta`

### 6.7 Processo de publicação
1. Internal testing → 1-2 revisores (tu e equipa)
2. Closed testing → 20-100 utilizadores convidados
3. Open testing → qualquer pessoa
4. Production → disponível para todos

Cada fase requer aprovação do Google (normalmente 1-3 dias).

## 7. Versões subsequentes

Para actualizar o app:
1. Aumenta `versionCode` e `version` em `app.json`
2. `eas build --platform android --profile production`
3. Faz upload do novo AAB na Play Console

## 8. Sobre a keystore

A keystore assina o APK/AAB. Uma vez na Play Store, **o package name e a keystore são permanentes**.
Se perderes a keystore, não podes actualizar o app — tens de criar um novo app com outro package name.

O EAS guarda automaticamente no servidor deles (podes fazer download com `eas credentials`).
Guarda também uma cópia local em local seguro (não no repositório Git).
