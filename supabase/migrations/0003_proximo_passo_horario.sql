-- Permite escolher um horário específico para o próximo passo (além da data).
-- Quando preenchido, o evento criado na Google Agenda passa a ter hora marcada
-- em vez de ser um evento de "dia inteiro".

alter table proximos_passos
  add column horario_retorno time;
