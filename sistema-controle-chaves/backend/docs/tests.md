# Documentação de Testes — Sistema de Controle de Chaves

Estratégia de testes em três camadas: **unitários**, **integração** e **smoke tests**.

---

## Índice

- [Como Executar](#como-executar)
- [Pirâmide de Testes](#pirâmide-de-testes)
- [Testes Unitários — Chaves](#1-testes-unitários--chaves-test_chave_unitpy)
- [Testes de Integração — Empréstimos](#2-testes-de-integração--empréstimos-test_emprestimo_integrationpy)
- [Smoke Tests](#3-smoke-tests-smoke_testpy)
- [Bugs Corrigidos (Rastreabilidade)](#bugs-corrigidos-rastreabilidade)

---

## Como Executar

```bash
# 1. Rodar migrations (necessário na primeira vez ou após mudanças)
docker compose exec backend python manage.py migrate

# 2. Suite completa de testes
docker compose exec backend python manage.py test app.tests --verbosity=2

# 3. Smoke test de infraestrutura (containers rodando)
docker compose exec backend python smoke_test.py
```

---

## Pirâmide de Testes

| Camada | Arquivo | Casos | Escopo |
|---|---|---|---|
| Unitários | `app/tests/test_chave_unit.py` | 35 | Model, Serializer, ViewSet (Chave) |
| Integração | `app/tests/test_emprestimo_integration.py` | 42 | Service, Serializer, API, Concorrência, Status VENCIDO |
| Smoke | `smoke_test.py` | 26 | BD, API REST, JWT/Segurança, Integridade de Dados |

---

## 1. Testes Unitários — Chaves (`test_chave_unit.py`)

### 1.1 `ChaveModelTest` — Testes de Model

| ID | Método | Descrição |
|---|---|---|
| TC-CHV-001 | `test_criacao_com_campos_minimos` | Criar chave apenas com código; verificar defaults (`status=DISPONIVEL`, `ativo=True`) |
| TC-CHV-002 | `test_criacao_com_todos_os_campos` | Criar chave com todos os campos, incluindo `status=MANUTENCAO` e `ativo=False` |
| TC-CHV-003 | `test_str_representa_codigo_e_descricao` | `__str__` deve conter código e descrição |
| TC-CHV-004 | `test_str_sem_descricao` | `__str__` com `descricao=None` não deve lançar exceção |
| TC-CHV-005 | `test_codigo_duplicado_levanta_integrity_error` | Constraint UNIQUE em `codigo` deve lançar `IntegrityError` |
| TC-CHV-006 | `test_codigo_em_branco_deve_falhar` | `full_clean()` deve rejeitar código em branco (`blank=False`) |
| TC-CHV-007 | `test_status_invalido_rejeitado_por_full_clean` | Status fora dos choices (`VENCIDO`) deve ser rejeitado por `full_clean()` |
| TC-CHV-008 | `test_codigo_com_50_caracteres_e_aceito` | Código com `max_length=50` exato deve ser salvo |
| TC-CHV-009 | `test_codigo_com_51_caracteres_e_rejeitado` | Código com 51 chars deve falhar na validação |
| TC-CHV-010 | `test_descricao_com_200_caracteres_aceita` | Descrição com `max_length=200` exato deve ser salva |
| TC-CHV-011 | `test_soft_delete_via_campo_ativo` | Desativar chave (`ativo=False`) mantém o registro no banco |

### 1.2 `ChaveSerializerTest` — Testes de Serializer

| ID | Método | Descrição |
|---|---|---|
| TC-SER-001 | `test_serializer_valida_payload_minimo` | Payload apenas com `codigo` deve ser válido |
| TC-SER-002 | `test_serializer_valida_payload_completo` | Payload com todos os campos válidos deve passar |
| TC-SER-003 | `test_serializer_serializa_objeto_existente` | Serializer deve expor todos os campos do modelo |
| TC-SER-004 | `test_serializer_rejeita_codigo_vazio` | `codigo=""` deve invalidar o serializer |
| TC-SER-005 | `test_serializer_rejeita_codigo_ausente` | Payload sem `codigo` deve invalidar o serializer |
| TC-SER-006 | `test_serializer_rejeita_status_invalido` | `status=VENCIDO` deve ser rejeitado |
| TC-SER-007 | `test_serializer_rejeita_codigo_duplicado` | Código já existente deve falhar na criação via serializer |

### 1.3 `ChaveAPITest` — Testes de API (ViewSet)

> Autenticação via `force_authenticate` com usuário `is_staff=True, is_superuser=True`.

| ID | Método | Endpoint | Descrição |
|---|---|---|---|
| TC-API-CHV-001 | `test_listar_chaves_retorna_200` | `GET /api/chaves/` | Listagem retorna 200 |
| TC-API-CHV-002 | `test_criar_chave_retorna_201` | `POST /api/chaves/` | Criação com payload válido retorna 201 e `status=DISPONIVEL` |
| TC-API-CHV-003 | `test_detalhar_chave_retorna_200` | `GET /api/chaves/{id}/` | Detalhe retorna 200 com dados corretos |
| TC-API-CHV-004 | `test_atualizar_descricao_retorna_200` | `PATCH /api/chaves/{id}/` | Atualização parcial retorna 200 |
| TC-API-CHV-005 | `test_deletar_chave_retorna_204` | `DELETE /api/chaves/{id}/` | Delete de chave sem empréstimos retorna 204 |
| TC-API-CHV-006 | `test_filtro_por_status_disponivel` | `GET /api/chaves/?status=DISPONIVEL` | Filtra apenas chaves com status DISPONIVEL |
| TC-API-CHV-007 | `test_filtro_por_status_case_insensitive` | `GET /api/chaves/?status=disponivel` | Filtro funciona com letras minúsculas |
| TC-API-CHV-008 | `test_filtro_por_ativo_true` | `GET /api/chaves/?ativo=true` | Retorna apenas chaves ativas |
| TC-API-CHV-009 | `test_filtro_por_ativo_false` | `GET /api/chaves/?ativo=false` | Retorna apenas chaves inativas |
| TC-API-CHV-010 | `test_filtro_status_invalido_retorna_lista_vazia` | `GET /api/chaves/?status=INVALIDO` | Status inválido retorna lista vazia (200) |
| TC-API-CHV-011 | `test_criar_chave_codigo_duplicado_retorna_400` | `POST /api/chaves/` | Código duplicado retorna 400 |
| TC-API-CHV-012 | `test_criar_chave_sem_codigo_retorna_400` | `POST /api/chaves/` | Sem campo `codigo` retorna 400 |
| TC-API-CHV-013 | `test_criar_chave_status_invalido_retorna_400` | `POST /api/chaves/` | `status=VENCIDO` retorna 400 |
| TC-API-CHV-014 | `test_detalhar_chave_inexistente_retorna_404` | `GET /api/chaves/9999/` | ID inexistente retorna 404 |
| TC-API-CHV-015 | `test_deletar_chave_emprestada_deve_falhar` | `DELETE /api/chaves/{id}/` | Chave com empréstimo ativo retorna 409 *(BUG-004)* |

---

## 2. Testes de Integração — Empréstimos (`test_emprestimo_integration.py`)

### 2.1 `EmprestimoServiceTest` — Lógica de Negócio

| ID | Método | Descrição |
|---|---|---|
| TC-SVC-001 | `test_emprestar_cria_emprestimo_e_muda_status` | `emprestar()` cria registro e muda chave para EMPRESTADA |
| TC-SVC-002 | `test_emprestar_registra_data_retirada_automaticamente` | `data_retirada` preenchida automaticamente e recente (< 5s) |
| TC-SVC-003 | `test_emprestar_com_observacao` | Observação opcional é persistida |
| TC-SVC-004 | `test_devolver_registra_data_e_muda_status` | `devolver()` registra `data_devolucao` e muda chave para DISPONIVEL |
| TC-SVC-005 | `test_devolver_com_data_customizada` | `devolver()` com `data_devolucao` explícita usa esse valor |
| TC-SVC-006 | `test_devolver_sem_data_usa_timezone_now` | `devolver()` usa `timezone.now()` (aware), não `datetime.now()` (naive) |
| TC-SVC-007 | `test_devolver_atualiza_observacao` | `devolver()` com observação sobrescreve a anterior |
| TC-SVC-008 | `test_emprestar_chave_ja_emprestada_levanta_erro_no_service` | `select_for_update()` protege contra status desatualizado *(BUG-002)* |
| TC-SVC-009 | `test_data_retirada_e_timezone_aware` | `data_retirada` é timezone-aware com offset de Brasília (-3h ou -2h) |

### 2.2 `EmprestimoCreateSerializerTest` — Serializer de Criação

| ID | Método | Descrição |
|---|---|---|
| TC-SER-EMP-001 | `test_valida_chave_disponivel` | Chave DISPONIVEL passa na validação |
| TC-SER-EMP-002 | `test_create_chama_service_e_muda_status` | `.save()` delega ao service e muda status da chave |
| TC-SER-EMP-003 | `test_rejeita_chave_emprestada` | Chave EMPRESTADA retorna `ValidationError` com status na mensagem |
| TC-SER-EMP-004 | `test_rejeita_chave_em_manutencao` | Chave em MANUTENCAO retorna `ValidationError` |
| TC-SER-EMP-005 | `test_rejeita_sem_chave` | Payload sem `chave` é inválido |
| TC-SER-EMP-006 | `test_rejeita_sem_pessoa` | Payload sem `pessoa` é inválido |
| TC-SER-EMP-007 | `test_rejeita_chave_inexistente` | `chave_id=9999` retorna 400 |

### 2.3 `EmprestimoDevolucaoSerializerTest` — Serializer de Devolução

| ID | Método | Descrição |
|---|---|---|
| TC-SER-DEV-001 | `test_devolver_emprestimo_ativo_e_valido` | Devolução de empréstimo ativo é válida |
| TC-SER-DEV-002 | `test_devolver_com_observacao` | Observação na devolução é aceita |
| TC-SER-DEV-003 | `test_rejeita_devolucao_dupla` | Segunda tentativa de devolução retorna erro de idempotência |
| TC-SER-DEV-004 | `test_devolucao_com_data_futura_invalida` | `data_devolucao` futura é rejeitada *(BUG-008a)* |
| TC-SER-DEV-005 | `test_devolucao_com_data_anterior_a_retirada_invalida` | `data_devolucao < data_retirada` é rejeitada *(BUG-008b)* |

### 2.4 `EmprestimoAPIFluxoTest` — Fluxo Completo via API

> Autenticação via `force_authenticate` com usuário `is_staff=True, is_superuser=True`.

| ID | Método | Descrição |
|---|---|---|
| TC-API-EMP-001 | `test_fluxo_completo_emprestar_devolver` | Fluxo feliz: `POST /emprestimos/` → verificar status → `PATCH /devolver/` → verificar DISPONIVEL |
| TC-API-EMP-002 | `test_emprestar_retorna_dados_aninhados` | `GET /emprestimos/` retorna chave e pessoa aninhados |
| TC-API-EMP-003 | `test_listar_emprestimos_ordenados_por_data_desc` | Listagem ordenada por `data_retirada` DESC |
| TC-API-EMP-004 | `test_impede_duplicidade_de_entrega` | **CRÍTICO:** segunda entrega da mesma chave retorna 400 e mantém exatamente 1 empréstimo ativo |
| TC-API-EMP-005 | `test_impede_devolucao_duplicada` | **CRÍTICO:** segunda devolução retorna 400 |
| TC-API-EMP-006 | `test_emprestar_chave_em_manutencao_retorna_400` | Chave em MANUTENCAO não pode ser emprestada |
| TC-API-EMP-007 | `test_devolver_emprestimo_inexistente_retorna_404` | `PATCH /emprestimos/9999/devolver/` retorna 404 |
| TC-API-EMP-008 | `test_apos_devolucao_chave_pode_ser_emprestada_novamente` | Após devolução, chave aceita novo empréstimo |
| TC-API-EMP-009 | `test_mesmo_pessoa_pode_pegar_chave_diferente` | Mesma pessoa pode ter múltiplas chaves simultâneas |
| TC-API-EMP-010 | `test_emprestar_para_pessoa_inativa_deve_falhar` | Pessoa inativa retorna 400 *(BUG-003)* |
| TC-API-EMP-011 | `test_data_retirada_retornada_com_offset_brasilia` | `data_retirada` na resposta possui offset de America/Sao_Paulo |
| TC-API-EMP-012 | `test_data_devolucao_e_timezone_aware_apos_devolver` | `data_devolucao` registrada é timezone-aware |
| TC-API-EMP-013 | `test_calcular_vencimento_mock_timezone` | Simula timezone via mock para validar registro correto de devolução *(BUG-007)* |

### 2.5 `EmprestimoRaceConditionTest` — Concorrência

> Usa `TransactionTestCase` (necessário para que `SELECT FOR UPDATE` funcione corretamente).

| ID | Método | Descrição |
|---|---|---|
| TC-RACE-001 | `test_race_condition_corrigida` | `@transaction.atomic + select_for_update()` garante exatamente 1 empréstimo ativo por chave em requisições concorrentes *(BUG-002)* |

### 2.6 `VencidoStatusTest` — Status VENCIDO Dinâmico

| ID | Método | Descrição |
|---|---|---|
| TC-VENC-001 | `test_property_vencido_false_dentro_do_prazo` | `emp.vencido` é `False` quando prazo não expirou |
| TC-VENC-002 | `test_property_vencido_true_apos_prazo` | `emp.vencido` é `True` quando prazo expirou |
| TC-VENC-003 | `test_property_vencido_false_sem_prazo_definido` | `emp.vencido` é `False` quando sem `data_prevista_devolucao` |
| TC-VENC-004 | `test_property_vencido_false_apos_devolucao` | Chave devolvida não é vencida mesmo após prazo |
| TC-VENC-005 | `test_status_calculado_retorna_vencido` | `chave.status_calculado` retorna `VENCIDO` quando prazo expirou |
| TC-VENC-006 | `test_status_calculado_retorna_emprestada_dentro_prazo` | `status_calculado` retorna `EMPRESTADA` dentro do prazo |
| TC-VENC-007 | `test_status_calculado_retorna_disponivel_sem_emprestimo` | Chave disponível retorna `DISPONIVEL` |
| TC-VENC-008 | `test_status_calculado_retorna_manutencao` | Chave em manutenção retorna `MANUTENCAO` |
| TC-VENC-009 | `test_status_calculado_usa_cache_prefetch` | `status_calculado` usa `_emprestimos_ativos_cache` sem query extra (anti N+1) |
| TC-VENC-010 | `test_api_filtro_status_vencido` | `GET /api/chaves/?status=VENCIDO` retorna apenas chaves vencidas *(BUG-007)* |
| TC-VENC-011 | `test_api_campo_vencido_na_resposta_do_emprestimo` | `GET /api/emprestimos/{id}/` expõe campo `vencido` |
| TC-VENC-012 | `test_serializer_rejeita_prazo_no_passado` | `data_prevista_devolucao` no passado retorna `ValidationError` |

---

## 3. Smoke Tests (`smoke_test.py`)

Verificações rápidas de infraestrutura para uso pré-deploy ou após restart de containers.

```bash
docker compose exec backend python smoke_test.py
# Exit code 0 = todos os checks passaram
# Exit code 1 = algum check falhou
```

### Bloco 1 — Banco de Dados (PostgreSQL)

| ID | Descrição |
|---|---|
| ST-DB-001 | Conexão com PostgreSQL estabelecida |
| ST-DB-002 | Tabelas críticas existem: `chave`, `emprestimo`, `pessoa`, `setor` |
| ST-DB-003 | Colunas críticas de `chave` existem: `id`, `codigo`, `descricao`, `status`, `ativo` |
| ST-DB-004 | Colunas críticas de `emprestimo` existem: `chave_id`, `pessoa_id`, `data_retirada`, `data_devolucao` |
| ST-DB-005 | Constraint `UNIQUE` em `chave.codigo` existe |
| ST-DB-006 | FK `emprestimo.chave_id` configurada com `ON DELETE RESTRICT` |
| ST-DB-007 | `INSERT/SELECT` em `chave` funciona (ROLLBACK ao final) |
| ST-DB-008 | Timezone do banco está definido |
| ST-DB-009 | Banco consegue calcular hora em `America/Sao_Paulo` |

### Bloco 2 — API REST

| ID | Descrição |
|---|---|
| ST-API-001 | `GET /api/chaves/` acessível (200, 401 ou 403) |
| ST-API-002 | Swagger UI acessível em `/api/schema/swagger-ui/` (200) |
| ST-API-003 | OpenAPI schema gerado em `/api/schema/` (200) |
| ST-API-004 | `GET /api/emprestimos/` acessível (200, 401 ou 403) |
| ST-API-005 | `POST /api/chaves/` cria chave com payload válido (201, 401 ou 403) |
| ST-API-006 | Filtro `?status=DISPONIVEL` retorna apenas chaves com status DISPONIVEL |

### Bloco 3 — Autenticação JWT e Segurança

| ID | Descrição |
|---|---|
| ST-JWT-001 | `djangorestframework-simplejwt` está instalado |
| ST-JWT-002 | Endpoint `/api/token/` existe (400 ou 401 com credenciais erradas) |
| ST-JWT-003 | Endpoints protegidos retornam 401 sem token (autenticação JWT ativa) |
| ST-JWT-004 | `SECRET_KEY` não está com valor padrão inseguro (`django-insecure-chave-temporaria`) |
| ST-JWT-005 | CORS configurado (validação manual recomendada: `CORS_ALLOW_ALL_ORIGINS=False` em produção) |
| ST-JWT-006 | `DEBUG=False` verificado via variável de ambiente `DJANGO_DEBUG` |

### Bloco 4 — Integridade de Dados

| ID | Descrição |
|---|---|
| ST-DATA-001 | Todas as chaves têm status válido (`DISPONIVEL`, `EMPRESTADA` ou `MANUTENCAO`) |
| ST-DATA-002 | Chaves com `status=EMPRESTADA` possuem empréstimo ativo correspondente |
| ST-DATA-003 | Chaves com `status=DISPONIVEL` não possuem empréstimo ativo |
| ST-DATA-004 | `data_devolucao` é sempre `>= data_retirada` |
| ST-DATA-005 | Nenhum CPF duplicado na tabela `pessoa` |

---

## Bugs Corrigidos (Rastreabilidade)

| Bug | Test ID(s) | Descrição |
|---|---|---|
| BUG-002 | TC-SVC-008, TC-RACE-001 | Race condition: `@transaction.atomic + select_for_update()` no service |
| BUG-003 | TC-API-EMP-010 | Pessoa inativa bloqueada no serializer (`validate_pessoa`) |
| BUG-004 | TC-API-CHV-015 | `DELETE` em chave com empréstimo retorna 409 (`RestrictedError`) |
| BUG-007 | TC-VENC-001 a 012, TC-API-EMP-013 | Status VENCIDO calculado dinamicamente; nunca persiste no BD; filtro via query param |
| BUG-008 | TC-SER-DEV-004, TC-SER-DEV-005 | `data_devolucao` futura ou anterior à retirada rejeitada pelo serializer |
