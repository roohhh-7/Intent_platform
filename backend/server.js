require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { startMonitoringEngine } = require('./src/monitoring/engine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start Background Jobs
startMonitoringEngine();

app.listen(PORT, () => {
  console.log(`[Server] Intent AI Backend running on port ${PORT}`);
});
