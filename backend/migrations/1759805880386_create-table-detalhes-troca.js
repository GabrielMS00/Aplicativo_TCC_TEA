exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('detalhes_troca', {
    // Coluna ID (sem alterações)
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },

    // Coluna troca_alimentar_id (sem alterações)
    troca_alimentar_id: {
      type: 'uuid',
      notNull: true,
      references: 'trocas_alimentares(id)',
      onDelete: 'CASCADE',
    },


    // Coluna alimento_novo_id
    alimento_novo_id: {
      type: 'uuid',
      references: 'alimentos(id)',
      onDelete: 'SET NULL',
    },

    // Coluna status
    status: {
      type: 'varchar(50)',
      notNull: true,
      default: 'sugerido',
    },

    perfil_sensorial_id: {
        type: 'uuid',
        references: 'perfis_sensoriais(id)',
        onDelete: 'SET NULL', // Define como NULL se o perfil for deletado
    },

    motivo_sugestao: {
        type: 'text',
    },
  });
};

exports.down = (pgm) => {
  // Desfaz a criação da tabela
  pgm.dropTable('detalhes_troca');
};