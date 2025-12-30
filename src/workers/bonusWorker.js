import { Worker } from 'bullmq';
import { bonusQueue, connection } from '../redis.js';
import pool from '../db.js';

new Worker(
  'team-bonus-queue',
  async (job) => {
    const { bonusId } = job.data;

    const bonusResult = await pool.query(
      'SELECT * FROM bonus_payout WHERE id = $1 AND status = $2',
      [bonusId, 'pending']
    );
    const bonus = bonusResult.rows[0];
    if (!bonus) return;

    await pool.query(
      'UPDATE bonus_payout SET status = $1 WHERE id = $2',
      ['paid', bonusId]
    );

    await pool.query(
      'UPDATE app_user SET account_balance = account_balance + $1 WHERE id = $2',
      [bonus.amount, bonus.user_id]
    );

    console.log(`Team bonus paid: ${bonus.amount} to user ${bonus.user_id}`);
  },
  { connection }
);
