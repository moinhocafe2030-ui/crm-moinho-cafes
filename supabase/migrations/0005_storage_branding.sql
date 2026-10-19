-- Cria um espaço de armazenamento público ("bucket") para a logo da empresa, que pode
-- ser trocada a qualquer momento pela tela de Configurações, sem precisar mexer no código.

insert into storage.buckets (id, name, public)
values ('branding', 'branding', true)
on conflict (id) do nothing;

-- Qualquer pessoa pode ver a logo (ela aparece na tela de login, antes de logar).
create policy "branding_select_public" on storage.objects
  for select using (bucket_id = 'branding');

-- Só usuários autenticados (vendedores) podem enviar ou trocar a logo.
create policy "branding_insert_auth" on storage.objects
  for insert to authenticated with check (bucket_id = 'branding');

create policy "branding_update_auth" on storage.objects
  for update to authenticated using (bucket_id = 'branding');
