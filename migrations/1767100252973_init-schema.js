exports.up = (pgm) => {
    pgm.createTable('app_user', { 
        id: 'id',
        first_name: { type: 'varchar(100)', notNull: true },
        last_name: { type: 'varchar(100)', notNull: true },
        invited_by_user_id: { type: 'integer', references: 'app_user', onDelete: 'SET NULL' },
        created_at: { type: 'timestamp', notNull: true, default: pgm.func('current_timestamp') }
    });

  pgm.createTable("product", {
    id: { type: "serial", primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    price: { type: "numeric(10,2)", notNull: true },
  });

  pgm.sql(`
    INSERT INTO product (name, price) VALUES
      ('Package 1', 100.00),
      ('Package 2', 500.00);
  `);

  pgm.createTable("purchase", {
    id: { type: "serial", primaryKey: true },
    user_id: { type: "integer", notNull: true, references: "app_user(id)", onDelete: "CASCADE" },
    product_id: { type: "integer", notNull: true, references: "product(id)" },
    price_at_purchase: { type: "numeric(10,2)", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });

  pgm.createTable("bonus_payout", {
    id: { type: "serial", primaryKey: true },
    user_id: { type: "integer", notNull: true, references: "app_user(id)", onDelete: "CASCADE" },
    purchase_id: { type: "integer", notNull: true, references: "purchase(id)", onDelete: "CASCADE" },
    type: { type: "varchar(20)", notNull: true, check: "type IN ('direct', 'team')" },
    amount: { type: "numeric(10,2)", notNull: true },
    status: { type: "varchar(20)", notNull: true, default: "pending", check: "status IN ('pending','paid')" },
    pay_at: { type: "timestamp", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
  });
};

exports.down = (pgm) => {
  pgm.dropTable("bonus_payout");
  pgm.dropTable("purchase");
  pgm.dropTable("product");
  pgm.dropTable("user");
};
