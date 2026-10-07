# Copilot: consulta de ativos por usuário

Leia ai/AGENT_INSTRUCTIONS.md, ai/PROJECT_BRAIN.md e docs/CONSULTA_USUARIO.md. O fluxo principal mudou: agora consultamos a chave do usuário, e não o hostname do equipamento.

A interface chama POST /api/usuarios/consulta com {"usuario":"CHAVE-FICTICIA"}. O backend faz POST JSON ao endpoint corporativo configurado em IAM_API_URL com username, password e Usuario. Conta, senha, URL interna e certificados devem ficar apenas na configuração local autorizada, nunca no frontend, fixtures, relatórios ou commits.

Arquivos principais:
- backend/app/models/usuario.py: contrato e validação.
- backend/app/services/usuario_service.py: seleção mock/api, POST, TLS, timeout e erros.
- backend/app/routes/usuarios.py: endpoint local.
- backend/.env.example: modelo sem segredos.
- backend/tests/test_usuarios.py: testes sem acesso à rede real.
- frontend/src/App.tsx: formulário por chave do usuário.
- frontend/src/components/UserAssetsResult.tsx: três categorias visíveis de ativos.
- frontend/src/services/api.ts e frontend/src/types.ts: cliente e contrato.

O retorno oficial informado contém sucesso booleano e smartphone, telFixa, coletor, notebook, palm, desktop, tablet, certificado e monitor, cada um string ou null. Preserve textos originais; não inferir serial/modelo dividindo strings por vírgulas. Não inventar nome do responsável. Sucesso true com campos nulos significa consulta concluída sem ativos informados. O significado de sucesso false ainda precisa ser confirmado na documentação oficial.

O modo mock é padrão e usa exclusivamente dados sintéticos. No modo api, configuração ausente ou falha de comunicação não pode retornar mock. Respostas inválidas, timeout, autenticação recusada, 429 e falhas HTTP não devem ser interpretadas como usuário inexistente. Não desabilitar TLS, não seguir redirecionamentos com credenciais e não registrar corpos de requisição/resposta corporativos.

Próximos passos no ambiente autorizado: validar documentação e resposta real; confirmar semântica de sucesso false, autenticação e autorização de usuários da aplicação, certificados, proxy e regras de acesso. Solicite somente os esclarecimentos necessários e mantenha segredos fora do chat. Não faça alterações de ativos nem consultas em massa: o escopo é consulta de leitura por chave.

Preserve a identidade visual preto/verde e a proporção da logo. O scanner de equipamento saiu da tela principal porque um hostname não é uma chave de usuário. O endpoint antigo permanece para compatibilidade. Não recolocar o scanner sem definir um QR de usuário ou uma conversão documentada.

Execute backend/.venv/Scripts/python.exe -m pytest no backend e npm run lint, npm run build, npm run lint:context no frontend. Use transporte HTTP simulado e fixtures sintéticas. Testes não podem depender da rede corporativa. Relate alterações, testes, pendências e limitações sem revelar informações confidenciais.
