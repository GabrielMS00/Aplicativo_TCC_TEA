exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('alimentos', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nome: { type: 'varchar(255)', notNull: true, unique: true },
    grupo_alimentar: { type: 'varchar(100)', notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('alimentos');
};