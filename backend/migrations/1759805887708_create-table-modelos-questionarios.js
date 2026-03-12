exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('modelos_questionarios', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nome: { type: 'varchar(255)', notNull: true, unique: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('modelos_questionarios');
};