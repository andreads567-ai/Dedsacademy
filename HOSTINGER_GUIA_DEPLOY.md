# Guia Oficial de Deploy e Sincronização na Hostinger (Deds Academy)

Este guia prático e passo a passo explica como sincronizar o projeto do **GitHub** diretamente com a **Hostinger**, após a desativação do **Supabase** e da **Vercel**.

---

## 📌 Resumo das Alterações Feitas na Plataforma

1. **Supabase Desativado**:
   - Todo o banco de dados (cursos, categorias, cupons, banners, comunicados, blog, usuários/alunos e certificados oficiais emitidos) agora é armazenado e gerenciado de forma segura e local no servidor da Hostinger no arquivo:
     `data/platform-store.json`
   - O sistema também mantém cache resiliente no navegador (`localStorage`) para velocidade máxima e funcionamento contínuo.
   - Nenhuma chamada externa ao Supabase é mais realizada.

2. **Vercel Desativada**:
   - O servidor Express (`server.ts`) foi compilado para produção e agora processa nativamente **todas** as requisições de API:
     - `/api/create-checkout-session` (Stripe)
     - `/api/stripe-webhook` (Confirmação de matrícula imediata)
     - `/api/zoho-auth`, `/api/zoho-refresh`, `/api/zoho-send-email` (E-mails transacionais Zoho)
     - `/api/issue-certificate` (Emissão sequencial de certificados)
     - `/api/validate-certificate` (Consulta e validação instantânea de autenticidade)
     - `/api/platform-sync` (Sincronização em tempo real entre navegadores e ADM)
     - `/api/upload-image` (Upload físico de fotos e banners)
     - Entrega do Frontend SPA e do Gerador Oficial de Certificados.

3. **Arquivos de Produção Gerados**:
   - `server.js` (Entry point raiz para o Node.js da Hostinger)
   - `public/.htaccess` (Regras de redirecionamento HTTPS, SPA routing para evitar erros 404 ao recarregar a página, compressão e cache)

---

## 🚀 Método 1: Hospedagem Completa com Node.js na Hostinger (Recomendado)

Utilize este método se você possui um plano **Hostinger Cloud**, **VPS** ou **Hospedagem Business / Turbo** que possua o recurso de aplicação **Node.js** no hPanel.

### Passo 1: Configurar a Aplicação Node.js no hPanel
1. Acesse o [hPanel da Hostinger](https://hpanel.hostinger.com).
2. Vá em **Sites** -> clique em **Gerenciar** no seu domínio.
3. No menu lateral esquerdo ou na barra de busca, procure por **Node.js**.
4. Clique em **Criar Aplicativo**:
   - **Versão do Node.js**: Selecione **20.x** (ou **18.x**).
   - **Diretório raiz do aplicativo**: Deixe o padrão (geralmente `/domains/seudominio.com/public_html` ou `/apps/dedsacademy`).
   - **Arquivo de inicialização**: Digite `server.js` (ou `dist/server.js`).
5. Clique em **Criar**.

### Passo 2: Configurar as Variáveis de Ambiente no Painel
Na aba **Variáveis de Ambiente** da sua aplicação Node.js na Hostinger, adicione:
- `PORT` = `3000` (ou a porta indicada pelo painel)
- `APP_URL` = `https://seudominio.com`
- `VITE_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
- `STRIPE_SECRET_KEY` = `rk_live_...`
- `STRIPE_WEBHOOK_SECRET` = `whsec_...`
- `GEMINI_API_KEY` = `sua_chave_gemini` (se for utilizar IA)
- Credenciais Zoho (`ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, etc. se for disparar e-mails via Zoho)

### Passo 3: Compilar e Iniciar a Aplicação
No terminal SSH da Hostinger (ou via console do hPanel):
```bash
npm install
npm run build
npm start
```
*Dica*: O comando `npm run build` agora compila tanto o frontend Vite quanto o servidor Node.js otimizado em `dist/server.js`.

---

## 🔄 Método 2: Sincronização Automática Contínua com o GitHub (Git Auto-Deploy)

Como seu repositório já está no GitHub (`andreads567-ai/Dedsacademy`), você pode fazer com que a Hostinger puxe automaticamente as atualizações toda vez que você der um `git push`.

### Passo 1: Conectar o Git no hPanel
1. No hPanel da Hostinger, procure por **Git** na seção **Avançado**.
2. Preencha os campos:
   - **URL do Repositório**: `https://github.com/andreads567-ai/Dedsacademy.git`
   - **Ramo (Branch)**: `main`
   - **Instalar em diretório**: `/public_html` (ou o diretório do seu app)
3. Clique em **Criar**.
4. O hPanel baixará o código do GitHub pela primeira vez.

### Passo 2: Ativar o Webhook no GitHub (Deploy Automático)
1. Na lista de repositórios do Git na Hostinger, localize a opção **Webhook URL** e copie o link fornecido.
2. Acesse seu repositório no GitHub: `https://github.com/andreads567-ai/Dedsacademy`.
3. Vá em **Settings** -> **Webhooks** -> clique no botão **Add webhook**.
4. Cole o link no campo **Payload URL**.
5. Em **Content type**, selecione `application/json`.
6. Deixe a opção **Just the push event** selecionada.
7. Clique em **Add webhook**.

🎉 **Pronto!** A partir de agora, qualquer alteração enviada para o GitHub com `git push` será sincronizada automaticamente com a Hostinger.

---

## 🌐 Método 3: Hospedagem Compartilhada Estática (Apache / LiteSpeed)

Se o seu plano na Hostinger for compartilhado básico sem Node.js e você quiser hospedar o frontend de forma estática:

1. No seu computador, execute:
   ```bash
   npm run build
   ```
2. A pasta `dist/` conterá:
   - `index.html`
   - Pasta `assets/` (CSS, JS otimizados)
   - `.htaccess` (Configurado automaticamente com regras de SPA para que recarregar `/aluno` ou `/admin` não dê tela 404)
   - Pasta `certificate-generator/`
   - Pasta `uploads/`
3. Acesse o **Gerenciador de Arquivos** da Hostinger.
4. Abra a pasta `public_html`.
5. Envie todo o **conteúdo** da pasta `dist/` diretamente para dentro da pasta `public_html`.

---

## 🛡️ Dicas Importantes de Persistência

- **Pasta `data/`**: Contém o arquivo `data/platform-store.json`. Caso precise fazer backup manual do banco de dados de cursos, alunos e certificados, basta fazer o download deste arquivo pelo Gerenciador de Arquivos da Hostinger.
- **Pasta `public/uploads/`**: Contém as imagens e banners carregados via painel ADM. Ao realizar deploys manuais, certifique-se de preservar essa pasta para não perder imagens adicionadas pelos usuários.
