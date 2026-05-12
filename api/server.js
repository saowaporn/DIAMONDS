const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const diamondRoutes = require('./src/routes/diamondRoutes');
const healthRoutes = require('./src/routes/healthRoutes');

dotenv.config();

const app = express();
const rawPort = Number(process.env.PORT);
const port = Number.isInteger(rawPort) && rawPort > 0 && rawPort < 65536 ? rawPort : 3001;

app.use(express.json());
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || true
}));

app.use('/api/products', diamondRoutes);
app.use('/api', healthRoutes);

app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});

module.exports = app;
