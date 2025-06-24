/* eslint-env node */
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';

// Simple in-memory store for demonstration purposes
const users = new Map();

function createDefaultCharacter() {
  return { level: 1, hp: 20, attack: 5 };
}

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
  const character = createDefaultCharacter();
  users.set(username, { passwordHash, character });
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

app.get('/character/:username', (req, res) => {
  const { username } = req.params;
  const user = users.get(username);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  res.json({ character: user.character });
});

app.post('/battle', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'username required' });
  }
  const user = users.get(username);
  if (!user) {
    return res.status(404).json({ error: 'user not found' });
  }
  const enemy = { name: 'rat', hp: 10, attack: 2 };
  let playerHp = user.character.hp;
  let enemyHp = enemy.hp;
  const log = [];
  while (playerHp > 0 && enemyHp > 0) {
    enemyHp -= user.character.attack;
    log.push(`player hits ${enemy.name}`);
    if (enemyHp <= 0) break;
    playerHp -= enemy.attack;
    log.push(`${enemy.name} hits player`);
  }
  const victory = playerHp > 0;
  if (victory) {
    user.character.level += 1;
  }
  user.character.hp = Math.max(playerHp, 0);
  res.json({ victory, log, character: user.character });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
