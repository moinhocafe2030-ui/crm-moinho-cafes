-- Portfólio de fornecedores de café verde: cada fornecedor (produtor/cooperativa) pode ter
-- vários lotes de café ao longo do tempo (mesmo padrão já usado em clientes: ficha + sub-listas).

-- =========================================================
-- FORNECEDORES (produtor / cooperativa)
-- =========================================================
create table fornecedores (
  id uuid primary key default gen_random_uuid(),

  nome_produtor text not null,
  nome_fazenda text,
  regiao text,
  endereco_completo text,
  email text,
  telefone text,
  observacoes text,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create trigger fornecedores_set_atualizado_em
  before update on fornecedores
  for each row execute procedure public.set_atualizado_em();

-- =========================================================
-- LOTES DE CAFÉ (cada oferta/safra de um fornecedor)
-- =========================================================
create table lotes_cafe (
  id uuid primary key default gen_random_uuid(),
  fornecedor_id uuid not null references fornecedores (id) on delete cascade,

  nome_lote text,
  variedade text check (
    variedade in (
      'mundo_novo', 'catuai', 'bourbon', 'icatu', 'acaia', 'topazio',
      'caturra', 'geisha', 'catucai', 'outro'
    )
  ),
  processamento text check (
    processamento in (
      'natural', 'cereja_descascado', 'lavado', 'despolpado',
      'fermentacao_natural', 'honey', 'outro'
    )
  ),
  safra text,
  altitude_min numeric,
  altitude_max numeric,
  certificacao text,
  nota_sca numeric check (nota_sca is null or (nota_sca between 0 and 100)),
  volume_disponivel_kg numeric,
  preco_por_saca numeric,
  observacoes text,

  criado_em timestamptz not null default now()
);

create index lotes_cafe_fornecedor_id_idx on lotes_cafe (fornecedor_id);

-- =========================================================
-- ANEXOS DO LOTE (laudos SCA em PDF/HTML, fotos etc.)
-- =========================================================
create table lotes_cafe_anexos (
  id uuid primary key default gen_random_uuid(),
  lote_id uuid not null references lotes_cafe (id) on delete cascade,
  nome_arquivo text not null,
  caminho text not null,
  tipo text,
  tamanho int,
  enviado_por uuid references vendedores (id),
  criado_em timestamptz not null default now()
);

create index lotes_cafe_anexos_lote_id_idx on lotes_cafe_anexos (lote_id);

-- Bucket privado para os anexos de fornecedores/lotes
insert into storage.buckets (id, name, public)
values ('anexos-fornecedores', 'anexos-fornecedores', false)
on conflict (id) do nothing;

create policy "anexos_fornecedores_select_auth" on storage.objects
  for select to authenticated using (bucket_id = 'anexos-fornecedores');

create policy "anexos_fornecedores_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'anexos-fornecedores');

create policy "anexos_fornecedores_delete_auth" on storage.objects
  for delete to authenticated using (bucket_id = 'anexos-fornecedores');

-- =========================================================
-- ROW LEVEL SECURITY — mesmo padrão do resto do sistema: qualquer
-- vendedor autenticado pode ler e escrever.
-- =========================================================
alter table fornecedores enable row level security;
alter table lotes_cafe enable row level security;
alter table lotes_cafe_anexos enable row level security;

create policy "fornecedores_all" on fornecedores for all to authenticated using (true) with check (true);
create policy "lotes_cafe_all" on lotes_cafe for all to authenticated using (true) with check (true);
create policy "lotes_cafe_anexos_all" on lotes_cafe_anexos for all to authenticated using (true) with check (true);
