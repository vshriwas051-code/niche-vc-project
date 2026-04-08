const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { evaluateSyscall } = require('./policy_engine');

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log('Dashboard connected:', socket.id);
});

// Mock telemetry stream endpoint
app.post('/api/telemetry', (req, res) => {
  const event = req.body;
  
  // Evaluate the event through the policy engine
  const decision = evaluateSyscall(event.tier, event.syscall, event.args);
  
  const finalEvent = {
    ...event,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    decision: decision
  };

  io.emit('telemetry_event', finalEvent);
  res.status(200).send(finalEvent);
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`ARG Backend running on port ${PORT}`);
});
