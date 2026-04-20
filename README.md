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

## 🛠️ Execução Local

Se desejar rodar o projeto no seu computador:

1. Clone o repositório.
2. Instale as dependências: `npm install`.
3. Crie um arquivo `.env` e adicione suas chaves (veja `.env.example`).
4. Rode o comando: `npm run dev`.

---
Desenvolvido com BarberPro SaaS.
