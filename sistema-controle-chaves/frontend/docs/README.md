# SisChave — Frontend

## Documentação Técnica

> **Sistema de Controle de Chaves** — Portaria & Segurança  
> Agência Espacial Brasileira (AEB)

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Stack Tecnológica](#2-stack-tecnológica)
3. [Arquitetura do Projeto](#3-arquitetura-do-projeto)
4. [Estrutura de Diretórios](#4-estrutura-de-diretórios)
5. [Fluxo de Navegação](#5-fluxo-de-navegação)
6. [Autenticação e Segurança](#6-autenticação-e-segurança)
7. [Páginas](#7-páginas)
   - 7.1 [LoginPage](#71-loginpage)
   - 7.2 [Dashboard](#72-dashboard)
   - 7.3 [AuthorizedPersonsPage](#73-authorizedpersonspage)
   - 7.4 [ReportsPage](#74-reportspage)
   - 7.5 [KeyReportsPage](#75-keyreportspage)
8. [Componentes Modais](#8-componentes-modais)
   - 8.1 [Sidebar](#81-sidebar)
   - 8.2 [AssignKeyModal](#82-assignkeymodal)
   - 8.3 [ReturnKeyModal](#83-returnkeymodal)
   - 8.4 [RegisterKeyModal](#84-registerkeymodal)
   - 8.5 [EditKeyModal](#85-editkeymodal)
   - 8.6 [RegisterPersonModal](#86-registerpersonmodal)
   - 8.7 [ConfirmationModal](#87-confirmationmodal)
9. [Modelos de Dados](#9-modelos-de-dados)
10. [Serviços e API](#10-serviços-e-api)
11. [Utilitários](#11-utilitários)
12. [Infraestrutura e Deploy](#12-infraestrutura-e-deploy)
13. [Variáveis de Ambiente](#13-variáveis-de-ambiente)
14. [Scripts Disponíveis](#14-scripts-disponíveis)

---

## 1. Visão Geral

O **SisChave (KeyControl)** é uma aplicação web para gestão e controle de empréstimo de chaves em ambiente institucional. O sistema permite que operadores de portaria:

- Visualizem o estado de todas as chaves em tempo real
- Concedam chaves a pessoas autorizadas (Servidores e Prestadores)
- Registrem devoluções de chaves
- Cadastrem novas chaves e pessoas autorizadas
- Gerem relatórios de empréstimos e devoluções
- Identifiquem visualmente chaves com devolução atrasada

O frontend é uma **SPA (Single Page Application)** em React que se comunica com um backend Django REST via API HTTP, com autenticação JWT.

---

## 2. Stack Tecnológica

| Tecnologia | Versão | Finalidade |
|---|---|---|
| **React** | 19.0.0 | Biblioteca de UI (componentes funcionais + hooks) |
| **TypeScript** | ~5.8.2 | Tipagem estática |
| **Vite** | 6.2.0+ | Bundler e servidor de desenvolvimento (HMR) |
| **Tailwind CSS** | 4.1.14 | Framework CSS utility-first |
| **Axios** | 1.7.0 | Cliente HTTP para comunicação com a API |
| **lucide-react** | 0.546.0 | Biblioteca de ícones SVG |
| **motion** | 12.23.24 | Biblioteca de animações (disponível, uso pontual) |
| **clsx + tailwind-merge** | 2.1.1 / 3.5.0 | Composição condicional de classes CSS |
| **Node.js** | 20 (Alpine) | Runtime no container Docker |

### Fonte Tipográfica
- **Inter** (Google Fonts) — pesos 400, 500, 600, 700, 800

---

## 3. Arquitetura do Projeto

### Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────┐
│                      BROWSER                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │               React SPA (Vite)                    │  │
│  │  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │  │
│  │  │  Pages   │  │  Modals  │  │   Contexts     │  │  │
│  │  │          │  │          │  │  (AuthContext)  │  │  │
│  │  └────┬─────┘  └────┬─────┘  └───────┬────────┘  │  │
│  │       │              │                │           │  │
│  │       └──────────────┼────────────────┘           │  │
│  │                      │                            │  │
│  │              ┌───────┴────────┐                   │  │
│  │              │   Services     │                   │  │
│  │              │  (api.ts)      │                   │  │
│  │              │  (authService) │                   │  │
│  │              └───────┬────────┘                   │  │
│  └──────────────────────┼────────────────────────────┘  │
│                         │ HTTP (Axios)                   │
└─────────────────────────┼───────────────────────────────┘
                          │
                    ┌─────┴──────┐
                    │  Backend   │
                    │  Django    │
                    │  :8080     │
                    └─────┬──────┘
                          │
                    ┌─────┴──────┐
                    │ PostgreSQL │
                    │   :5432    │
                    └────────────┘
```

### Padrões Arquiteturais

| Padrão | Descrição |
|---|---|
| **SPA com roteamento por estado** | Navegação via `useState<Page>` no `App.tsx` — sem react-router |
| **Context API** | Gerenciamento de autenticação global (`AuthContext`) |
| **Componentização** | Cada página e modal é um componente isolado |
| **Interceptors Axios** | Token JWT anexado automaticamente; refresh transparente em 401 |
| **Utility-first CSS** | Tailwind CSS com helper `cn()` para classes condicionais |
| **Dados mock** | Atualmente usa dados hardcoded (`mock.ts`) para prototipação |

---

## 4. Estrutura de Diretórios

```
frontend/
├── docs/                          # Documentação (este diretório)
│   └── README.md
├── public/
│   └── images/
│       ├── chave.png              # Logo do sistema (sidebar, login, headers)
│       └── key-icon_34404.png     # Ícone de chave nos cards e detalhes
├── src/
│   ├── main.tsx                   # Ponto de entrada — monta <App /> no DOM
│   ├── App.tsx                    # Roteamento por estado + AuthProvider
│   ├── index.css                  # Reset global + importação do Tailwind
│   ├── contexts/
│   │   └── AuthContext.tsx        # Provider de autenticação (login/logout)
│   ├── data/
│   │   └── mock.ts                # Dados mockados (chaves e pessoas)
│   ├── hooks/                     # Hooks customizados (vazio atualmente)
│   ├── lib/
│   │   └── utils.ts               # Utilitário cn() (clsx + tailwind-merge)
│   ├── modals/
│   │   ├── Sidebar.tsx            # Barra de navegação lateral
│   │   ├── AssignKeyModal.tsx     # Modal de concessão de chave
│   │   ├── ReturnKeyModal.tsx     # Modal de devolução de chave
│   │   ├── RegisterKeyModal.tsx   # Modal de cadastro de nova chave
│   │   ├── EditKeyModal.tsx       # Modal de edição/exclusão de chave
│   │   ├── RegisterPersonModal.tsx# Modal de cadastro/edição de pessoa
│   │   └── ConfirmationModal.tsx  # Modal genérico de confirmação
│   ├── pages/
│   │   ├── LoginPage.tsx          # Tela de autenticação
│   │   ├── Dashboard.tsx          # Painel principal com grid de chaves
│   │   ├── AuthorizedPersonsPage.tsx # CRUD de pessoas autorizadas
│   │   ├── ReportsPage.tsx        # Menu de relatórios
│   │   └── KeyReportsPage.tsx     # Relatório detalhado de empréstimos
│   └── services/
│       ├── api.ts                 # Instância Axios + interceptors JWT
│       └── authService.ts         # Serviço de login/logout/isAuthenticated
├── Dockerfile                     # Container Node 20 Alpine
├── index.html                     # HTML raiz (pt-BR, font Inter)
├── metadata.json                  # Metadados do projeto
├── package.json                   # Dependências e scripts
├── tsconfig.json                  # Configuração TypeScript
└── vite.config.ts                 # Configuração Vite (Tailwind plugin, alias @)
```

---

## 5. Fluxo de Navegação

O sistema **não utiliza react-router**. A navegação é controlada pelo estado `currentPage` em `App.tsx`:

```
                    ┌─────────┐
                    │  App    │
                    │ (Auth   │
                    │ Provider│)
                    └────┬────┘
                         │
              ┌──────────┼──────────────────┐
              │ isAuthenticated?             │
              │                             │
         ┌────┴────┐                  ┌─────┴─────┐
         │  false  │                  │   true     │
         │ Login   │                  │ AppRoutes  │
         │  Page   │                  └─────┬──────┘
         └─────────┘                        │
                              ┌─────────────┼─────────────────┐
                              │             │                 │
                        ┌─────┴─────┐ ┌─────┴──────┐   ┌─────┴──────────┐
                        │ Dashboard │ │  Reports   │   │ Authorized     │
                        │ (default) │ │  Page      │   │ Persons Page   │
                        └───────────┘ └─────┬──────┘   └────────────────┘
                                            │
                                      ┌─────┴──────┐
                                      │ Key Reports│
                                      │    Page    │
                                      └────────────┘
```

### Tipos de Página
```typescript
type Page = 'dashboard' | 'reports' | 'settings' | 'authorized-persons' | 'key-reports';
```

Cada página recebe via props:
- `onNavigate(page)` — função para trocar de página
- `onLogout()` — função para encerrar sessão

---

## 6. Autenticação e Segurança

### Fluxo de Login

```
Usuário → LoginPage → authService.login() → POST /api/token/
                                                    │
                                              ┌─────┴─────┐
                                              │  access   │
                                              │  refresh  │
                                              └─────┬─────┘
                                                    │
                                         localStorage.setItem()
                                                    │
                                         setIsAuthenticated(true)
```

### Componentes Envolvidos

| Arquivo | Responsabilidade |
|---|---|
| `AuthContext.tsx` | Provider React com `login()`, `logout()`, `isAuthenticated` |
| `authService.ts` | Chamadas HTTP de login, manipulação do `localStorage` |
| `api.ts` | Instância Axios com interceptors de request (token) e response (refresh) |

### Interceptor de Token (api.ts)

1. **Request Interceptor**: Anexa `Authorization: Bearer <access_token>` em todas as requisições
2. **Response Interceptor**: Ao receber HTTP 401:
   - Tenta renovar o token via `POST /api/token/refresh/`
   - Se sucesso: atualiza o `localStorage`, reenvia a requisição original, desfila requisições pendentes
   - Se falha: executa `logout()` (limpa tokens e redireciona para login)
   - Proteção contra chamadas paralelas: enfileira requisições enquanto um refresh está em andamento

### Armazenamento
- `access_token` → `localStorage`
- `refresh_token` → `localStorage`

---

## 7. Páginas

### 7.1 LoginPage

**Arquivo:** `src/pages/LoginPage.tsx`

**Descrição:** Tela de autenticação com campos de usuário e senha.

**Funcionalidades:**
- Formulário com validação required nativa
- Toggle de visibilidade da senha (Eye/EyeOff)
- Estado de loading durante autenticação
- Mensagem de erro em caso de credenciais inválidas
- Link "Esqueci minha senha"
- Branding com logo `chave.png`
- Background com padrão grid sutil

**Estado:**
| Estado | Tipo | Descrição |
|---|---|---|
| `username` | `string` | Valor do campo usuário |
| `password` | `string` | Valor do campo senha |
| `showPassword` | `boolean` | Visibilidade da senha |
| `isLoading` | `boolean` | Indicador de requisição em andamento |
| `error` | `string` | Mensagem de erro |

---

### 7.2 Dashboard

**Arquivo:** `src/pages/Dashboard.tsx`

**Descrição:** Painel principal do sistema. Exibe um grid de cards representando cada chave cadastrada, com painel lateral de detalhes e múltiplos modais de ação.

**Funcionalidades:**

#### Header
- Título "Dashboard Principal" com subtítulo "Gestão e controle de chaves"
- Legenda de status com ícones: Disponível (verde), Emprestado (âmbar), Atrasado (vermelho)
- Botão "Cadastrar Nova Chave"
- Sino de notificações com contagem de atrasados e dropdown de resumo

#### Busca e Filtros
- Campo de busca por nome/localização da chave
- Filtro por perfil: Todos, Servidor, Prestador
- Filtro por status: Todos, Disponível, Emprestada, Atrasada
- Botão "Limpar" para resetar filtros

#### Grid de Chaves
- Layout responsivo com `grid-template-columns: repeat(auto-fill, minmax(220px, 220px))`
- Cards com aspect ratio 3:4 e max-width 220px
- Paginação com 14 cards por página

#### Componente KeyCard
Cada card exibe:
- **Imagem da chave** (`key-icon_34404.png`) em container com cor de status
- **Ponto de status** (canto inferior direito do ícone):
  - Verde: Disponível
  - Âmbar: Emprestado
  - Vermelho + `animate-pulse`: Atrasado
- **Label de status** (canto superior direito): "Livre", "Emprestada", "Atrasada"
- **Nome e localização** da chave
- **Footer**: Último uso (se disponível) ou avatar+nome do portador (se emprestada)
- **Efeito hover**: elevação com sombra (`hover:-translate-y-1 hover:shadow-md`)
- **Estado selecionado**: borda azul com ring

#### Painel de Detalhes (lateral direito)
Ao clicar em um card, abre painel com:
- Ícone e nome/localização da chave
- Descrição textual
- Perfis permitidos (badges)
- Informações do portador atual (foto, nome, perfil, contato, área)
- Informações do último usuário (quando disponível e chave livre)
- Grid de status (Status + Data de entrega)
- Observações (se houver)
- Botões de ação: "Entregar Chave" / "Registrar Devolução" + "Editar"

#### Paginação
- Exibe "X-Y de Z chaves"
- Botões numerados com destaque azul no ativo
- Setas de navegação (anterior/próximo)
- Reseta para página 1 ao alterar filtros

#### Modais Integrados
- `RegisterKeyModal` — cadastro de nova chave
- `AssignKeyModal` — concessão de chave a pessoa autorizada
- `ReturnKeyModal` — registro de devolução
- `EditKeyModal` — edição e exclusão de chave
- `ConfirmationModal` — confirmação de todas as ações acima

**Estado Principal:**
| Estado | Tipo | Descrição |
|---|---|---|
| `selectedKeyId` | `string \| null` | ID da chave selecionada |
| `searchTerm` | `string` | Termo de busca |
| `filterProfile` | `string` | Filtro de perfil ativo |
| `filterStatus` | `string` | Filtro de status ativo |
| `keys` | `KeyData[]` | Lista de chaves (estado local mutável) |
| `currentPage` | `number` | Página atual da paginação |
| `confirmationModal` | `object` | Estado do modal de confirmação (isOpen, type, data) |

**Subcomponentes:**
- `StatusLegend` — item de legenda com ícone, cor e label
- `KeyCard` — card individual de chave

---

### 7.3 AuthorizedPersonsPage

**Arquivo:** `src/pages/AuthorizedPersonsPage.tsx`

**Descrição:** Página de CRUD de pessoas autorizadas a portar chaves.

**Funcionalidades:**
- Tabela com colunas: Avatar, Nome, Perfil, Documento, Contato, Ações
- Busca por nome, CPF ou documento
- Filtro por perfil (modal dedicado com checkboxes Servidor/Prestador)
- Paginação (5 itens por página)
- Botões de Editar (abre modal preenchido) e Excluir (com confirmação)
- Cadastro de nova pessoa (modal completo)

**Subcomponentes:**
- `FilterModal` — modal de filtro por perfil
- `RoleBadge` — badge colorido (azul para Servidor, laranja para Prestador)

---

### 7.4 ReportsPage

**Arquivo:** `src/pages/ReportsPage.tsx`

**Descrição:** Menu de relatórios. Funciona como hub de navegação para os diferentes tipos de relatórios.

**Funcionalidades:**
- Título "Central de Módulos" com descrição
- Grid de cards de relatórios
- Atualmente contém apenas o card "Relatório de Chaves" que navega para `KeyReportsPage`
- Cards com efeito hover de elevação e sombra

**Subcomponentes:**
- `ReportCard` — card de navegação com ícone, título e descrição

---

### 7.5 KeyReportsPage

**Arquivo:** `src/pages/KeyReportsPage.tsx`

**Descrição:** Relatório detalhado de empréstimos de chaves com filtros avançados e tabela completa.

**Funcionalidades:**

#### Header
- Ícone do sistema + título "Relatório de Empréstimo de Chaves"
- Botões de exportação: Imprimir, CSV, PDF

#### Filtros Avançados
- Busca por nome
- Seleção de chave específica
- Quantidade máxima de resultados
- Período (de/até) com `datetime-local`
- Checkboxes de status: Finalizados, Em andamento, Vencidos
- Checkboxes de perfil: Servidor, Prestador
- Radio buttons de ordenação: Chave, Data empréstimo, Nome
- Botão "Limpar Filtros"

#### Tabela de Resultados
Colunas com ícones no header:
| Coluna | Ícone |
|---|---|
| Nome | `User` |
| Perfil | `Shield` |
| Contato | `Phone` |
| Área | `Building` |
| Chave | `chave.png` |
| Status | `CheckCircle` |
| Retirada | `LogOut` |
| Entrega | `LogIn` |

#### Paginação
- Exibição estática (1 a 4 de 124 resultados)
- Botões de navegação circular

**Subcomponentes:**
- `TypeBadge` — badge de perfil (cinza para Servidor, azul para Prestador)
- `StatusBadge` — badge de status com dot colorido (Devolvida, Emprestada, Vencida)

---

## 8. Componentes Modais

### 8.1 Sidebar

**Arquivo:** `src/modals/Sidebar.tsx`

**Descrição:** Barra de navegação lateral fixa presente em todas as páginas autenticadas.

**Elementos:**
- **Logo**: `chave.png` com título "KeyControl" e subtítulo "Portaria & Segurança"
- **Navegação**:
  - Dashboard (`LayoutDashboard`)
  - Pessoas Autorizadas (`Users`)
  - Relatórios (`FileText`)
- **Rodapé**: Avatar do usuário logado, nome "João Silva", cargo "Operador de Turno", botão de Logout

**Props:**
| Prop | Tipo | Descrição |
|---|---|---|
| `activePage` | `Page` | Página ativa para highlight no menu |
| `onNavigate` | `(page) => void` | Callback de navegação |
| `onLogout` | `() => void` | Callback de logout |

**Destaque:** O botão de logout usa `e.stopPropagation()` para evitar conflito com o container pai.

---

### 8.2 AssignKeyModal

**Arquivo:** `src/modals/AssignKeyModal.tsx`

**Descrição:** Modal para conceder uma chave a uma pessoa autorizada.

**Campos:**
1. **Perfil** — seleção visual entre Servidor e Prestador (cards radio)
2. **Buscar Pessoa** — autocomplete com lista dropdown filtrando por perfil selecionado
3. **Data/Hora de Retirada** — registrada automaticamente (não editável)
4. **Data/Hora Prevista de Devolução** — campo `datetime-local` opcional
5. **Observações** — textarea livre

**Comportamento:**
- Ao selecionar pessoa, exibe badge com foto e dados
- Lista de pessoas vem de `MOCK_PEOPLE` filtrada por `role` e `searchTerm`
- Dispara `onConfirm(data)` com todos os dados preenchidos

---

### 8.3 ReturnKeyModal

**Arquivo:** `src/modals/ReturnKeyModal.tsx`

**Descrição:** Modal para registrar a devolução de uma chave.

**Campos:**
- Nome da chave e localização (exibição)
- Card resumo: Portador + Data de retirada
- Observações da devolução (textarea)

**Comportamento:** Dispara `onConfirm(observations)` com o texto de observações.

---

### 8.4 RegisterKeyModal

**Arquivo:** `src/modals/RegisterKeyModal.tsx`

**Descrição:** Modal para cadastrar uma nova chave no sistema.

**Campos:**
1. **Nome da Chave** — texto livre (obrigatório)
2. **Localização** — select com opções Bloco A / Bloco F (obrigatório)
3. **Perfis Permitidos** — checkboxes Servidor / Prestador (ao menos um obrigatório)
4. **Descrição** — textarea (obrigatório)

**Validação:** Alerta nativo se campos obrigatórios estiverem vazios.

---

### 8.5 EditKeyModal

**Arquivo:** `src/modals/EditKeyModal.tsx`

**Descrição:** Modal para editar dados de uma chave existente ou excluí-la.

**Campos:** Mesmos do `RegisterKeyModal`, preenchidos com dados atuais da chave.

**Ações:**
- Salvar Alterações → `onConfirm(data)`
- Excluir Chave → `onDelete()` (botão vermelho com confirmação)

---

### 8.6 RegisterPersonModal

**Arquivo:** `src/modals/RegisterPersonModal.tsx`

**Descrição:** Modal para cadastrar ou editar uma pessoa autorizada.

**Campos:**
1. **Foto de Perfil** — upload de imagem com preview (máximo 5MB, JPG/PNG/GIF)
2. **Nome Completo** — texto livre
3. **Perfil** — cards visuais Servidor / Prestador
4. **Área/Setor** — autocomplete com lista de setores da AEB (40+ opções)
5. **Documento (RG ou CPF)** — com máscara automática `000.000.000-00`
6. **Telefone** — com máscara automática `(00) 00000-0000`
7. **Observações** — textarea

**Funcionalidades:**
- Modo criação e modo edição (via prop `initialData`)
- Autocomplete de área com busca dinâmica (limitado a 2 resultados)
- Formatação automática de CPF e telefone
- Preview de avatar com opção de remover

---

### 8.7 ConfirmationModal

**Arquivo:** `src/modals/ConfirmationModal.tsx`

**Descrição:** Modal genérico de confirmação de ação, utilizado por todas as operações destrutivas ou críticas.

**Tipos de Confirmação:**

| Tipo | Ícone | Cor do Botão | Exemplo de Uso |
|---|---|---|---|
| `success` | ✅ CheckCircle2 | Emerald | Cadastro, Edição |
| `warning` | ⚠️ AlertTriangle | Amber | Concessão de chave |
| `danger` | ⚠️ AlertTriangle | Red | Exclusão |

**Props:**
| Prop | Tipo | Descrição |
|---|---|---|
| `isOpen` | `boolean` | Visibilidade |
| `onClose` | `() => void` | Callback de fechamento |
| `onConfirm` | `() => void` | Callback de confirmação |
| `title` | `string` | Título do modal |
| `message` | `string` | Mensagem descritiva |
| `confirmText` | `string` | Texto do botão de confirmação |
| `type` | `'danger' \| 'success' \| 'warning'` | Estilo visual |

---

## 9. Modelos de Dados

### KeyData

```typescript
type KeyStatus = 'available' | 'borrowed' | 'overdue';

interface KeyData {
  id: string;
  name: string;                    // Ex: "Chave 01"
  location: string;                // Ex: "Bloco A"
  category: string;                // Ex: "Geral"
  status: KeyStatus;
  lastUsed?: string;               // Ex: "Ontem"
  holder?: {                       // Pessoa com a chave atualmente
    name: string;
    role: string;
    avatar: string;
    time?: string;                 // Tempo desde retirada
    area?: string;
    contact?: string;
  };
  lastUser?: {                     // Última pessoa que usou (quando disponível)
    name: string;
    role: string;
    avatar: string;
    contact?: string;
    area?: string;
    returnedAt?: string;           // Data/hora da devolução
  };
  description?: string;
  allowedProfiles?: string[];      // ["Servidor", "Prestador"]
  observations?: string;
  borrowedAt?: string;             // Data/hora de retirada
}
```

### PersonData

```typescript
interface PersonData {
  id: string;
  name: string;
  email?: string;
  avatar: string;                  // URL da foto ou UI Avatars
  role: 'Servidor' | 'Prestador';
  document: string;                // CPF formatado
  contact: string;                 // Telefone formatado
  area?: string;                   // Setor da AEB
  observations?: string;
}
```

### Status das Chaves

| Status | Label PT | Cor Visual | Significado |
|---|---|---|---|
| `available` | Disponível / Livre | Verde (emerald) | Chave está no quadro, pronta para uso |
| `borrowed` | Emprestada | Âmbar (amber) | Chave está com um portador dentro do prazo |
| `overdue` | Atrasada | Vermelho (red) | Chave deveria ter sido devolvida, prazo excedido |

---

## 10. Serviços e API

### api.ts — Instância Axios

**Base URL:** `VITE_API_URL` (padrão: `http://localhost:8080`)

**Endpoints Consumidos:**

| Método | Endpoint | Descrição |
|---|---|---|
| `POST` | `/api/token/` | Autenticação (login) — retorna `access` e `refresh` |
| `POST` | `/api/token/refresh/` | Renovação do access token |

> **Nota:** Atualmente o frontend opera com dados mock (`MOCK_KEYS`, `MOCK_PEOPLE`). A integração completa com a API REST está preparada na camada de serviços e interceptors, mas os endpoints de CRUD de chaves e pessoas ainda não estão sendo consumidos nas páginas.

### authService.ts — Serviço de Autenticação

| Método | Descrição |
|---|---|
| `login(credentials)` | Faz POST em `/api/token/`, salva tokens no `localStorage` |
| `logout()` | Remove `access_token` e `refresh_token` do `localStorage` |
| `isAuthenticated()` | Retorna `true` se `access_token` existe no `localStorage` |

### Refresh Token Automático

O interceptor de resposta em `api.ts` implementa:
1. Detecção de 401 Unauthorized
2. Tentativa de refresh com o `refresh_token`
3. Fila de requisições pendentes durante refresh em andamento
4. Re-execução automática da requisição original com novo token
5. Logout automático quando o refresh também falha

---

## 11. Utilitários

### cn() — Class Name Composer

**Arquivo:** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Uso:** Composição condicional de classes Tailwind CSS com resolução inteligente de conflitos.

```tsx
// Exemplo de uso
className={cn(
  "bg-white p-3 rounded-xl border",
  isSelected ? "border-blue-500 ring-2" : "border-gray-200",
  data.status === 'overdue' && "bg-red-50"
)}
```

---

## 12. Infraestrutura e Deploy

### Docker

**Container:** `sischave_frontend`

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

**Volumes:**
- `./frontend:/app` — código fonte mapeado para hot-reload
- `/app/node_modules` — node_modules isolado no container

**Rede:** `sischave_network` (bridge) — comunicação com backend e database

### Docker Compose (serviço frontend)

```yaml
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile
  container_name: sischave_frontend
  restart: unless-stopped
  ports:
    - "3000:3000"
  environment:
    - VITE_API_URL=http://localhost:8080
  depends_on:
    - backend
```

### Vite Config

- **Plugins:** `@vitejs/plugin-react` + `@tailwindcss/vite`
- **Alias:** `@` → raiz do frontend
- **HMR:** Habilitado com `usePolling: true` (necessário no Docker/Windows)
- **Servidor:** Porta 3000, bind em `0.0.0.0`

---

## 13. Variáveis de Ambiente

| Variável | Onde | Padrão | Descrição |
|---|---|---|---|
| `VITE_API_URL` | Frontend (Vite) | `http://localhost:8080` | URL base da API backend |
| `DISABLE_HMR` | Processo Node | — | Se `true`, desabilita Hot Module Replacement |

---

## 14. Scripts Disponíveis

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia servidor de desenvolvimento Vite (porta 3000) |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run clean` | Remove diretório `dist` |
| `npm run lint` | Verifica tipos TypeScript (sem emitir arquivos) |

---

## Apêndice: Assets Visuais

| Asset | Caminho | Uso |
|---|---|---|
| `chave.png` | `/public/images/chave.png` | Logo do sistema (sidebar, login, headers de relatório, modais) |
| `key-icon_34404.png` | `/public/images/key-icon_34404.png` | Ícone nos cards de chave e painel de detalhes |

---

> **Última atualização:** Março/2026  
> **Versão:** 1.0  
> **Branch:** `feature-ajustes-card`
