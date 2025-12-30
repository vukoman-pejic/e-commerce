import { Worker } from 'bullmq';
import pool from '../db.js';
import { connection } from '../redis.js';

const worker = new Worker('team-bonus-queue', async job => {
  const { bonusId } = job.data;

  await pool.query(
    `UPDATE bonus_payout
     SET status = 'paid'
     WHERE id = $1`,
    [bonusId]
  );

  console.log(`Team bonus #${bonusId} paid`);
}, { connection });

export default worker;
