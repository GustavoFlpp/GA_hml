# Gestão de Ativos

Aplicação web para consultar os ativos vinculados à chave de um usuário. A interface apresenta o nome retornado pela fonte e três categorias: **Notebook, Smartphone e Tablet**. Os textos são preservados, sem inferir modelo, serial ou quantidade de equipamentos.

MVP para desenvolvimento e avaliação técnica. O padrão usa dados fictícios; a integração corporativa está implementada e testada com transporte simulado, mas depende de validação no ambiente autorizado.

> **Publicação pública bloqueada:** o histórico Git contém dados potencialmente reais em fixtures antigas. A anonimização atual não remove esses commits. Veja [a revisão de segurança](docs/SEGURANCA.md). O backend também não autentica nem autoriza os usuários da aplicação; não exponha a integração real sem controle de acesso.

## Funcionalidades

- Consulta por chave normalizada, com limite de 128 caracteres.
- Nome retornado pela API, chave consultada e origem dos dados.
- Estados de carregamento, resultado, ausência de ativos e consulta não confirmada.
- Erros controlados de configuração, timeout, rede e contrato inválido.
- Navegação por teclado e ação para iniciar nova consulta.
- API legada por hostname preservada para compatibilidade; QR Code não faz parte da interface atual.

## Arquitetura

```text
React / TypeScript → POST /api/usuarios/consulta → FastAPI
                                                   ├─ mock: dados sintéticos
                                                   └─ api: POST HTTPS à fonte autorizada
```

Credenciais ficam exclusivamente no backend. Não há banco de dados, login ou alteração de ativos. O backend preserva nove categorias; a interface mostra apenas as três indicadas acima.

| Pasta | Conteúdo |
| --- | --- |
| backend/app | Rotas, contratos Pydantic, configuração e serviços |
| backend/tests | Testes da API e integração simulada |
| frontend/src | Interface React e cliente HTTP |
| frontend/tests | Testes de interação e contrato |
| docs | Guias e revisões técnicas |
| ai | Contexto e instruções de manutenção |

## Executar localmente

Use Python 3.13 e Node.js 22.12+ (ou 20.19+), com npm. Os comandos abaixo são para PowerShell, partindo da raiz em cada terminal. Não abra index.html diretamente.

**Terminal 1 — backend:**

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
# Copie somente se ainda não tiver .env local.
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

O modelo usa `IAM_SOURCE=mock`. Confira a fonte antes de demonstrar caso já tenha configuração real local. O backend carrega backend/.env automaticamente; variáveis do processo têm prioridade. Reinicie após alterar a configuração.

**Terminal 2 — frontend:**

```powershell
cd frontend
npm ci
# Copie somente se ainda não tiver .env local.
Copy-Item .env.example .env
npm run dev
```

Abra http://127.0.0.1:5173. A API fica em http://127.0.0.1:8000, com documentação em /docs e saúde em /api/health. A porta 5173 é fixa; encerre os serviços com Ctrl+C.

| Chave fictícia | Resultado |
| --- | --- |
| U090001 | Consulta bem-sucedida com ativos de demonstração |
| U090002 | Consulta bem-sucedida sem ativos |
| Outra chave | Consulta não confirmada na base fictícia |

## Configuração

| Variável | Ambiente | Uso |
| --- | --- | --- |
| IAM_SOURCE | Backend | mock (padrão) ou api |
| IAM_API_URL | Backend | Endpoint HTTPS completo, somente no ambiente autorizado |
| IAM_API_USERNAME / IAM_API_PASSWORD | Backend | Credenciais da conta de serviço |
| IAM_API_TIMEOUT_SECONDS | Backend | Padrão 15 segundos, máximo 60 |
| IAM_CA_BUNDLE | Backend | Caminho opcional de CA autorizada |
| CORS_ORIGINS | Backend | Origens exatas separadas por vírgula; padrão limitado às origens locais |
| VITE_API_URL | Frontend | Endereço da API; incorporado ao build e visível ao usuário |

Nunca coloque credenciais ou a URL interna da integração em variáveis VITE_*. O modo real não usa mock como fallback, não segue redirecionamentos e mantém verificação TLS. Consulte [o guia de integração](docs/CONSULTA_USUARIO.md).

## API

```http
POST /api/usuarios/consulta
Content-Type: application/json

{"usuario":"U090001"}
```

O retorno contém usuario, nome (string ou null), sucesso, origem, ativos e mensagem. As categorias são notebook, smartphone, tablet, telFixa, coletor, palm, desktop, certificado e monitor, com valores string ou null.

`sucesso: true` sem ativos representa consulta concluída sem ativos informados. `sucesso: false` representa consulta não confirmada; o significado oficial ainda precisa ser validado. Falhas de rede não significam usuário inexistente.

`GET /api/ativos/{hostname}` é legado e consulta exclusivamente a fixture local. `GET /api/health` informa a fonte configurada, sem testar conectividade corporativa.

## Validações

No backend:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m compileall -q app
```

No frontend:

```powershell
npm test
npm run lint
npm run build
npm run lint:context
npm audit
```

Os testes usam dados sintéticos e HTTP simulado. Não validam a conexão real ou a experiência visual em navegador. As dependências Python ainda não têm lockfile; a instalação não garante versões idênticas entre ambientes.

## Compartilhamento e implantação

Um repositório privado permite convidar colaboradores sem torná-lo público. Antes de publicar, trate o histórico indicado na [revisão de segurança](docs/SEGURANCA.md) e confirme a autorização para divulgar código e identidade visual corporativos.

O build do frontend usa npm run build e gera frontend/dist. Configure VITE_API_URL antes do build e o domínio aprovado em CORS_ORIGINS. CORS não substitui autenticação. A hospedagem do backend precisa de rede autorizada, HTTPS, autenticação, autorização por perfil e limites de consulta. Não há infraestrutura de deploy versionada.

Não há licença de distribuição definida. Publicar o código não concede automaticamente permissão para reutilizar a marca ou os ativos corporativos.

## Documentação

- [Consulta por usuário](docs/CONSULTA_USUARIO.md)
- [Revisão de segurança](docs/SEGURANCA.md)
- [Auditoria de UI/UX](docs/AUDITORIA_UI_UX.md)
- [Contexto de manutenção](ai/PROJECT_BRAIN.md)
