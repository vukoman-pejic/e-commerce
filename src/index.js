import express from 'express';
import pool from './db.js';
import userRoutes from './routes/users.js';

const app = express();
app.use(express.json());

// Routes
app.use('/users', userRoutes);

const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Server is running!', dbTime: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
