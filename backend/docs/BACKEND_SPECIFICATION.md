# 📘 Especificação Arquitetural e Documentação do Backend
## Plataforma CLM: Mais Contratos — Grupo RioMais S.A.

---

## 1. Visão Geral da Arquitetura

O backend do **Mais Contratos** foi projetado sob os princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**, suportando alta disponibilidade, integridade jurídica probatória (ICP-Brasil), auditoria imutável e conectividade com os ecossistemas corporativos legados e modernos do **Grupo RioMais S.A.**.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          APLICAÇÕES CLIENTES                           │
│     React SPA (Vite)  •  Apps Mobile/PWA  •  Consumidores Externos     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST / WSS
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   API GATEWAY & SEGURANÇA (Express.js)                 │
│  Rate Limiting • CORS • Helmet • Auth Middleware (JWT/2FA) • RBAC Gate │
└───────┬───────────────────────────┬────────────────────────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌──────────────┐           ┌────────────────┐           ┌────────────────┐
│  MÓDULO CLM  │           │   GOVERNANÇA   │           │ MOTOR DE IA    │
│  Contratos   │           │   Auditoria    │           │ Gemini 3.8     │
│  Aditivos    │           │   Compliance   │           │ Análise Risco  │
│  Fornecedores│           │   Alçadas/Tiers│           │ Extrator SLA   │
└───────┬──────┘           └────────┬───────┘           └────────┬───────┘
        │                           │                            │
        ▼                           ▼                            ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     CAMADA DE INTEGRAÇÕES EXTERNAS                     │
│  BrasilAPI/RFB • DocuSign/Clicksign • SAP/TOTVS • Slack/Teams • SMTP  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   PERSISTÊNCIA & STORAGE DISTRIBUÍDO                   │
│   PostgreSQL (Cloud SQL) • Drizzle ORM • Google Drive / SharePoint     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Modelo Relacional e Esquema do Banco de Dados (PostgreSQL)

O banco relacional adota chaves primárias UUIDv4, campos de carimbo de data/hora (`created_at`, `updated_at`, `deleted_at` para soft-delete) e restrições estritas de chave estrangeira.

### 2.1. Diagrama Entidade-Relacionamento (Tabelas Principais)

```text
[users] 1 ────────── N [contracts] 1 ────────── N [contract_attachments]
   │                       │
   │                       ├──────────── N [contract_signers]
   │                       ├──────────── N [contract_clauses]
   │                       └──────────── N [contract_amendments]
   │
   ├────────── N [audit_logs]
   │
[suppliers] 1 ─────── N [contracts]
   │
   └────────── N [supplier_compliance_history]

[api_keys] 1 ──────── N [api_key_usage_logs]
[webhooks] 1 ──────── N [webhook_deliveries]
```

### 2.2. DDL SQL (Definição de Tabelas)

