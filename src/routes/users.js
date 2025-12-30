import express from 'express';
import pool from '../db.js';

const router = express.Router();

router.post('/', async (req, res) => {
  const { first_name, last_name, invited_by_user_id } = req.body;

  if (!first_name || !last_name) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO app_user (first_name, last_name, invited_by_user_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [first_name, last_name, invited_by_user_id || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
