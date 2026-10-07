> Atualização de 07/10/2026: a interface mostra três categorias e o nome retornado pela API. Componentes antigos de QR/hostname foram removidos; o endpoint legado permanece. CORS agora é configurável por CORS_ORIGINS, sem origem de hospedagem fixa. Os números de testes abaixo registram a auditoria original.

# Auditoria de UI/UX e fluxos — 05/10/2026

## Conclusão e alcance

O fluxo principal faz sentido para consulta de ativos por chave do usuário: uma página, com formulário e estados de carregamento, sucesso, vazio e falha. A interface não promete nome do responsável, serial/modelo estruturados ou quantidade de equipamentos que o contrato oficial não fornece. Os textos originais são preservados por categoria.

A revisão corrigiu problemas de contraste, foco, recuperação de erros e configuração de produção. A validação automatizada de interação usa React Testing Library e JSDOM, com respostas sintéticas. O navegador automatizado não estava disponível nesta sessão; não houve inspeção visual em browser, medição de layout renderizado, teste com leitor de tela ou certificação de acessibilidade. Também não foram feitas consultas à API corporativa com dados reais durante esta auditoria.

## Inventário dos estados atuais

| Estado | Comportamento esperado e verificado por teste |
| --- | --- |
| Inicial | Campo rotulado, limite de 128 caracteres, sem resultado antigo. |
| Chave inválida | Espaços vazios não geram chamada; mensagem e foco no campo. |
| Consulta por teclado | Enter envia chave normalizada, sem credenciais do serviço no navegador. |
| Carregamento | Progresso anunciado, formulário ocupado e bloqueio de requisições duplicadas. |
| Sucesso | Nove categorias, valores originais, chave consultada e fonte da informação. |
| Sucesso parcial | Campos vazios identificados; contador representa categorias, não equipamentos. |
| Sucesso sem ativos | Mensagem de consulta concluída sem ativos; distinta de consulta não confirmada. |
| Sucesso não confirmado | Mensagem explícita, sem exibir ativos de uma resposta não confirmada. |
| Falha de consulta | Erro anunciado, sem resultados antigos; usuário pode corrigir e tentar novamente. |
| Nova consulta | Limpa resultado e chave e devolve foco ao campo. |
| Resposta inesperada | Contrato inválido não vai para a tela de ativos; HTML não é interpretado. |
| Erro de renderização | Fallback com ação de recarregar, evitando tela vazia. |
| Produção sem URL | Mensagem de serviço não configurado; sem chamada automática ao localhost do visitante. |

O scanner e os componentes da consulta por hostname pertencem ao fluxo legado e não são telas acessíveis pela aplicação principal atual. O endpoint antigo continua para compatibilidade.

## Correções realizadas

