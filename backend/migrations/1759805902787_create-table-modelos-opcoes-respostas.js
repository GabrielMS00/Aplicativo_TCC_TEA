exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('modelos_opcoes_respostas', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    texto_opcao: { type: 'varchar(255)', notNull: true },
    modelo_pergunta_id: {
      type: 'uuid',
      notNull: true,
      references: 'modelos_perguntas(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('modelos_opcoes_respostas');
};