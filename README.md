<<<<<<< HEAD
<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/88c68863-257f-4619-8ce0-e336bc466fb9

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
=======
# Mais Contratos

> **Plataforma Corporativa de Gestão do Ciclo de Vida de Contratos (CLM), Governança de Fornecedores e Controle de Vencimentos.**

[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Proprietary-blue.svg)](#)

---

##  Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Funcionalidades Principais](#-funcionalidades-principais)
  - [1. Dashboard Executivo & Analítico](#1-dashboard-executivo--analítico)
  - [2. Gestão de Contratos (CLM)](#2-gestão-de-contratos-clm)
  - [3. Diretório & Homologação de Fornecedores](#3-diretório--homologação-de-fornecedores)
  - [4. Trilha de Auditoria Imutável (SHA-256)](#4-trilha-de-auditoria-imutável-sha-256)
  - [5. Governança, Segurança & RBAC](#5-governança-segurança--rbac)
  - [6. Alertas e Notificações Automatizadas](#6-alertas-e-notificações-automatizadas)
- [Arquitetura & Tecnologias](#-arquitetura--tecnologias)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação e Execução](#-instalação-e-execução)
- [Matriz de Acessos (RBAC)](#-matriz-de-acessos-rbac)
- [Segurança & Compliance](#-segurança--compliance)
- [Licença](#-licença)

---

##  Sobre o Projeto

O **Mais Contratos** é uma solução completa para centralizar e otimizar toda a esteira de instrumentos contratuais corporativos, fornecedores homologados e fluxos de renovação. O sistema mitiga riscos de perda de prazos de rescisão ou reajuste, previne pagamentos indevidos, garante conformidade regulatória (LGPD e ICP-Brasil) e confere rastreabilidade ponta a ponta por meio de trilhas de auditoria criptográficas.

---

##  Funcionalidades Principais

### 1. Dashboard Executivo & Analítico
- **Visão Geral**:
  - Indicadores em tempo real: *Contratos Ativos*, *A Vencer (30/60 dias)*, *Sem Assinatura* e *Valor Total Sob Gestão*.
  - Painéis de prioridades e ação imediata para renovações e cobranças.
- **Gráficos & Distribuição**:
  - Gráfico Donut (*Recharts*) de distribuição por status (Vigentes, A Vencer, Pendentes e Em Renovação).
  - Gráfico de Barras horizontal para alocação orçamentária e volumetria por macrocategoria (TI, Facilities, Logística, etc.).
- **Prazos & Vencimentos**:
  - Linha do tempo com filtros dinâmicos de criticidade (`< 30 dias`, `30 a 60 dias` e regular).
  - Disparo de renovação com um clique.
- **Movimentações & Auditoria**:
  - Resumo de integridade criptográfica SHA-256 e visualização rápida dos últimos eventos operacionais.

### 2. Gestão de Contratos (CLM)
- Cadastro detalhado com metadados jurídicos: número de contrato, fornecedor, categoria, vigência, índice de reajuste (IPCA, IGP-M), valor mensal e valor global.
- Suporte a termos aditivos, controle de retenções técnicas e garantias contratuais.
- Visualização de minutas contratuais e histórico de assinaturas digitais.
- Busca global instantânea (`Ctrl + K` / `⌘ + K`) e filtros avançados por status, departamento e data de término.
- Exportação de relatórios gerenciais e dados tabulares.

### 3. Diretório & Homologação de Fornecedores
- Centralização cadastral: Razão Social, Nome Fantasia, CNPJ, Inscrição Estadual e contatos chave.
- Indicador visual de risco de compliance (baixo, médio e alto).
- Vínculo direto de contratos vigentes e cálculo do volume financeiro consolidado por parceiro.
- Status de homologação cadastral e checagem de certidões negativas.

### 4. Trilha de Auditoria Imutável (SHA-256)
- Log detalhado de todas as operações sensíveis (criação, edição, exclusão de minutas, alterações de permissão e logins).
- Cada registro armazena: carimbo de data/hora, operador responsável, recurso afetado, endereço IP e *hash* criptográfico SHA-256 inviolável.
- Exportação de relatórios periciais de conformidade.

### 5. Governança, Segurança & RBAC
- Controle de Acesso Baseado em Papéis (*Role-Based Access Control*):
  - **Administrador**: Acesso irrestrito a configurações, segurança corporativa, usuários e auditoria.
  - **Editor**: Operação completa de contratos, minutas e fornecedores, sem acesso à gestão de usuários e logs criptográficos.
  - **Visualizador**: Consulta estrita aos instrumentos contratuais e relatórios (somente leitura).
- Autenticação em Dois Fatores (2FA), integração SSO/SAML, lista branca (*whitelist*) de IPs e rotação periódica de credenciais.
- Gestão de Chaves de API REST e Webhooks corporativos.

### 6. Alertas e Notificações Automatizadas
- Monitor de expiração proativo via hook React (`useContractExpirationMonitor`), disparando alertas automáticos em 60, 30 e 15 dias antes do vencimento.
- Simulador visual de emails e disparos de alerta para teste de alçadas de notificação.

---

##  Arquitetura & Tecnologias

A aplicação utiliza uma arquitetura moderna, tipada de ponta a ponta e otimizada para alta performance:

- **Frontend Core**: [React 19](https://react.dev/) com componentes funcionais e hooks customizados.
- **Tipagem Estrita**: [TypeScript 5.8](https://www.typescriptlang.org/) para segurança de tipos e contratos de dados.
- **Estilização**: [Tailwind CSS v4](https://tailwindcss.com/) com design system corporativo e suporte nativo a Dark Mode.
- **Visualização de Dados**: [Recharts 3.x](https://recharts.org/) para gráficos interativos de alta fidelidade.
- **Ícones & Design**: [Lucide React](https://lucide.dev/) e [Google Material Symbols Outlined](https://fonts.google.com/icons).
- **Animações**: [Motion](https://motion.dev/) para microinterações fluidas e transições suaves de abas.
- **Build Tool**: [Vite 6](https://vitejs.dev/) com compilação ultrarrápida.

---

##  Estrutura de Pastas

```text
├── public/                     # Ativos estáticos públicos
├── src/
│   ├── components/             # Componentes modulares da interface
│   │   ├── AuditLogView.tsx       # Visão completa da trilha de auditoria
│   │   ├── ConfirmationModal.tsx  # Diálogos modais de confirmação
│   │   ├── ContractDetailView.tsx # Detalhamento completo do contrato e minutas
│   │   ├── ContractsListView.tsx  # Listagem, busca e cadastro de contratos
│   │   ├── DashboardView.tsx      # Dashboard executivo com as 4 sub-abas
│   │   ├── Header.tsx             # Barra de navegação superior e perfil
│   │   ├── ProfileView.tsx        # Perfil do usuário e credencial digital ICP
│   │   ├── SearchModal.tsx        # Modal de busca global (Ctrl+K)
│   │   ├── SettingsView.tsx       # Configurações de sistema, RBAC e integrações
│   │   ├── Sidebar.tsx            # Navegação lateral expansível/recolhível
│   │   ├── SimulatedAlertModal.tsx# Simulador visual de emails de alerta
│   │   └── SuppliersView.tsx      # Gestão e homologação de fornecedores
│   ├── constants/              # Constantes de ativos e caminhos
│   ├── data/
│   │   └── initialData.ts      # Dados iniciais e estruturas de estado
│   ├── hooks/
│   │   └── useContractExpirationMonitor.ts # Monitor de vencimentos em background
│   ├── utils/
│   │   ├── alertSimulator.ts      # Motor de simulação de notificações
│   │   ├── contractMonitor.ts     # Utilitários de cálculo de datas e prazos
│   │   └── permissions.ts         # Regras de validação de RBAC
│   ├── types.ts                # Interfaces e tipos globais TypeScript
│   ├── index.css               # Folha de estilo global (Tailwind CSS v4)
│   ├── App.tsx                 # Componente raiz e gerenciador de estado central
│   └── main.tsx                # Ponto de entrada da aplicação
├── index.html                  # Entry point HTML com metatags otimizadas
├── metadata.json               # Metadados do projeto
├── package.json                # Manifesto de dependências e scripts npm
├── tsconfig.json               # Configurações do compilador TypeScript
└── vite.config.ts              # Configurações do Vite
```

---

##  Pré-requisitos

Antes de iniciar, certifique-se de possuir em seu ambiente:
- **Node.js**: versão `18.x` ou superior (recomendado `20.x` LTS).
- **npm**: versão `9.x` ou superior (ou **yarn** / **pnpm**).

---

##  Instalação e Execução

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/mais-contratos.git
   cd mais-contratos
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

4. **Executar verificação de tipos (Lint):**
   ```bash
   npm run lint
   ```

5. **Gerar a build de produção:**
   ```bash
   npm run build
   ```
   Os arquivos estáticos otimizados serão gerados na pasta `dist/`.

---

##  Matriz de Acessos (RBAC)

O sistema possui controle rígido de autorização baseado nas seguintes alçadas:

| Módulo / Funcionalidade | Administrador | Editor | Visualizador |
| :--- | :---: | :---: | :---: |
| **Visualizar Contratos e Metadados** | ✅ Total | ✅ Total | 👁️ Leitura |
| **Cadastrar / Editar Contratos** | ✅ Total | ✅ Total | ❌ Bloqueado |
| **Elaborar Termos Aditivos** | ✅ Total | ✅ Total | ❌ Bloqueado |
| **Rescindir / Excluir Contratos** | ✅ Total | ❌ Bloqueado | ❌ Bloqueado |
| **Exportar Relatórios Executivos** | ✅ Total | ✅ Total | ✅ Total |
| **Diretório de Fornecedores** | ✅ Total | ✅ Total | 👁️ Leitura |
| **Homologação e Compliance** | ✅ Total | ✅ Total | ❌ Bloqueado |
| **Enviar e Cobrar Assinaturas** | ✅ Total | ✅ Total | ❌ Bloqueado |
| **Trilha de Auditoria (Logs SHA-256)** | ✅ Total | ❌ Bloqueado | ❌ Bloqueado |
| **Gestão de Usuários & RBAC** | ✅ Total | ❌ Bloqueado | ❌ Bloqueado |
| **Configuração de Chaves de API & Webhooks** | ✅ Total | ❌ Bloqueado | ❌ Bloqueado |

---

##  Segurança & Compliance

- **LGPD & Governança de Dados**: Princípio do menor privilégio aplicado à visualização de contratos e dados societários de fornecedores.
- **ICP-Brasil**: Compatibilidade estrutural para aposição de assinaturas digitais com carimbo do tempo e certificados padrão A1/A3.
- **Rastreabilidade Criptográfica**: Todos os registros de auditoria contam com hash unidirecional (SHA-256) encadeado para garantir a não-repudiação das ações.

>>>>>>> origin/master
