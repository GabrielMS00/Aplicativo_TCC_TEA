exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.createTable('alimentos_seguros', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    data_adicao: { type: 'timestamp with time zone', notNull: true, default: pgm.func('now()') },
    assistido_id: {
      type: 'uuid',
      notNull: true,
      references: 'assistidos(id)',
      onDelete: 'CASCADE',
    },
    alimento_id: {
      type: 'uuid',
      notNull: true,
      references: 'alimentos(id)',
      onDelete: 'CASCADE',
    },
  });
  pgm.addConstraint('alimentos_seguros', 'assistido_alimento_unique', {
    unique: ['assistido_id', 'alimento_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropTable('alimentos_seguros');
};