```sql
-- Extensões obrigatórias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tabela de Usuários e Governança RBAC
CREATE TYPE user_role_enum AS ENUM ('administrador', 'editor', 'visualizador');
CREATE TYPE user_status_enum AS ENUM ('ativo', 'pendente', 'bloqueado');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'visualizador',
    department VARCHAR(100) NOT NULL,
    job_title VARCHAR(100),
    document_number VARCHAR(20),
    document_type VARCHAR(20) DEFAULT 'CPF',
    status user_status_enum NOT NULL DEFAULT 'ativo',
    two_factor_secret VARCHAR(255),
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    signature_initials VARCHAR(10),
    icp_cert_serial VARCHAR(100),
    icp_cert_valid_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Fornecedores e Compliance
CREATE TYPE risk_level_enum AS ENUM ('baixo', 'medio', 'alto');
CREATE TYPE supplier_status_enum AS ENUM ('ativo', 'homologacao', 'bloqueado');

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cnpj VARCHAR(18) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(30),
    cnae_principal VARCHAR(20),
    cnae_descricao TEXT,
    contact_name VARCHAR(150),
    contact_role VARCHAR(100),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    risk_level risk_level_enum DEFAULT 'baixo',
    compliance_score INT DEFAULT 100,
    status supplier_status_enum DEFAULT 'homologacao',
    status_reason TEXT,
    last_synced_rfb_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela Principal de Contratos
CREATE TYPE contract_status_enum AS ENUM ('ativo', 'em_aprovacao', 'vencido', 'renovacao', 'cancelado');

CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    category VARCHAR(100) NOT NULL,
    status contract_status_enum NOT NULL DEFAULT 'em_aprovacao',
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_value NUMERIC(15, 2) NOT NULL,
    monthly_value NUMERIC(15, 2),
    department VARCHAR(100) NOT NULL,
    responsible_user_id UUID REFERENCES users(id),
    cost_center VARCHAR(50),
    payment_terms VARCHAR(255),
    adjustment_index VARCHAR(20) DEFAULT 'IPCA',
    auto_renew BOOLEAN DEFAULT FALSE,
    notification_email VARCHAR(255),
    notify_on_expiration BOOLEAN DEFAULT TRUE,
    notify_on_status_change BOOLEAN DEFAULT TRUE,
    ai_risk_level risk_level_enum DEFAULT 'baixo',
    ai_risk_score INT DEFAULT 20,
    ai_executive_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Signatários e Envelopes de Assinatura (DocuSign / Clicksign)
CREATE TYPE signature_status_enum AS ENUM ('pendente', 'assinado', 'recusado');
CREATE TYPE auth_method_enum AS ENUM ('email_token', 'sms_token', 'whatsapp_token', 'icp_brasil_a1', 'icp_brasil_a3');

CREATE TABLE contract_signers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    cpf VARCHAR(14),
    role VARCHAR(50) NOT NULL, -- signatario, testemunha, aprovador
    order_index INT DEFAULT 1,
    auth_method auth_method_enum DEFAULT 'email_token',
    status signature_status_enum DEFAULT 'pendente',
    signed_at TIMESTAMP WITH TIME ZONE,
    envelope_id VARCHAR(100),
    signature_hash VARCHAR(255)
);

-- 5. Anexos e Garantia Probatória SHA-256
CREATE TABLE contract_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_provider VARCHAR(50) NOT NULL, -- google_drive, sharepoint, s3
    storage_file_id VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    version INT DEFAULT 1,
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Trilha Imutável de Auditoria Forense (Compliance & LGPD)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    user_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255),
    role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    detail TEXT NOT NULL,
    resource VARCHAR(255),
    resource_type VARCHAR(50), -- contrato, fornecedor, seguranca, sistema
    resource_id UUID,
    ip_address VARCHAR(45),
    geo_location VARCHAR(100),
    type VARCHAR(50) NOT NULL, -- security, contract, supplier, permission
    severity risk_level_enum DEFAULT 'baixo',
    diff_json JSONB,
    integrity_hash VARCHAR(64) NOT NULL, -- Hash encadeado (Merkle Tree)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Webhooks e Chaves de API
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    key_prefix VARCHAR(30) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    environment VARCHAR(20) NOT NULL DEFAULT 'producao',
    scope VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    created_by UUID REFERENCES users(id),
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    url TEXT NOT NULL,
    secret_key VARCHAR(100) NOT NULL,
    events TEXT[] NOT NULL,
    status VARCHAR(20) DEFAULT 'ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Especificação dos Endpoints da API RESTful

Todos os endpoints utilizam formato JSON, prefixo `/api/v1` e autenticação via cabeçalho `Authorization: Bearer <jwt_token>`.

### 3.1. Autenticação & Sessão (`/api/v1/auth`)

| Método | Rota | Descrição | Nível RBAC |
|---|---|---|---|
| `POST` | `/api/v1/auth/login` | Login com e-mail e senha corporativa | Público |
| `POST` | `/api/v1/auth/2fa/verify` | Validação de token TOTP (Authenticator) | Público c/ pré-auth |
| `POST` | `/api/v1/auth/refresh` | Renovação de Access Token via Refresh Token | Autenticado |
| `POST` | `/api/v1/auth/logout` | Revogação de token e encerramento de sessão | Autenticado |
| `GET` | `/api/v1/auth/me` | Retorna o perfil completo do usuário logado | Autenticado |

#### Exemplo de Requisição: `POST /api/v1/auth/login`
```json
{
  "email": "lucas.teles@gruporiomais.com.br",
  "password": "SenhaCorporativaForte#2025"
}
```
#### Exemplo de Resposta (200 OK):
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "d8e3b7c2-8419-4a9f-9c02-23f2b4c1a5b8",
  "expiresIn": 28800,
  "user": {
    "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "name": "Lucas Teles",
    "email": "lucas.teles@gruporiomais.com.br",
    "role": "administrador",
    "department": "Diretoria Jurídica e Governança"
  }
}
```

