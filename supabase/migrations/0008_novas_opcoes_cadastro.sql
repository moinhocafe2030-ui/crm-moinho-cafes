-- Novas opções no cadastro de cliente: tipo de estabelecimento (Cafeicultor/Cooperativa,
-- Pessoa física) e origem do contato (BNI, IA).

alter table clientes drop constraint if exists clientes_tipo_estabelecimento_check;
alter table clientes add constraint clientes_tipo_estabelecimento_check check (
  tipo_estabelecimento in (
    'cafeteria', 'restaurante', 'padaria', 'emporio', 'escritorio', 'revendedor',
    'cafeicultor_cooperativa', 'pessoa_fisica', 'outro'
  )
);

alter table clientes drop constraint if exists clientes_origem_check;
alter table clientes add constraint clientes_origem_check check (
  origem in ('indicacao', 'instagram', 'visita', 'feira', 'site', 'bni', 'ia', 'outro')
);
