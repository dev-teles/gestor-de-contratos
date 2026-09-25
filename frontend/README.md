# 💻 Mais Contratos - Frontend Web Application

Frontend SPA moderno para o sistema corporativo **Mais Contratos**, desenvolvido em **React 18**, **TypeScript**, **Tailwind CSS v4** e **Vite**.

A interface é 100% desacoplada e se comunica com o backend exclusivamente via API REST tipada.

---

## 📁 Estrutura do Repositório Frontend

```bash
frontend/
├── src/
│   ├── components/      # Componentes de UI modulares
│   │   ├── ContractsListView.tsx
│   │   ├── ContractDetailView.tsx
│   │   ├── SuppliersView.tsx
│   │   ├── CollaboratorsView.tsx
│   │   ├── DashboardView.tsx
│   │   ├── AuditLogsView.tsx
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── services/
│   │   └── api.ts       # Cliente HTTP REST para consumo do Backend
│   ├── types.ts         # Tipos e interfaces compartilhados
│   ├── App.tsx          # Aplicação principal
│   ├── main.tsx         # Ponto de montagem React
│   └── index.css        # Tailwind CSS
├── index.html           # Ponto de entrada HTML
├── vite.config.ts       # Configuração do Vite com proxy para o Backend
├── tsconfig.json        # Configuração do TypeScript
├── package.json
└── .env.example
```

---

## 🛠️ Como Publicar este Frontend em um Novo Repositório no GitHub

Execute os comandos abaixo a partir do diretório `frontend`:

```bash
# 1. Navegue até a pasta do frontend
cd frontend

# 2. Inicialize o repositório git
git init

# 3. Adicione todos os arquivos
git add .

# 4. Crie o primeiro commit
git commit -m "feat: initial commit - mais contratos frontend spa"

# 5. Renomeie a branch para main (se necessário)
git branch -M main

# 6. Conecte ao seu novo repositório no GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/mais-contratos-frontend.git

# 7. Envie os arquivos para o GitHub
git push -u origin main
```

---

## 💻 Como Rodar Localmente

### 1. Instalar as Dependências
```bash
npm install
```

### 2. Configurar a Conexão com o Backend
Copie o `.env.example`:
```bash
cp .env.example .env
```

No arquivo `.env`, aponte para o backend em execução:
```env
# URL da sua API Backend (quando rodando localmente)
VITE_API_URL=http://localhost:5000
```

> **Dica**: O arquivo `vite.config.ts` já conta com proxy configurado. Chamadas para `/api/*` serão redirecionadas automaticamente para o backend configurado em `VITE_API_URL`.

### 3. Iniciar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: `http://localhost:3000` (ou a porta informada pelo Vite).

---

## 🚀 Como Fazer o Build para Produção

```bash
npm run build
```
Os arquivos estáticos otimizados serão gerados na pasta `dist/`.

---

## ☁️ Deploy em Nuvem

### Deploy na Vercel
1. Conecte o repositório `mais-contratos-frontend` na Vercel.
2. Em **Environment Variables**, adicione:
   - `VITE_API_URL`: URL pública da sua API Backend (ex: `https://seu-backend.onrender.com`).
3. Clique em **Deploy**.

### Deploy no Netlify
1. Conecte o repositório no Netlify.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Adicione a variável de ambiente `VITE_API_URL` apontando para o backend.
