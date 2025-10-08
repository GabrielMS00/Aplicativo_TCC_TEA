exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('assistidos', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nome: { type: 'varchar(255)', notNull: true },
    data_nascimento: { type: 'date', notNull: true },
    nivel_suporte: { type: 'varchar(100)' },
    grau_seletividade: { type: 'varchar(100)' },
    cuidador_id: {
      type: 'uuid',
      notNull: true,
      references: 'cuidadores(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('assistidos');
};