exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('refeicoes', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nome: { type: 'varchar(100)', notNull: true, unique: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('refeicoes');
};