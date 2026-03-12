exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('trocas_alimentares', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    refeicao: { type: 'varchar(100)', notNull: true },
    data_sugestao: { type: 'timestamp with time zone', notNull: true, default: pgm.func('now()') },
    assistido_id: {
      type: 'uuid',
      notNull: true,
      references: 'assistidos(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('trocas_alimentares');
};