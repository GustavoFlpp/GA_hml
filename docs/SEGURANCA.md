# Segurança para compartilhamento — 07/10/2026

## Impedimento para publicação pública

A revisão identificou dados potencialmente reais na fixture `backend/app/data/mock_iam.json` de commits antigos, incluindo o commit inicial `28a4667`. Há associação entre nome completo, chave de usuário e identificadores de equipamento. Os valores não são reproduzidos aqui. A fixture atual é sintética, mas o histórico anterior continua recuperável.

Não torne o repositório atual público antes de tratar esse histórico. Opções: criar um novo repositório a partir de uma cópia revisada somente dos arquivos atuais, sem `.git`, arquivos ignorados ou configurações locais; ou sanitizar o histórico, revisando todas as referências e coordenando a mudança com os colaboradores. Reescrever commits não apaga clones, forks ou caches anteriores. Esta revisão não fez push, alteração de visibilidade nem reescrita do histórico.

Compartilhar um repositório privado por convite permite acesso da equipe sem publicação pública. Dados já compartilhados devem ser avaliados pela governança responsável.

## Proteções e limitações

- `.env` e variantes locais ficam fora do Git; modelos contêm configuração de demonstração e campos vazios.
- Chaves privadas, certificados locais, planilhas, bancos, logs, caches, cobertura e builds são ignorados. Isso não remove arquivos já versionados.
- A integração envia credenciais somente pelo backend, exige HTTPS/TLS válido e não segue redirecionamentos. Erros externos viram mensagens controladas, sem copiar o corpo da fonte.
- CORS aceita origens exatas configuradas, GET/POST e Content-Type, sem credenciais de navegador ou origem curinga.
- Respostas têm Cache-Control: no-store e X-Content-Type-Options: nosniff.
- **Não há autenticação, autorização por usuário nem limitação de consultas na aplicação.** Quem alcançar a API real poderá consultar chaves com os privilégios da conta de serviço. CORS e o ícone de segurança da interface não impedem isso.
- O modo mock serve para demonstração fictícia. A saúde da API não confirma conectividade com a fonte.

## Antes de operar com dados reais

Defina autenticação corporativa e autorização no backend ou em gateway obrigatório, incluindo quem pode consultar terceiros. Restrinja a rede, configure limites de consulta, HTTPS e gestão de segredos. Estabeleça auditoria com retenção adequada sem registrar senhas ou corpos corporativos. Confirme política de divulgação do código e uso da identidade visual.

Audite dependências antes de cada publicação. Varreduras por padrões não comprovam ausência de segredos e não substituem revisão humana de dados pessoais. Não envie arquivos locais ignorados por ZIP ou cópia da pasta inteira. As dependências Python não têm lockfile; a instalação ainda não é reproduzível.

## Evidências desta revisão

- Revisão de 13 commits e 91 objetos únicos, com busca por padrões de tokens GitHub, chaves AWS, chaves privadas, atribuições de credenciais e URLs internas. O único achado de atribuição de credencial nesses padrões era sintético, em teste. A revisão manual da fixture antiga identificou o impedimento de dados pessoais descrito acima.
- Comparação dos arquivos atuais publicáveis com as credenciais e a URL do backend local: nenhuma correspondência. Os dois `.env` estão ignorados e o frontend local contém apenas a chave de configuração esperada, VITE_API_URL.
- Backend: 41 testes aprovados, incluindo ausência de cache e CORS; compilação Python aprovada. Foi necessário usar pasta temporária local por restrição de permissão do Windows. Há um aviso de depreciação em dependência de testes.
- Frontend: 30 testes aprovados; lint, build e orçamento de contexto aprovados. npm audit terminou sem vulnerabilidades conhecidas após correção compatível de source-map-js no lockfile.
- A auditoria do ambiente Python identificou avisos no pip 26.0.1; a ferramenta local foi atualizada para 26.2.1. Essa alteração está no ambiente virtual ignorado, não nas dependências da aplicação. A auditoria final pip-audit não encontrou vulnerabilidades conhecidas; pip check não encontrou incompatibilidades.
- Removidos componentes/frontend de QR e hostname sem consumidores, assets do template, README do template, gerador antigo de QR e dependências associadas. O endpoint legado e seus testes permanecem por compatibilidade.

O arquivo `gestao-ativos-compartilhamento.zip`, gerado localmente e ignorado pelo Git, contém apenas a versão atual dos arquivos do código e documentação, sem histórico, configurações locais, caches, builds ou dependências. Pode servir de base para um **novo** repositório. Não use esse arquivo para justificar tornar público o repositório antigo: seu histórico continua intacto. Nenhuma consulta corporativa real foi executada.
