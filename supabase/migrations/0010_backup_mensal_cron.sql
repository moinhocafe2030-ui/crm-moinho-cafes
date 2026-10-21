-- Agenda o backup mensal (dia 15 de cada mês, 08:00 horário de Brasília) que dispara a
-- Edge Function "backup-mensal", enviando por email um CSV de clientes, fornecedores e
-- lotes de café.
--
-- Pré-requisito: já ter rodado a migração 0004 (que ativa pg_cron/pg_net e guarda a
-- service role key no Vault como 'service_role_key'). Se já rodou o lembrete diário, não
-- precisa repetir esse passo — é a mesma chave guardada, reaproveitada aqui.

select cron.schedule(
  'backup-mensal-clientes-fornecedores',
  '0 11 15 * *', -- 11:00 UTC = 08:00 em São Paulo (sem horário de verão desde 2019)
  $$
  select net.http_post(
    url := 'https://narrzqrfuaqdivdybulc.supabase.co/functions/v1/backup-mensal',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- Para conferir se o agendamento foi criado:
-- select * from cron.job;

-- Para apagar o agendamento, se precisar:
-- select cron.unschedule('backup-mensal-clientes-fornecedores');
