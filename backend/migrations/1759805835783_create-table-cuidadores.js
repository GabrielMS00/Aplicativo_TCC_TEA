exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });
  pgm.createTable('cuidadores', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    tipo_usuario: {type: 'varchar(50)', notNull: true, default: 'cuidador'},
    nome: { type: 'varchar(255)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    senha_hash: { type: 'varchar(255)', notNull: true },
    cpf: { type: 'varchar(14)', notNull: true, unique: true },
    data_nascimento: { type: 'date', notNull: true },
    palavra_seguranca: { type: 'varchar(255)', notNull: true },
    data_cadastro: { type: 'timestamp with time zone', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('cuidadores');
};