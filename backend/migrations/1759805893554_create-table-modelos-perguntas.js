exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('modelos_perguntas', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    texto_pergunta: { type: 'text', notNull: true },
    modelo_questionario_id: {
      type: 'uuid',
      notNull: true,
      references: 'modelos_questionarios(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('modelos_perguntas');
};