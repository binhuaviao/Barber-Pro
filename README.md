# BarberPro SaaS - Premium Management

O sistema definitivo para barbearias de alto nível, com gestão financeira, agendamentos e controle de estoque.

## 🚀 Como acessar Online

Para acessar seu projeto online a partir do GitHub, você tem duas opções principais:

### 1. GitHub Pages (Automatizado)
Eu configurei um **GitHub Action** que agora está no seu repositório. Toda vez que você fizer um "push" para a branch `main`, o GitHub irá automaticamente:
1. Criar uma nova branch chamada `gh-pages`.
2. Publicar o site online.

**Para ativar (após o commit):**
- Vá no seu repositório no GitHub.
- Vá em **Settings** > **Pages**.
- Em "Build and deployment", escolha a branch `gh-pages` e a pasta `/(root)`.
- O link aparecerá no topo desta página.

### 2. Vercel ou Netlify (Recomendado para iniciantes)
Essas plataformas são gratuitas e ótimas para React:
1. Crie uma conta no [Vercel](https://vercel.com) ou [Netlify](https://netlify.com).
2. Clique em "New Project" e conecte seu repositório do GitHub.
3. Elas detectarão que é um projeto Vite e farão tudo sozinhas.

## ⚠️ Ação Obrigatória (Firebase)
Se o seu site carregar mas o login não funcionar ou a página ficar branca, você **precisa** autorizar seu novo domínio no Firebase:
1. Vá ao [Console do Firebase](https://console.firebase.google.com/).
2. Selecione seu projeto.
3. No menu lateral, vá em **Authentication** > **Settings** (aba no topo).
4. Clique em **Authorized domains**.
5. Clique em **Add domain** e cole seu link (ex: `sistemabarberpro.netlify.app`).
6. Sem isso, o Google não permitirá que seus usuários façam login.

## 🗄️ Integração Supabase
O projeto agora conta com o SDK do Supabase configurado.
1. Vá em **Settings** e adicione as seguintes variáveis de ambiente:
   - `VITE_SUPABASE_URL`: Sua URL do Supabase.
   - `VITE_SUPABASE_ANON_KEY`: Sua chave anônima.
2. O cliente está pronto para uso em `src/lib/supabase.ts`.

## 🛠️ Execução Local

Se desejar rodar o projeto no seu computador:

1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Crie um arquivo `.env` e adicione suas chaves (veja `.env.example`).
4. Rode o comando: `npm run dev`.

---
Desenvolvido com BarberPro SaaS.
