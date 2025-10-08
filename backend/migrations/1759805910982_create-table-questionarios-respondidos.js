exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('questionarios_respondidos', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    data_resposta: { type: 'timestamp with time zone', notNull: true, default: pgm.func('now()') },
    assistido_id: {
      type: 'uuid',
      notNull: true,
      references: 'assistidos(id)',
      onDelete: 'CASCADE',
    },
    cuidador_id: {
      type: 'uuid',
      notNull: true,
      references: 'cuidadores(id)',
      onDelete: 'CASCADE',
    },
    modelo_questionario_id: {
      type: 'uuid',
      notNull: true,
      references: 'modelos_questionarios(id)',
      onDelete: 'RESTRICT',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('questionarios_respondidos');
};