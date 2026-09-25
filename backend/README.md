# 🚀 Mais Contratos - Backend REST API

API REST Corporativa construída em **Node.js**, **Express**, **TypeScript** e **Firebase Firestore**, responsável pelo gerenciamento de dados de contratos, fornecedores homologados, colaboradores (RBAC), trilha de auditoria imutável e métricas executivas.

---

## 📁 Estrutura do Repositório Backend

```bash
backend/
├── src/
│   ├── routes/
│   │   ├── contracts.ts    # Rotas CRUD de Contratos + Auditoria
│   │   ├── suppliers.ts    # Rotas CRUD de Fornecedores + Homologação
│   │   ├── users.ts        # Gestão de Colaboradores e RBAC
│   │   ├── audit.ts        # Trilha de Auditoria
│   │   ├── settings.ts     # Configurações do Sistema
│   │   └── stats.ts        # Métricas e KPIs Consolidados
│   ├── apiRouter.ts        # Roteador Gateway (/api/...)
│   ├── db.ts               # Camada de Persistência Firestore
│   ├── initialData.ts      # Dados padrão e sementes iniciais
│   ├── types.ts            # Tipagens TypeScript completas
│   └── server.ts           # Inicialização do Servidor Express
├── firebase-applet-config.json
├── firestore.rules
├── Dockerfile
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 🛠️ Como Publicar este Backend em um Novo Repositório no GitHub

Execute os comandos abaixo a partir do diretório `backend`:

```bash
# 1. Navegue até a pasta do backend
cd backend

# 2. Inicialize o repositório git
git init

# 3. Adicione todos os arquivos
git add .

# 4. Crie o primeiro commit
git commit -m "feat: initial commit - mais contratos backend rest api"

# 5. Renomeie a branch para main (se necessário)
git branch -M main

# 6. Conecte ao seu novo repositório no GitHub (substitua pela sua URL)
git remote add origin https://github.com/SEU_USUARIO/mais-contratos-backend.git

# 7. Envie os arquivos para o GitHub
git push -u origin main
```

---

## 💻 Como Rodar Localmente

### 1. Instalar as Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Edite o `.env` conforme necessário:
```env
PORT=5000
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
NODE_ENV=development
```

### 3. Iniciar em Modo de Desenvolvimento
```bash
npm run dev
```
O servidor estará disponível em: `http://localhost:5000`

---

## 📡 Endpoints da API REST

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/health` | Status de integridade e versão da API |
| `GET` | `/api/contracts` | Listar todos os contratos vigentes |
| `GET` | `/api/contracts/:id` | Detalhar contrato específico |
| `POST` | `/api/contracts` | Criar novo contrato (com log de auditoria automático) |
| `PUT` | `/api/contracts/:id` | Atualizar dados do contrato |
| `DELETE`| `/api/contracts/:id` | Remover contrato do sistema |
| `GET` | `/api/suppliers` | Listar fornecedores cadastrados |
| `POST` | `/api/suppliers` | Homologar novo fornecedor |
| `PUT` | `/api/suppliers/:id` | Atualizar informações do parceiro |
| `DELETE`| `/api/suppliers/:id` | Descredenciar fornecedor |
| `GET` | `/api/users` | Listar colaboradores e permissões |
| `POST` | `/api/users` | Convidar/cadastrar novo colaborador |
| `PUT` | `/api/users/:id` | Alterar perfil de acesso (RBAC) ou status |
| `DELETE`| `/api/users/:id` | Revogar credencial de colaborador |
| `GET` | `/api/audit` | Trilha de auditoria cronológica |
| `POST` | `/api/audit` | Registrar evento de auditoria manual |
| `GET` | `/api/stats` | Agrupamento de KPIs e estatísticas do dashboard |
| `GET` | `/api/settings` | Obter configurações corporativas |
| `PUT` | `/api/settings` | Salvar configurações corporativas |

---

## 🐳 Execução via Docker

```bash
# Construir imagem
docker build -t mais-contratos-backend .

# Executar contêiner
docker run -p 5000:5000 --name backend-api mais-contratos-backend
```

---

## ☁️ Deploy em Nuvem (Render / Railway / Cloud Run)

- **Render**: Conecte o repositório GitHub, escolha **Web Service**, defina Build Command como `npm install && npm run build` e Start Command como `npm run start`.
- **Railway**: Conecte o repositório; o Railway detectará o `Dockerfile` automaticamente.
- **Google Cloud Run**: Use o `gcloud run deploy --source .` para provisionar o contêiner instantaneamente.
