# Solicitação de Máquina Virtual — Ambiente de Homologação
## Sistema de Controle de Chaves — AEB

**Data:** 2026-03-04
**Solicitante:** Equipe de Desenvolvimento — Sistema de Controle de Chaves
**Destinatário:** Equipe de Infraestrutura / TI
**Prioridade:** Média
**Finalidade:** Homologação e validação funcional antes da implantação em produção

---

## 1. Descrição do Sistema

O **Sistema de Controle de Chaves da AEB** é uma aplicação web interna destinada ao controle e rastreamento do empréstimo de chaves físicas entre servidores e prestadores de serviço da Agência Espacial Brasileira.

### Arquitetura

```
┌─────────────┐     HTTP/80      ┌─────────────┐     TCP/5432    ┌──────────────┐
│   Navegador │ ──────────────►  │    nginx    │ ────────────►   │  PostgreSQL  │
│  (usuário)  │                  │  + React    │                  │     15       │
└─────────────┘                  │  (frontend) │                  └──────────────┘
                                 │             │     HTTP/8000
                                 │  gunicorn   │ ────────────►   ┌──────────────┐
                                 │  + Django 5 │                  │   Django +   │
                                 │  (backend)  │                  │   DRF + JWT  │
                                 └─────────────┘                  └──────────────┘
```

**Stack:**
| Componente | Tecnologia | Versão |
|---|---|---|
| Servidor Web / Proxy | nginx | alpine (latest) |
| Frontend | React + Vite | Node 20 |
| Backend API | Django + DRF + Gunicorn | Python 3.12 / Django 5 |
| Banco de Dados | PostgreSQL | 15-alpine |
| Autenticação | JWT (djangorestframework-simplejwt) | — |
| Orquestração | Docker Compose | 3.8 |

---

## 2. Público-Alvo e Estimativa de Uso

| Perfil | Quantidade estimada | Frequência de uso |
|---|---|---|
| Operadores de portaria (atendimento) | ~10 usuários | Contínuo, horário comercial |
| Administradores do sistema | ~3 usuários | Eventual |
| **Total de usuários ativos simultâneos (pico)** | **~15 usuários** | Horário de pico |

> O sistema opera em **horário comercial** (07h–19h) com pico nas entradas/saídas (07h–09h e 17h–19h).

---

## 3. Metodologia do Teste de Carga

### 3.1 Ferramenta Utilizada

