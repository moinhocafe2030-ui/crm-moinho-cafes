-- Agenda o lembrete diário (09:00, horário de Brasília) que dispara a Edge Function
-- "lembrete-diario", enviando por email os retornos do dia de cada vendedor.
--
-- ANTES DE RODAR ESTE ARQUIVO:
-- 1. Ative as extensões "pg_cron" e "pg_net" em Database > Extensions no Supabase.
-- 2. Rode o bloco abaixo (substituindo pela sua service role key, que fica em
--    Project Settings > API Keys > "service_role" — NUNCA compartilhe essa chave, ela dá
--    acesso total ao banco). Rode só essa parte primeiro, separadamente:
--
--    select vault.create_secret('COLE_AQUI_SUA_SERVICE_ROLE_KEY', 'service_role_key');
--
-- Depois de rodar o passo 2, rode o resto deste arquivo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'lembrete-diario-retornos',
  '0 12 * * *', -- 12:00 UTC = 09:00 em São Paulo (sem horário de verão desde 2019)
  $$
  select net.http_post(
    url := 'https://narrzqrfuaqdivdybulc.supabase.co/functions/v1/lembrete-diario',
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
-- select cron.unschedule('lembrete-diario-retornos');
