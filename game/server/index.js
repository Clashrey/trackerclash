import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
