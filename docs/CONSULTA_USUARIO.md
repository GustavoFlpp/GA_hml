# Consulta de ativos por chave do usuário

A tela principal consulta uma chave de usuário e exibe somente Notebook, Smartphone e Tablet. A contagem considera apenas essas três categorias. Os textos são preservados; campos nulos ou vazios aparecem como “Sem ativo informado”. O nome retornado pela API aparece no título, com a chave como alternativa quando não informado.

## Execução com dados fictícios

O padrão é `IAM_SOURCE=mock`. Use `U090001` para um usuário com ativos e `U090002` para uma consulta bem-sucedida sem ativos. Essas chaves são exclusivamente de demonstração.

Abra dois terminais PowerShell na raiz do projeto. No primeiro, execute o backend:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Em outro terminal, a partir da raiz:

```powershell
cd frontend
npm install
npm run dev
```

Abra `http://127.0.0.1:5173`. Os logs aparecem nos próprios terminais. Para
encerrar, pressione `Ctrl+C` em cada terminal. Instale dependências na primeira
execução ou quando mudarem; nas próximas vezes basta iniciar cada servidor.

## Configuração da API corporativa

Na pasta `backend`, copie o modelo somente se ainda não tiver configuração local:

```powershell
Copy-Item .env.example .env
```

Edite `backend/.env` no ambiente autorizado. Defina `IAM_SOURCE=api`, a URL oficial completa em `IAM_API_URL`, a conta de serviço em `IAM_API_USERNAME` e a senha em `IAM_API_PASSWORD`. Use aspas ao redor dos valores das credenciais, especialmente quando houver `#` ou espaços. Não coloque essas variáveis no frontend: valores `VITE_*` são públicos.

O `.env` é ignorado pelo Git. O modelo contém apenas placeholders. A integração exige HTTPS, preserva verificação TLS e usa timeout configurável (padrão 15 segundos, máximo 60). Se a rede exigir CA corporativa, configure `IAM_CA_BUNDLE` com o caminho do certificado autorizado. Configure rede/VPN/proxy conforme o ambiente corporativo; não desative TLS.

O backend carrega `backend/.env` automaticamente. Para iniciar, execute na pasta `backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Após alterar `.env`, pressione `Ctrl+C` no terminal do backend e execute novamente
o comando acima. Evite abrir duas instâncias do mesmo serviço:
cada porta deve ter apenas um servidor ativo.

No início, o terminal informa `Fonte de consulta: API corporativa` ou `Mock (dados fictícios)`.
`GET /api/health` também informa `iam_source` sem revelar credenciais.
Variáveis já definidas no processo têm prioridade sobre o `.env`; se houver uma definição
antiga de `IAM_SOURCE=mock` no PowerShell, remova-a com `Remove-Item Env:IAM_SOURCE`
antes de reiniciar para usar a configuração do arquivo.

## Contrato da aplicação

`POST /api/usuarios/consulta`, com corpo `{"usuario":"CHAVE-FICTICIA"}`. O backend acrescenta as credenciais localmente e envia um POST JSON com `username`, `password` e `Usuario` ao endpoint oficial configurado.

O retorno ao frontend contém `usuario`, `nome`, `sucesso`, `origem`, `ativos` (as nove categorias originais, string ou null) e `mensagem`. Somente esses campos são expostos; credenciais e outros campos inesperados da fonte não são repassados. A chave é normalizada com trim e maiúsculas, sem inventar um formato por regex.

`sucesso: true` com todos os campos nulos é uma consulta concluída sem ativos informados. `sucesso: false` é uma consulta não confirmada; seu significado detalhado ainda depende da documentação oficial. Erros HTTP, timeout, autenticação recusada e respostas inválidas são falhas de integração, nunca “usuário inexistente”. Não há fallback para mock em modo real.

O endpoint anterior por hostname permanece para compatibilidade com os testes e consumidores existentes, mas não é usado pela nova tela. QR Codes de equipamentos não resolvem uma chave de usuário; o scanner foi retirado do fluxo principal.

## Verificação e limites

Execute os testes do backend com `.\.venv\Scripts\python.exe -m pytest` e os comandos `npm test`, `npm run lint`, `npm run build`, `npm run lint:context` no frontend. Os testes da integração usam transporte simulado, sem credenciais reais ou acesso corporativo.

Validação de UI/UX, limites da conferência visual e avaliação de hospedagem:
[Auditoria de UI/UX](AUDITORIA_UI_UX.md).

A conexão real deve ser validada no ambiente autorizado depois da configuração local. Autenticar a conta de serviço na fonte não autentica os usuários desta aplicação: antes de expor dados reais a outros usuários ou publicar o sistema, implemente o controle de acesso definido pela empresa. O servidor local escuta apenas em loopback.
