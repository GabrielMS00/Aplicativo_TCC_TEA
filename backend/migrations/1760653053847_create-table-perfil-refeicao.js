exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('perfil_refeicao', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    perfil_sensorial_id: {
      type: 'uuid',
      notNull: true,
      references: 'perfis_sensoriais(id)',
      onDelete: 'CASCADE',
    },
    refeicao_id: {
      type: 'uuid',
      notNull: true,
      references: 'refeicoes(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('perfil_refeicao', 'perfil_refeicao_unique', {
    unique: ['perfil_sensorial_id', 'refeicao_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('perfil_refeicao');
};