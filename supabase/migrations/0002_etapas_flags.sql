-- Marca quais etapas do funil representam "ganho" (cliente fechado) e "perda",
-- para a tela de Kanban saber quando pedir o motivo da perda e, mais tarde,
-- para o Painel calcular a taxa de conversão.

alter table etapas_funil
  add column encerra_ganho boolean not null default false,
  add column encerra_perda boolean not null default false;

update etapas_funil set encerra_ganho = true where nome = 'Cliente fechado';
update etapas_funil set encerra_perda = true where nome = 'Perdido';
