-- CRM Moinho Cafés — schema inicial (Fase 1)
-- Convenção: nomes de tabela e coluna em português, snake_case.

create extension if not exists pgcrypto;

-- =========================================================
-- VENDEDORES (perfil ligado ao login do Supabase Auth)
-- =========================================================
create table vendedores (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  criado_em timestamptz not null default now()
);

-- Cria automaticamente um registro em "vendedores" quando um usuário se cadastra no Auth
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.vendedores (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', new.email));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================
-- ETAPAS DO FUNIL (editáveis pelo usuário)
-- =========================================================
create table etapas_funil (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  ordem int not null,
  cor text not null default '#6b4a33',
  criado_em timestamptz not null default now()
);

insert into etapas_funil (nome, ordem) values
  ('Novo contato', 1),
  ('Primeiro contato feito', 2),
  ('Amostra enviada', 3),
  ('Degustação/feedback', 4),
  ('Proposta enviada', 5),
  ('Negociação', 6),
  ('Cliente fechado', 7),
  ('Perdido', 8);

-- =========================================================
-- TAGS
-- =========================================================
create table tags (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique
);

-- =========================================================
-- CLIENTES (potenciais clientes)
-- =========================================================
create table clientes (
  id uuid primary key default gen_random_uuid(),

  nome_contato text not null,
  nome_estabelecimento text not null,
  tipo_estabelecimento text not null check (
    tipo_estabelecimento in ('cafeteria', 'restaurante', 'padaria', 'emporio', 'escritorio', 'revendedor', 'outro')
  ),

  -- Pode ter mais de um tipo de interesse (ex: catering + produtos físicos)
  tipos_interesse text[] not null default '{}',
  -- valores possíveis em tipos_interesse: 'catering', 'avaliacao_sensorial', 'torra', 'cursos', 'produtos_fisicos'

  telefone text,
  email text,
  instagram text,
  cidade text,
  bairro text,
  endereco text,

  origem text check (
    origem in ('indicacao', 'instagram', 'visita', 'feira', 'site', 'outro')
  ),

  etapa_id uuid not null references etapas_funil (id),
  responsavel_id uuid references vendedores (id),

  motivo_perda text,
  observacoes text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index clientes_etapa_id_idx on clientes (etapa_id);
create index clientes_responsavel_id_idx on clientes (responsavel_id);

-- Atualiza "atualizado_em" automaticamente a cada UPDATE
create function public.set_atualizado_em()
returns trigger
language plpgsql
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger clientes_set_atualizado_em
  before update on clientes
  for each row execute procedure public.set_atualizado_em();

-- =========================================================
-- CLIENTES x TAGS
-- =========================================================
create table clientes_tags (
  cliente_id uuid not null references clientes (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (cliente_id, tag_id)
);

-- =========================================================
-- DADOS DE SERVIÇO (quando o interesse é em serviços)
-- =========================================================
create table clientes_servico (
  cliente_id uuid primary key references clientes (id) on delete cascade,
  volume_torra_kg numeric,
  numero_avaliacoes_sensoriais int,
  tipo_curso text,
  numero_convidados int
);

-- =========================================================
-- DADOS DE PRODUTO (quando o interesse é em produto físico)
-- =========================================================
create table clientes_produto (
  cliente_id uuid primary key references clientes (id) on delete cascade,
  volume_estimado_kg_mes numeric,
  produtos_interesse text[] not null default '{}',
  -- valores possíveis: 'grao', 'moido', 'drip', 'outros'
  valor_potencial_mensal numeric
);

-- =========================================================
-- AMOSTRAS
-- =========================================================
create table amostras (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  data_envio date,
  feedback text,
  criado_em timestamptz not null default now()
);

create index amostras_cliente_id_idx on amostras (cliente_id);

-- =========================================================
-- HISTÓRICO DE INTERAÇÕES
-- =========================================================
create table interacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  tipo text not null check (tipo in ('ligacao', 'whatsapp', 'email', 'visita', 'nota')),
  descricao text not null,
  registrado_por uuid references vendedores (id),
  data timestamptz not null default now()
);

create index interacoes_cliente_id_idx on interacoes (cliente_id);

-- =========================================================
-- PRÓXIMOS PASSOS / RETORNOS (alimenta a tela "Hoje")
-- =========================================================
create table proximos_passos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  descricao text not null,
  data_retorno date not null,
  concluido boolean not null default false,
  criado_em timestamptz not null default now()
);

create index proximos_passos_cliente_id_idx on proximos_passos (cliente_id);
create index proximos_passos_data_retorno_idx on proximos_passos (data_retorno) where not concluido;

-- =========================================================
-- MODELOS DE EMAIL
-- =========================================================
create table modelos_email (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  assunto text not null,
  corpo text not null,
  criado_em timestamptz not null default now()
);

-- =========================================================
-- ENVIOS DE EMAIL (log, registrado no histórico do cliente)
-- =========================================================
create table envios_email (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  modelo_id uuid references modelos_email (id),
  assunto text not null,
  corpo text not null,
  enviado_por uuid references vendedores (id),
  enviado_em timestamptz not null default now()
);

create index envios_email_cliente_id_idx on envios_email (cliente_id);

-- =========================================================
-- TOKENS DO GOOGLE (Calendar + Gmail) — um por vendedor
-- =========================================================
create table google_tokens (
  vendedor_id uuid primary key references vendedores (id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  expira_em timestamptz not null,
  escopo text not null,
  atualizado_em timestamptz not null default now()
);

-- =========================================================
-- EVENTOS CRIADOS NA AGENDA DO GOOGLE
-- =========================================================
create table eventos_agenda (
  id uuid primary key default gen_random_uuid(),
  proximo_passo_id uuid not null references proximos_passos (id) on delete cascade,
  google_event_id text not null,
  criado_em timestamptz not null default now()
);

create index eventos_agenda_proximo_passo_id_idx on eventos_agenda (proximo_passo_id);

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
-- Equipe pequena e colaborativa: qualquer usuário autenticado (vendedor) pode ler e
-- escrever nos dados comerciais. O acesso anônimo nunca é permitido.
-- A exceção é "google_tokens": cada vendedor só acessa o seu próprio token.

alter table vendedores enable row level security;
alter table etapas_funil enable row level security;
alter table tags enable row level security;
alter table clientes enable row level security;
alter table clientes_tags enable row level security;
alter table clientes_servico enable row level security;
alter table clientes_produto enable row level security;
alter table amostras enable row level security;
alter table interacoes enable row level security;
alter table proximos_passos enable row level security;
alter table modelos_email enable row level security;
alter table envios_email enable row level security;
alter table google_tokens enable row level security;
alter table eventos_agenda enable row level security;

-- vendedores: todos autenticados podem ver a lista (para escolher "responsável");
-- cada um só atualiza o próprio registro.
create policy "vendedores_select" on vendedores for select to authenticated using (true);
create policy "vendedores_update_own" on vendedores for update to authenticated using (id = auth.uid());

-- Tabelas comerciais: acesso total para qualquer usuário autenticado.
create policy "etapas_funil_all" on etapas_funil for all to authenticated using (true) with check (true);
create policy "tags_all" on tags for all to authenticated using (true) with check (true);
create policy "clientes_all" on clientes for all to authenticated using (true) with check (true);
create policy "clientes_tags_all" on clientes_tags for all to authenticated using (true) with check (true);
create policy "clientes_servico_all" on clientes_servico for all to authenticated using (true) with check (true);
create policy "clientes_produto_all" on clientes_produto for all to authenticated using (true) with check (true);
create policy "amostras_all" on amostras for all to authenticated using (true) with check (true);
create policy "interacoes_all" on interacoes for all to authenticated using (true) with check (true);
create policy "proximos_passos_all" on proximos_passos for all to authenticated using (true) with check (true);
create policy "modelos_email_all" on modelos_email for all to authenticated using (true) with check (true);
create policy "envios_email_all" on envios_email for all to authenticated using (true) with check (true);
create policy "eventos_agenda_all" on eventos_agenda for all to authenticated using (true) with check (true);

-- google_tokens: cada vendedor só acessa o seu próprio token.
create policy "google_tokens_own" on google_tokens for all to authenticated
  using (vendedor_id = auth.uid())
  with check (vendedor_id = auth.uid());