**Locust** (https://locust.io) — framework open-source de teste de carga em Python.

```bash
# Instalação
pip install locust

# Execução do teste
locust -f tests/load/locustfile.py --host http://<HOST>:8080 \
       --users 30 --spawn-rate 5 --run-time 5m --headless \
       --csv docs/resultados_carga
```

O script de teste está em: `tests/load/locustfile.py`

### 3.2 Cenários Simulados

| Cenário | Peso | Descrição |
|---|---|---|
| `AtendimentoUser` | 90% | Login → listar chaves → conceder → devolver → logout |
| `AdminUser` | 10% | Login → listar chaves/pessoas/setores/usuários → logout |

### 3.3 Parâmetros do Teste

| Parâmetro | Valor |
|---|---|
| Usuários simultâneos (normal) | 15 |
| Usuários simultâneos (estresse) | 30 |
| Taxa de geração de usuários | 5 usuários/segundo |
| Duração do teste | 5 minutos |
| Pausa entre requisições | 2–6 segundos (simulação realista) |

---

## 4. Endpoints Testados e Resultados Esperados

| Endpoint | Método | SLA Esperado (P95) |
|---|---|---|
| `POST /api/token/` | POST | < 300 ms |
| `GET /api/chaves/` | GET | < 500 ms |
| `GET /api/emprestimos/` | GET | < 500 ms |
| `GET /api/pessoas/` | GET | < 500 ms |
| `POST /api/emprestimos/` | POST | < 800 ms |
| `PATCH /api/emprestimos/{id}/devolver/` | PATCH | < 800 ms |

**Taxa de erro aceitável:** < 1%
**Throughput mínimo esperado:** 20 req/s com 15 usuários simultâneos

---

## 5. Especificação da VM Solicitada

### 5.1 Configuração Recomendada (Homologação)

| Recurso | Mínimo | **Recomendado** |
|---|---|---|
| **vCPUs** | 2 | **4** |
| **RAM** | 4 GB | **8 GB** |
| **Disco (SO + aplicação)** | 30 GB | **60 GB SSD** |
| **Disco (dados / backup)** | 20 GB | **50 GB** |
| **Rede** | 100 Mbps | **1 Gbps (interna)** |

### 5.2 Justificativa de Recursos

**vCPUs:**
- Gunicorn configurado com 2 workers (`--workers 2`)
- 1 worker = 1 processo Python; recomenda-se `2 × núcleos + 1` workers
- Com 4 vCPUs → possibilidade de escalar para 4 workers em produção

**RAM:**
- PostgreSQL 15: ~200–400 MB (shared_buffers padrão)
- Gunicorn (2 workers): ~150–300 MB
- nginx: ~10–30 MB
- SO + buffers: ~1 GB
- **Total estimado em pico:** ~2–3 GB → folga com 8 GB para homologação e logs

**Disco:**
- Imagens Docker + containers: ~3–5 GB
- Dados PostgreSQL (estimativa 1 ano): ~500 MB–2 GB
- Arquivos de mídia (fotos de pessoas): ~500 MB
- Logs de aplicação e sistema: ~2 GB
- SO (Ubuntu 22.04): ~5–8 GB
- **Total estimado:** ~15–20 GB → recomenda-se 60 GB para folga

### 5.3 Sistema Operacional

| Item | Especificação |
|---|---|
| SO | **Ubuntu Server 22.04 LTS** |
| Arquitetura | x86_64 (amd64) |
| Acesso | SSH com chave pública |
| Docker | Docker Engine 24+ + Docker Compose v2 |

---

## 6. Configuração de Rede e Portas

| Porta | Protocolo | Serviço | Origem permitida |
|---|---|---|---|
| **80** | TCP | nginx (HTTP — frontend + proxy API) | Rede interna AEB |
| **22** | TCP | SSH (administração) | IPs da equipe de dev / infra |
| ~~5432~~ | ~~TCP~~ | ~~PostgreSQL~~ | ~~Bloqueada — acesso apenas interno~~ |
| ~~8000~~ | ~~TCP~~ | ~~Gunicorn~~ | ~~Bloqueada — acesso apenas via nginx~~ |

> **Importante:** apenas a porta 80 e 22 devem ser expostas externamente.
> O banco de dados e o backend são acessíveis apenas dentro da rede Docker interna do host.

---

## 7. Requisitos de Segurança

- [ ] Firewall habilitado (`ufw`) com regras para portas 80 e 22 apenas
- [ ] Certificado SSL/TLS (recomendado para produção; opcional em homologação se rede interna)
- [ ] Acesso SSH via chave pública (desabilitar login por senha)
- [ ] Usuário dedicado sem privilégios root para execução dos containers
- [ ] Backup automático do volume do PostgreSQL (mínimo diário)

---

## 8. Procedimento de Implantação

Após o provisionamento da VM, a implantação segue os passos abaixo:

```bash
# 1. Clonar o repositório
git clone <URL_REPOSITORIO> /opt/sischave
cd /opt/sischave/sistema-controle-chaves

# 2. Configurar variáveis de ambiente
cp .env.homolog.example .env.homolog
# Editar .env.homolog com as credenciais reais

# 3. Build e subida dos containers
docker compose -f docker-compose.homolog.yml --env-file .env.homolog up -d --build

# 4. Verificar status
docker compose -f docker-compose.homolog.yml ps
docker compose -f docker-compose.homolog.yml logs -f

# 5. Executar teste de carga (após implantação)
pip install locust
locust -f tests/load/locustfile.py --host http://localhost \
       --users 15 --spawn-rate 3 --run-time 5m --headless \
       --csv docs/resultados_carga
```

---

## 9. Checklist de Aprovação

### Para a Equipe de Infra (preencher após provisionamento):

- [ ] VM provisionada com as especificações acima
- [ ] Ubuntu 22.04 LTS instalado e atualizado
- [ ] Docker Engine e Docker Compose instalados
- [ ] Portas 80 e 22 liberadas no firewall
- [ ] Acesso SSH configurado com chave da equipe de dev
- [ ] Volume de dados (50 GB) montado em `/opt/sischave/data`
- [ ] IP da VM informado à equipe de desenvolvimento

### Para a Equipe de Desenvolvimento (validação):

- [ ] Deploy realizado com sucesso (`docker compose up`)
- [ ] Login na aplicação funcionando
- [ ] Operações de concessão e devolução de chaves funcionando
- [ ] Teste de carga executado (Locust) sem erros > 1%
- [ ] Resultados do teste de carga documentados e anexados

---

## 10. Contato

| Papel | Nome | Contato |
|---|---|---|
| Responsável técnico (dev) | Equipe de Desenvolvimento AEB | — |
| Aprovação | Coordenação de TI / Infra | — |

---

*Documento gerado em 2026-03-04 — Sistema de Controle de Chaves AEB v1.0*