- Foco enviado ao resultado após consulta e devolvido ao campo em nova consulta.
- `aria-busy` no formulário e `aria-invalid` apenas para chave inválida; falha de rede não torna a chave inválida.
- Erro antigo é removido ao editar a chave. Tentativa inválida limpa resultado anterior.
- Texto de campos vazios: contraste passou de 3,67:1 para 8,27:1 sobre o fundo dos cards. Rodapé também recebeu cor legível. O mínimo WCAG AA para texto normal é 4,5:1: [W3C, contraste mínimo](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- Foco visível para botões e resultado; campo com borda mais visível, ação Nova consulta com área de toque de 44px ou mais.
- Logo mantém proporção, com tamanho menor em telas estreitas; header permite quebra de texto. Textos longos nos cards permitem quebra em qualquer ponto.
- Preferência por movimento reduzido respeitada pelo indicador de progresso.
- Backend retorna códigos de erro controlados. Frontend distingue configuração, autorização da integração, limite, timeout, rede e formato inválido, sem mostrar textos arbitrários da fonte externa.
- Timeout do navegador é tratado separadamente de desconexão.
- Produção requer `VITE_API_URL`; localhost permanece apenas como padrão de desenvolvimento.

## Pendências para aceitar visualmente

Validar a página real em desktop e celular (320, 375, 768 e 1440px), zoom de 200%, teclado e leitor de tela. Verificar foco visível, ausência de rolagem horizontal, texto longo, contrastes efetivos, loading lento e retorno após falha. Os breakpoints e estilos foram revisados no código; comportamento visual e interação assistiva ainda precisam ser confirmados no navegador.

Validar também a resposta oficial com casos autorizados de usuário com ativos, sem ativos e consulta não confirmada. O significado empresarial de `sucesso: false` ainda não está documentado; o sistema não o chama de usuário inexistente.

## Hospedagem

Vercel suporta tanto [Vite](https://vercel.com/docs/frameworks/frontend/vite) como [FastAPI](https://vercel.com/docs/frameworks/backend/fastapi). Essa compatibilidade não cria acesso à rede interna da empresa. Um domínio que abre no navegador não comprova autorização para hospedar código/dados nem conectividade do servidor cloud ao endpoint corporativo.

| Opção | Avaliação para este projeto |
| --- | --- |
| Frontend e backend em infraestrutura corporativa HTTPS | Opção preferencial se disponível: mantém o backend próximo da API e permite servir aplicação e `/api` no mesmo domínio. |
| Frontend na Vercel, backend corporativo | Viável se aprovado. O navegador do usuário precisa alcançar o backend HTTPS pela rede/VPN autorizada, com certificado válido e CORS para o domínio exato do frontend. Os pedidos atuais são feitos pelo navegador; a Vercel apenas entrega os arquivos do frontend nessa opção. |
| Frontend e backend na Vercel | Condicional: o backend cloud precisa conseguir resolver e alcançar a API corporativa com autorização da TI. Não assumir que o plano padrão consegue acessar a intranet. |

A Vercel documenta conexões privadas com infraestrutura interna e VPN no [Secure Compute](https://vercel.com/docs/networking/secure-compute). Isso exige configuração de rede e contratação apropriada, não acontece ao importar o repositório.

Se o frontend for aprovado na Vercel, os parâmetros previstos são: Root Directory `frontend`, preset Vite, build `npm run build`, saída `dist` e `VITE_API_URL` apontando para o backend HTTPS aprovado. Esse endereço é incorporado ao build: alterá-lo exige novo build/deploy. Não usar localhost em um site publicado. Nenhum deploy ou arquivo de publicação foi criado nesta auditoria.

## Impedimentos atuais para publicação de dados reais

1. Não há autenticação nem autorização de usuários no endpoint. Quem alcançar o backend pode consultar uma chave com os privilégios da conta de serviço. CORS não é controle de acesso.
2. Perfil de acesso ainda precisa ser definido: gestores consultam terceiros ou colaboradores consultam apenas os próprios ativos. A interface atual permite digitar qualquer chave.
3. CORS ainda permite origens locais e uma origem Render fixa; um frontend na Vercel requer configuração para seu domínio aprovado. Não abrir para todas as origens.
4. A conectividade externa até a API privada não foi verificada e depende da infraestrutura autorizada.
5. Conta e senha devem permanecer exclusivamente no backend/gerenciador de segredos autorizado, nunca em `VITE_*` ou no repositório.

Essas pendências impedem afirmar que o projeto está pronto para uma publicação pública com dados reais. A escolha da hospedagem deve vir junto com acesso, rede e autorização corporativa.

## Reprodução dos testes

Resultado desta revisão: 29 testes de frontend e 39 de backend aprovados; lint,
build e verificação do diff aprovados. Auditoria npm final sem vulnerabilidades
reportadas após atualização compatível de uma dependência transitiva.

Frontend: `npm test`, `npm run lint`, `npm run build`, `npm run lint:context`. Backend: `.venv\Scripts\python.exe -m pytest -q -p no:cacheprovider`. A suíte cobre fixtures sintéticas e transporte HTTP simulado, sem rede corporativa.

Se a pasta temporária padrão do Windows tiver erro de permissão, use `--basetemp` com uma nova pasta temporária dentro do projeto; não use uma pasta que contenha dados, pois pytest gerencia seu conteúdo.