---

### 3.2. Contratos (`/api/v1/contracts`)

| Método | Rota | Descrição | Nível RBAC |
|---|---|---|---|
| `GET` | `/api/v1/contracts` | Listagem com filtros de status, vigência e busca | Visualizador+ |
| `GET` | `/api/v1/contracts/:id` | Detalhes completos, cláusulas e signatários | Visualizador+ |
| `POST` | `/api/v1/contracts` | Cadastro de novo instrumento contratual | Editor+ |
| `PUT` | `/api/v1/contracts/:id` | Atualização de termos, vigência e e-mails | Editor+ |
| `DELETE` | `/api/v1/contracts/:id` | Exclusão lógica (soft delete) com log | Administrador |
| `POST` | `/api/v1/contracts/:id/signature-envelope` | Despacho para DocuSign/Clicksign ICP | Editor+ |
| `POST` | `/api/v1/contracts/:id/analyze-ai` | Execução de análise jurídica com Gemini | Editor+ |

#### Exemplo de Resposta: `GET /api/v1/contracts/CTR-2025-089`
```json
{
  "id": "c1f7a012-789a-4b12-98ab-45cd67ef8901",
  "code": "CTR-2025-089",
  "title": "Prestação de Serviços de Computação em Nuvem e Data Center",
  "supplier": {
    "id": "a901bc34-12de-45f6-7890-bcdef1234567",
    "razaoSocial": "Amazon Serviços de Varejo e Cloud Brasil Ltda.",
    "cnpj": "23.412.348/0001-90"
  },
  "totalValue": 1200000.00,
  "status": "ativo",
  "startDate": "2025-01-15",
  "endDate": "2026-01-14",
  "daysRemaining": 112,
  "aiRiskLevel": "baixo",
  "aiRiskScore": 25,
  "signers": [
    {
      "name": "Lucas Teles",
      "email": "lucas.teles@gruporiomais.com.br",
      "status": "assinado",
      "signedAt": "2025-01-14T15:20:00Z"
    }
  ]
}
```

---

### 3.3. Fornecedores (`/api/v1/suppliers`)

| Método | Rota | Descrição | Nível RBAC |
|---|---|---|---|
| `GET` | `/api/v1/suppliers` | Listagem com status de homologação e risco | Visualizador+ |
| `POST` | `/api/v1/suppliers` | Homologação de novo fornecedor | Editor+ |
| `GET` | `/api/v1/suppliers/rfb-lookup/:cnpj` | Consulta em tempo real à Receita Federal | Editor+ |
| `PUT` | `/api/v1/suppliers/:id` | Atualização cadastral ou bloqueio societário | Editor+ |
| `DELETE` | `/api/v1/suppliers/:id` | Exclusão do cadastro de fornecedor | Administrador |

---

### 3.4. Auditoria Forense e Compliance (`/api/v1/audit`)

| Método | Rota | Descrição | Nível RBAC |
|---|---|---|---|
| `GET` | `/api/v1/audit/logs` | Listagem paginada da trilha de auditoria | Administrador |
| `GET` | `/api/v1/audit/export/csv` | Exportação de logs forenses em CSV/Excel | Administrador |
| `GET` | `/api/v1/audit/verify-integrity` | Verificação do hash criptográfico dos registros | Administrador |

---

### 3.5. Integrações Corporativas & Hub (`/api/v1/integrations`)

| Método | Rota | Descrição | Nível RBAC |
|---|---|---|---|
| `GET` | `/api/v1/integrations/health` | Diagnóstico de latência e status dos 7 conectores | Visualizador+ |
| `POST` | `/api/v1/integrations/:id/test` | Teste de conectividade e ping ativo (em ms) | Administrador |
| `POST` | `/api/v1/integrations/:id/sync` | Disparo manual de sincronização de dados | Administrador |
| `POST` | `/api/v1/webhooks/incoming/:provider` | Endpoint receptor de webhooks (DocuSign/SAP) | Assinatura HMAC |

