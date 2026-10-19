-- Adiciona o volume (em kg) de cada pedido, para a tela de Vendas calcular
-- quanto em dinheiro e quanto em volume os clientes compraram por período.

alter table pedidos add column quantidade_kg numeric;
