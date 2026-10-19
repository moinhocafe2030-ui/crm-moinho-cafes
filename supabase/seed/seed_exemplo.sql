-- DADOS DE EXEMPLO — não é obrigatório rodar este arquivo.
-- Todos os registros começam com "[EXEMPLO]" para serem fáceis de encontrar e apagar.
-- Para remover depois, rode o bloco no final deste arquivo.

insert into clientes (
  nome_contato, nome_estabelecimento, tipo_estabelecimento, tipos_interesse,
  telefone, email, instagram, cidade, bairro, origem, etapa_id
)
select
  '[EXEMPLO] Maria Silva', '[EXEMPLO] Café da Maria', 'cafeteria', array['produtos_fisicos'],
  '(11) 99999-0001', 'contato@exemplo.com', '@cafedamaria', 'São Paulo', 'Pinheiros', 'indicacao',
  (select id from etapas_funil where nome = 'Novo contato')
union all
select
  '[EXEMPLO] João Pereira', '[EXEMPLO] Empório Bom Grão', 'emporio', array['produtos_fisicos', 'cursos'],
  '(11) 99999-0002', 'joao@exemplo.com', '@emporiobomgrao', 'São Paulo', 'Vila Mariana', 'instagram',
  (select id from etapas_funil where nome = 'Amostra enviada')
union all
select
  '[EXEMPLO] Ana Souza', '[EXEMPLO] Restaurante Sabor', 'restaurante', array['catering'],
  '(11) 99999-0003', 'ana@exemplo.com', '@restaurantesabor', 'Campinas', 'Centro', 'feira',
  (select id from etapas_funil where nome = 'Negociação');

insert into proximos_passos (cliente_id, descricao, data_retorno)
select id, 'Ligar para apresentar catálogo', current_date
from clientes where nome_contato = '[EXEMPLO] Maria Silva';

insert into proximos_passos (cliente_id, descricao, data_retorno)
select id, 'Follow-up da amostra enviada', current_date - 1
from clientes where nome_contato = '[EXEMPLO] João Pereira';

-- Para apagar todos os dados de exemplo, rode:
-- delete from clientes where nome_contato like '[EXEMPLO]%';
