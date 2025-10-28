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


    // Coluna alimento_novo_id (agora permite NULL)
    alimento_novo_id: {
      type: 'uuid',
      // notNull: false, // Permite NULL (default já é true, mas explícito aqui)
      references: 'alimentos(id)',
      onDelete: 'SET NULL', // Mantém SET NULL caso o alimento seja deletado
    },

    // Coluna status (sem alterações)
    status: {
      type: 'varchar(50)',
      notNull: true,
      // Default alterado para 'base_segura' ou 'sugerido' dependendo da lógica do service
      // Mantendo 'sugerido' como default aqui simplifica, mas o service pode sobrescrever.
      default: 'sugerido', // Valores: 'sugerido', 'aceito', 'recusado', 'base_segura', 'vazio'
    },

    perfil_sensorial_id: {
        type: 'uuid',
        // allowNull: true, // Permite NULL (caso seja 'base_segura' ou 'vazio')
        references: 'perfis_sensoriais(id)',
        onDelete: 'SET NULL', // Define como NULL se o perfil for deletado
    },

    motivo_sugestao: {
        type: 'text', // Permite textos mais longos para o motivo
        // allowNull: true, // Permite NULL
    },
  });
};

exports.down = (pgm) => {
  // Simplesmente desfaz a criação da tabela
  pgm.dropTable('detalhes_troca');
};