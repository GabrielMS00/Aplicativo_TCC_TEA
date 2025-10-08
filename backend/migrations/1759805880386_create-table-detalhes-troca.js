exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('detalhes_troca', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    troca_alimentar_id: {
      type: 'uuid',
      notNull: true,
      references: 'trocas_alimentares(id)',
      onDelete: 'CASCADE',
    },
    alimento_trocado_id: {
      type: 'uuid',
      notNull: true,
      references: 'alimentos(id)',
      onDelete: 'SET NULL',
    },
    alimento_novo_id: {
      type: 'uuid',
      notNull: true,
      references: 'alimentos(id)',
      onDelete: 'SET NULL',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('detalhes_troca');
};