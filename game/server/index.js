/* eslint-env node */
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

// Simple in-memory store for demonstration purposes
const users = new Map();

const app = express();
// eslint-disable-next-line no-undef
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  if (users.has(username)) {
    return res.status(409).json({ error: 'user already exists' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  users.set(username, { passwordHash });
  res.json({ message: 'registered' });
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const user = users.get(username);
  if (!user) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) {
    return res.status(401).json({ error: 'invalid credentials' });
  }
  res.json({ message: 'logged in' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
