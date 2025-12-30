export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumn('app_user', {
    account_balance: { type: 'numeric(10,2)', notNull: true, default: 1000 },
  });
};

export const down = (pgm) => {
  pgm.dropColumn('app_user', 'account_balance');
};
