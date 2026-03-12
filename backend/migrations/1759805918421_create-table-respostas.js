exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('respostas', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    questionario_respondido_id: {
      type: 'uuid',
      notNull: true,
      references: 'questionarios_respondidos(id)',
      onDelete: 'CASCADE',
    },
    modelo_pergunta_id: {
      type: 'uuid',
      notNull: true,
      references: 'modelos_perguntas(id)',
      onDelete: 'CASCADE',
    },
    modelo_opcao_resposta_id: {
      type: 'uuid',
      notNull: true,
      references: 'modelos_opcoes_respostas(id)',
      onDelete: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('respostas');
};