---

## 4. Arquitetura de Serviços e Camada de Domínio

O backend é organizado nas seguintes camadas em TypeScript:

```text
src/
├── controllers/            # Controladores HTTP (validação de entrada e status)
│   ├── authController.ts
│   ├── contractController.ts
│   ├── supplierController.ts
│   └── auditController.ts
├── services/               # Regras de Negócio e Casos de Uso
│   ├── contractService.ts
│   ├── complianceService.ts
│   ├── alertDispatcherService.ts
│   └── auditLogService.ts
├── repositories/           # Camada de Acesso a Dados (Drizzle ORM / SQL)
│   ├── contractRepository.ts
│   ├── supplierRepository.ts
│   └── auditRepository.ts
├── integrations/           # Conectores Externos (Já implementados)
│   ├── receita-federal/    # BrasilAPI / RFB
│   ├── signatures/         # DocuSign / Clicksign
│   ├── erp/                # SAP S/4HANA / TOTVS Protheus
│   ├── communication/      # Slack / Teams
│   ├── email/              # SMTP / SendGrid
│   ├── storage/            # Google Drive / SharePoint
│   └── gemini/             # Google Gemini 3.8 Flash
└── jobs/                   # Agendadores Cron e Workers em Segundo Plano
    ├── contractExpirationWatcher.ts
    ├── erpSyncWorker.ts
    └── documentMirrorWorker.ts
```

---

## 5. Rotinas em Segundo Plano e Workers (Cron Jobs)

O sistema conta com 4 processos assíncronos fundamentais executados via filas (Redis / BullMQ ou pg-boss):

1. **`ContractExpirationWatcher` (Diário às 06:00 BRT)**:
   - Identifica contratos a vencer em exatamente **60, 30, 15, 7 e 1 dias**.
   - Dispara e-mails transacionais com template HTML oficial RioMais.
   - Envia mensagens Block Kit no Slack (`#contratos-riomais`) e Adaptive Cards no Teams.
   - Registra o evento na trilha de auditoria.

2. **`ErpFinancialSyncWorker` (A cada 2 horas)**:
   - Sincroniza Pedidos de Compra (PO) no SAP S/4HANA e TOTVS Protheus.
   - Audita o valor faturado acumulado contra o teto contratual estipulado.
   - Dispara alarme caso o consumo financeiro ultrapasse 90% do total aprovado.

3. **`DocumentIntegrityWorker` (Semanal)**:
   - Recalcula o hash SHA-256 de todas as minutas e certidões armazenadas no Google Drive/SharePoint.
   - Valida a consistência criptográfica contra a tabela `contract_attachments`.

4. **`RfbComplianceWorker` (Mensal)**:
   - Revalida o status cadastral de todos os fornecedores ativos na Receita Federal para capturar eventuais suspensões ou inaptidões.

---

## 6. Segurança, Governança e Conformidade (LGPD & ICP-Brasil)

- **Senhas e Segredos**: Criptografia com `Argon2id` ou `bcrypt` (fator de custo 12). Segredos de API armazenados em variáveis de ambiente gerenciadas (GCP Secret Manager).
- **Trilha Probatória de Assinatura**: Geração de carimbo de tempo com hash SHA-256 e conformidade com a MP 2.200-2/2001 (ICP-Brasil).
- **Prevenção de Ataques**:
  - `helmet` para cabeçalhos HTTP de segurança (HSTS, CSP, X-Frame-Options).
  - Rate limiting distribuído: 100 requisições/min por IP corporativo.
  - Sanitização de inputs contra SQL Injection (consultas parametrizadas via ORM).
- **Proteção de Dados (LGPD)**: Anonimização de dados sensíveis de contato de signatários após expiração do prazo prescricional de guarda jurídica (5 anos).

---

## 7. Instruções para Implementação e Deploy Full-Stack

Para inicializar o servidor backend no ambiente:

```bash
# 1. Dependências do servidor (já configuradas)
npm install express dotenv @google/genai

# 2. Inicialização do servidor em desenvolvimento
npx tsx server.ts
```

O servidor Express monta os middlewares de rotas de API em `/api/*` e serve a aplicação React através de `vite.middlewares`, mantendo a porta única **3000** em conformidade com os requisitos de execução da plataforma.
