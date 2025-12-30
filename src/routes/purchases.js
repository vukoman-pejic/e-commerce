import express from 'express';
import pool from '../db.js';

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

    const purchaseResult = await pool.query(
      `INSERT INTO purchase (user_id, product_id, price_at_purchase)
       VALUES ($1, $2, $3) RETURNING *`,
      [user_id, product_id, product.price]
    );
    const purchase = purchaseResult.rows[0];

    const userResult = await pool.query(
      'SELECT invited_by_user_id FROM app_user WHERE id = $1',
      [user_id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const inviter_id = userResult.rows[0].invited_by_user_id;

    if (inviter_id) {
      await pool.query(
        `INSERT INTO bonus_payout (user_id, purchase_id, type, amount, status, pay_at)
         VALUES ($1, $2, 'direct', $3, 'paid', NOW())`,
        [inviter_id, purchase.id, product.price * 0.10]
      );
    }

    let currentParentId = inviter_id;
    while (currentParentId) {
      const parentResult = await pool.query(
        'SELECT invited_by_user_id FROM app_user WHERE id = $1',
        [currentParentId]
      );

      await pool.query(
        `INSERT INTO bonus_payout (user_id, purchase_id, type, amount, status, pay_at)
         VALUES ($1, $2, 'team', $3, 'pending', NOW() + interval '1 hour')`,
        [currentParentId, purchase.id, product.price * 0.05]
      );

      currentParentId = parentResult.rows[0].invited_by_user_id;
    }

    res.status(201).json({ purchase, message: 'Purchase created and bonuses scheduled' });
  } catch (err) {
    console.error('Error creating purchase:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
