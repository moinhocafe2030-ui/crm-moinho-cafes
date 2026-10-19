# CRM Moinho Cafés

CRM interno para controlar potenciais clientes (cafeterias, restaurantes, empórios, escritórios, revendedores).

> Este README é atualizado a cada etapa do projeto. Hoje ele cobre apenas o que já existe: o projeto
> base e a tela de login. As seções de Vercel, Google e WhatsApp serão preenchidas quando chegarmos nessas etapas.

## Status atual

- [x] Projeto base (Vite + React + TypeScript + Tailwind + PWA)
- [x] Schema SQL inicial com todas as tabelas e Row Level Security (`supabase/migrations/0001_init.sql`)
- [x] Tela de login (Supabase Auth)
- [x] Cadastro, lista com busca/filtros e ficha de clientes
- [x] Funil Kanban com arrastar e soltar, motivo da perda e edição de etapas
- [x] Histórico de interações, próximo passo e tela "Hoje"
- [x] Painel com métricas (valor potencial, taxa de conversão, total por etapa, clientes parados)
- [x] Importar/exportar CSV
- [x] Integração Google Agenda
- [x] Envio de email com modelos editáveis
- [x] Lembrete diário por email (09:00, Edge Function + pg_cron)
- [ ] Publicação na Vercel

## Como rodar localmente

1. Instale as dependências:
   ```bash
   npm install
   ```
2. Copie `.env.example` para `.env.local` e preencha com a URL e a chave do seu projeto Supabase
   (você encontra em **Supabase > Settings > API**):
   ```bash
   cp .env.example .env.local
   ```
3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
4. Abra `http://localhost:5173` no navegador.

## Banco de dados (Supabase)

O schema fica versionado em `supabase/migrations/`. Para aplicar no seu projeto Supabase:

1. Abra o **SQL Editor** do seu projeto em [supabase.com](https://supabase.com)
2. Rode, em ordem, cada arquivo de `supabase/migrations/` (0001, depois 0002, etc.) — sempre
   limpando o editor (Ctrl+A, Delete) antes de colar o próximo, para não misturar os scripts
3. (Opcional) Para ver dados de exemplo, rode também `supabase/seed/seed_exemplo.sql` — todos os
   registros de exemplo começam com `[EXEMPLO]` e podem ser apagados com o comando que está no
   final desse arquivo.

## Importar clientes de uma planilha

Na tela **Clientes**, use **Exportar CSV** para baixar um modelo com as colunas certas (ou veja a
lista abaixo). Para importar, prepare um CSV com estas colunas (os nomes das colunas precisam bater
exatamente; colunas que você não tiver podem ficar em branco ou ser omitidas):

`Nome do contato, Nome do estabelecimento, Tipo, Interesses, Telefone, Email, Instagram, Cidade, Bairro, Endereço, Origem, Etapa, Responsável, Observações`

- **Nome do contato** e **Nome do estabelecimento** são obrigatórios.
- **Interesses**: vários valores separados por `;` (ex: `Catering; Torra`).
- **Tipo**, **Origem** e **Etapa**: use os mesmos nomes que aparecem no sistema (ex: "Cafeteria",
  "Instagram", "Negociação"). Se não reconhecer, usa "Outro" ou a primeira etapa do funil.
- **Responsável**: nome exato de um vendedor já cadastrado (opcional).

## Google Agenda e Email

Uma única conexão com o Google cobre as duas coisas:
- Quando um vendedor define uma data de retorno (com ou sem horário) na ficha de um cliente, o CRM
  cria/atualiza automaticamente um evento na Google Agenda dele.
- O vendedor pode enviar email direto da ficha do cliente (com ou sem modelo), usando a própria
  conta do Gmail. O envio fica registrado no histórico do cliente automaticamente.

### Como já está configurado
- Projeto no Google Cloud: `CRM - Moinho Cafe Global`
- APIs ativadas: **Google Calendar API** e **Gmail API**
- Escopos autorizados: `calendar.events` e `gmail.send`
- Tela de permissão OAuth em modo **Teste** (não publicada), com os vendedores autorizados
  cadastrados como "usuários de teste"
- Três Edge Functions no Supabase:
  - `google-oauth-callback` — recebe o retorno do Google e salva o token (precisa estar com
    **Verify JWT desligado**, pois é chamada diretamente pelo Google)
  - `google-agenda-sincronizar` — cria/atualiza o evento na agenda (Verify JWT ligado, padrão)
  - `enviar-email` — envia o email pelo Gmail e registra no histórico (Verify JWT ligado, padrão)
- Secrets configurados em **Supabase > Edge Functions > Secrets**: `GOOGLE_CLIENT_ID` e
  `GOOGLE_CLIENT_SECRET` (usados pelas três funções)
- `.env.local` com `VITE_GOOGLE_CLIENT_ID`

### Cada vendedor conecta a própria conta
1. Vendedor loga no CRM
2. Vai em **Configurações** → **Conectar Google**
3. Autoriza (vai aparecer um aviso "app não verificado" — é esperado, clique em "Avançado" e
   depois em "Acessar [nome do app] (não seguro)")

### Modelos de email
Em **Configurações → Gerenciar modelos**, é possível criar modelos reutilizáveis (nome, assunto,
corpo). No assunto ou no corpo, use `{{nome_contato}}`, `{{nome_estabelecimento}}`, `{{cidade}}` ou
`{{responsavel}}` — são substituídos automaticamente pelos dados do cliente na hora de enviar.

### Lembrete diário por email
Todo dia às **09:00** (horário de Brasília), cada vendedor conectado ao Google recebe um email
automático com os retornos atrasados e os de hoje **dos clientes que ele é responsável**.

- Edge Function: `lembrete-diario` (dispara sem autenticação de usuário — é chamada pelo pg_cron
  usando a service role key, então mantém **Verify JWT ligado**, padrão)
- Agendamento: `supabase/migrations/0004_lembrete_diario_cron.sql`, usando as extensões **pg_cron** e
  **pg_net**, e a service role key guardada com segurança no **Vault** do Supabase (nunca fica
  exposta no código ou no histórico do SQL Editor)
- Para conferir se está agendado: `select * from cron.job;` no SQL Editor
- Para testar manualmente sem esperar o horário, chame a função com uma ferramenta como `curl` ou
  Postman usando seu token de login (não funciona direto pelo navegador por causa do CORS)

## Logo da empresa

A logo fica guardada no Supabase Storage (bucket `branding`), não no código — você troca quando
quiser direto em **Configurações → Trocar logo**, sem precisar pedir ajuda. Aparece na tela de login
e no cabeçalho do app. Se nenhuma logo foi enviada ainda, esses espaços ficam só com o nome em texto.

Configuração necessária (uma vez só): rode `supabase/migrations/0005_storage_branding.sql` no SQL
Editor, que cria o bucket público `branding` com as permissões certas.

### Limitação do modo Teste
Como o app não foi publicado em produção no Google Cloud (isso exigiria uma página inicial e uma
política de privacidade reais hospedadas — podemos fazer isso depois que o site estiver na Vercel),
cada vendedor conectado precisa **reautorizar a cada 7 dias** (o Google expira o acesso
automaticamente). É rápido: só repetir os passos acima.

### Para adicionar mais vendedores de teste
No Google Cloud Console → **Google Auth Platform** → **Público-alvo** → seção "Usuários de teste" →
adicionar o email do Google de cada vendedor (até 100 permitidos no modo Teste).

## Dados de acesso (vendedores)

Para cada vendedor, crie um usuário em **Supabase > Authentication > Users > Add user** com email e senha.
Um perfil em `vendedores` é criado automaticamente.

## Backup

Pelo menos uma vez por mês, exporte os clientes em CSV pela tela de Clientes (quando essa função
estiver pronta) e guarde o arquivo em um lugar seguro (Google Drive, por exemplo).

## Avisos sobre planos gratuitos

- **Supabase (gratuito)**: o projeto é pausado automaticamente após **7 dias sem nenhum acesso**.
  Qualquer acesso ao painel ou ao app já reativa. Se isso acontecer, acesse supabase.com e clique em
  "Restore project".
- **Vercel (gratuito)**: sem custo para este tipo de site.
- **Gmail API**: limite de ~500 emails/dia por conta pessoal — bem acima do necessário para 3 vendedores.
- **Google Cloud**: criar o projeto, ativar a API do Calendar e gerar credenciais OAuth é gratuito,
  não exige cartão de crédito. Lembre dos vendedores reconectarem a cada 7 dias (modo Teste, ver
  seção "Google Agenda" acima).
