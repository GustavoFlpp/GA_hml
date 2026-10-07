# PROJECT BRAIN

## 1. Product
- Gestão de Ativos: consulta pela chave do usuário, exibindo ativos por categoria.
- Integração POST corporativa implementada e testada com transporte simulado; mock é padrão até configuração local autorizada.

## 2. Stack
- Frontend: React 19, TypeScript, Vite e Tailwind CSS (`frontend/`).
- Backend: FastAPI/Pydantic/Uvicorn (`backend/`).
- Dados: `backend/app/data/mock_iam.json` com fixtures anonimizadas; não há banco de dados.
- Infraestrutura: há referência a frontend publicado no Render; configuração de deploy não está versionada.

## 3. Architecture
- Fluxo principal: chave -> `POST /api/usuarios/consulta` -> `usuario_service` -> mock ou API corporativa configurada por ambiente.
- Backend monta POST JSON com username/password/Usuario; segredos e URL interna ficam na configuração local do backend.
- `ConsultaUsuarioResponse` retorna usuario, nome (string/null), sucesso, origem, ativos, mensagem; tipos equivalentes no frontend.
- Endpoint antigo `GET /api/ativos/{hostname}` permanece por compatibilidade; scanner saiu da tela principal.
- Frontend usa `VITE_API_URL` (modelo em `frontend/.env.example`); a URL pública é definida no build de deploy.
- Execução manual em dois terminais: Uvicorn no backend e npm run dev no frontend. Vite local usa 127.0.0.1:5173 com strictPort.

## 4. Current State
- UI: formulário por chave, estados de carregamento/erro e nome completo retornado pela API e cards de três categorias (Notebook, Smartphone e Tablet); mock é identificado na origem.
- `IAM_SOURCE=mock|api`; modo real exige URL HTTPS e credenciais. Sem fallback real -> mock, redirecionamentos ou TLS desabilitado.
- Backend carrega `.env` automaticamente por caminho absoluto, aceitando BOM Windows; variáveis do processo têm prioridade. Reinicie após alterações. Fonte ativa aparece no log inicial e em /api/health (iam_source).
- Testes cobrem contrato legado e integração de usuário com transporte HTTP simulado.

## 5. Business Rules
- Identificadores são comparados com `trim()` e sem distinção de maiúsculas/minúsculas; não inferir formatos por regex.
- Novo fluxo preserva texto original de cada categoria, sem inferir serial/modelo; nome vem do campo nome da API.
- Sucesso true sem valores visíveis é consulta concluída sem ativos; significado oficial de sucesso false ainda não foi confirmado. Somente Notebook, Smartphone e Tablet aparecem na UI e na contagem; backend preserva as nove categorias e aceita ausência das três exibidas.
- Regras de completude por hostname pertencem somente ao endpoint legado.

## 6. Security Rules
- Não versionar `.env`, credenciais ou dados pessoais/corporativos; preservar `.env.example` se criado.
- O mock utiliza fixtures fictícias estruturalmente realistas, sem reutilização de identificadores reais; não acessar IAM real.

## 7. Quality Gates
- Frontend: `npm run lint`, `npm run build`, `npm run lint:context`.
- UI/interações e cliente HTTP: `npm test` (Vitest/JSDOM; dados sintéticos). Auditoria e limites de validação visual em `docs/AUDITORIA_UI_UX.md`.
- Backend: `pytest`, compilação Python e importação da app.

## 8. Current Risks
- Histórico Git contém fixtures antigas com dados potencialmente reais; publicação pública exige sanitização do histórico ou novo repositório sem histórico, conforme docs/SEGURANCA.md.
- Conexão real ainda precisa ser validada na rede autorizada, com configuração local e certificados/proxy quando necessários.
- Aplicação ainda não autentica/autoriza seus usuários; conta de serviço na fonte não substitui controle de acesso da aplicação.
- Não há configuração de deploy versionada identificada até aqui.
- CORS usa CORS_ORIGINS com origens exatas, GET/POST e Content-Type; respostas não devem ser armazenadas em cache.
- Produção do frontend exige VITE_API_URL; hostname localhost é padrão somente de desenvolvimento. Hospedar backend fora da rede exige conectividade privada autorizada.

## 9. Frozen Decisions
- Mudança para chave do usuário autorizada; não interpretar QR de equipamento como chave de usuário.
- Preservar identidade visual preto/verde Usiminas e proporção original da logo.

## 10. Next Step
- Configurar e validar API real no ambiente autorizado; confirmar semântica de sucesso false e requisitos de controle de acesso.
- Guia de implementação no ambiente corporativo autorizado: `ai/COPILOT_INTEGRACAO_API.md`, sem detalhes ou credenciais da API real.
