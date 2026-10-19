-- Melhorias inspiradas em CRMs de mercado:
-- pedidos (histórico de compras / recompra), preços negociados, anexos na ficha
-- e probabilidade por etapa (para previsão de receita ponderada).

-- =========================================================
-- PEDIDOS (histórico de compras — alimenta alerta de recompra)
-- =========================================================
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  data_pedido date not null,
  produto text,
  valor numeric,
  observacao text,
  criado_em timestamptz not null default now()
);

create index pedidos_cliente_id_idx on pedidos (cliente_id);

alter table pedidos enable row level security;
create policy "pedidos_all" on pedidos for all to authenticated using (true) with check (true);

-- =========================================================
-- PREÇOS NEGOCIADOS POR CLIENTE
-- =========================================================
create table precos_negociados (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  produto text not null,
  preco numeric not null,
  observacao text,
  atualizado_em timestamptz not null default now()
);

create index precos_negociados_cliente_id_idx on precos_negociados (cliente_id);

alter table precos_negociados enable row level security;
create policy "precos_negociados_all" on precos_negociados for all to authenticated using (true) with check (true);

-- =========================================================
-- ANEXOS NA FICHA DO CLIENTE (metadados; arquivo fica no Storage)
-- =========================================================
create table anexos_cliente (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  nome_arquivo text not null,
  caminho text not null,
  tipo text,
  tamanho int,
  enviado_por uuid references vendedores (id),
  criado_em timestamptz not null default now()
);

create index anexos_cliente_cliente_id_idx on anexos_cliente (cliente_id);

alter table anexos_cliente enable row level security;
create policy "anexos_cliente_all" on anexos_cliente for all to authenticated using (true) with check (true);

-- Bucket privado (só vendedores autenticados acessam, nunca público)
insert into storage.buckets (id, name, public)
values ('anexos-clientes', 'anexos-clientes', false)
on conflict (id) do nothing;

create policy "anexos_clientes_select_auth" on storage.objects
  for select to authenticated using (bucket_id = 'anexos-clientes');

create policy "anexos_clientes_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'anexos-clientes');

create policy "anexos_clientes_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'anexos-clientes');

-- =========================================================
-- PROBABILIDADE POR ETAPA (previsão de receita ponderada no Painel)
-- =========================================================
alter table etapas_funil add column probabilidade int not null default 50 check (probabilidade between 0 and 100);

update etapas_funil set probabilidade = 100 where encerra_ganho;
update etapas_funil set probabilidade = 0 where encerra_perda;
