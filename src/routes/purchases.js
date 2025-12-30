import express from 'express';
import pool from '../db.js';
import { bonusQueue } from '../redis.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { user_id, product_id } = req.body;

  if (!user_id || !product_id) {
    return res.status(400).json({ error: 'user_id and product_id are required' });
  }

  try {
    const productResult = await pool.query(
      'SELECT * FROM product WHERE id = $1',
      [product_id]
    );
    if (productResult.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    const product = productResult.rows[0];

    const userResult = await pool.query(
      'SELECT account_balance, invited_by_user_id FROM app_user WHERE id = $1',
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    if (Number(user.account_balance) < Number(product.price)) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }

    await pool.query(
      'UPDATE app_user SET account_balance = account_balance - $1 WHERE id = $2',
      [product.price, user_id]
    );

    const purchaseResult = await pool.query(
      `INSERT INTO purchase (user_id, product_id, price_at_purchase)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, product_id, product.price]
    );
    const purchase = purchaseResult.rows[0];

    const inviter_id = user.invited_by_user_id;
    if (inviter_id) {
      await pool.query(
        `INSERT INTO bonus_payout (user_id, purchase_id, type, amount, status, pay_at)
         VALUES ($1, $2, 'direct', $3, 'paid', NOW()) RETURNING *`,
        [inviter_id, purchase.id, product.price * 0.10]
      );

      await pool.query(
        'UPDATE app_user SET account_balance = account_balance + $1 WHERE id = $2',
        [product.price * 0.10, inviter_id]
      );
    }

    const uplines = [];
    let currentParentId = inviter_id;
    while (currentParentId) {
        uplines.push(currentParentId);
        const parentResult = await pool.query(
            'SELECT invited_by_user_id FROM app_user WHERE id = $1',
            [currentParentId]
        );
        currentParentId = parentResult.rows[0]?.invited_by_user_id || null;
    }

    const teamBonusPercent = 0.05;
    const maxTeamBonus = product.price * 0.9;
    let remainingBonus = maxTeamBonus;

    for (let parentId of uplines) {
        const bonusAmount = Math.min(product.price * teamBonusPercent, remainingBonus);
        if (bonusAmount <= 0) break;

        const bonusResult = await pool.query(
            `INSERT INTO bonus_payout (user_id, purchase_id, type, amount, status, pay_at)
            VALUES ($1, $2, 'team', $3, 'pending', NOW() + interval '1 hour')
            RETURNING id`,
            [parentId, purchase.id, bonusAmount]
        );
        const bonusId = bonusResult.rows[0].id;

        await bonusQueue.add('pay-team-bonus', { bonusId }, { delay: 60 * 1000 });

        remainingBonus -= bonusAmount;
    }

    res.status(201).json({ purchase, message: 'Purchase created and bonuses scheduled' });

  } catch (err) {
    console.error('Error creating purchase:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
