exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('perfis_sensoriais', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    forma_de_preparo: { type: 'varchar(100)', notNull: true, default: 'Natural' },
    textura: { type: 'varchar(100)' },
    sabor: { type: 'varchar(100)' },
    cor_predominante: { type: 'varchar(100)' },
    temperatura_servico: { type: 'varchar(100)' },
    alimento_id: {
      type: 'uuid',
      notNull: true,
      references: 'alimentos(id)',
      onDelete: 'CASCADE',
    },
  });

  pgm.addConstraint('perfis_sensoriais', 'alimento_preparo_unique', {
    unique: ['alimento_id', 'forma_de_preparo']
  });
};

exports.down = (pgm) => {
  // O 'down' desfaz tudo na ordem inversa
  pgm.dropTable('perfis_sensoriais');
};