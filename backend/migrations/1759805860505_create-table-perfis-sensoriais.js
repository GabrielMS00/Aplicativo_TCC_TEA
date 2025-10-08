exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('perfis_sensoriais', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    textura: { type: 'varchar(100)' },
    sabor: { type: 'varchar(100)' },
    cor_predominante: { type: 'varchar(100)' },
    temperatura_servico: { type: 'varchar(100)' },
    alimento_id: {
      type: 'uuid',
      notNull: true,
      references: 'alimentos(id)',
      onDelete: 'CASCADE',
      unique: true,
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('perfis_sensoriais');
};