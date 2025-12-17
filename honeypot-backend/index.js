const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const WebSocket = require('ws');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const threatRoutes = require('./routes/threats');
const scanRoutes = require('./routes/scan');
const urlAnalysisRoutes = require('./routes/urlAnalysis'); // Keep this name

// Import middleware (ONLY ONCE!)
const { auth } = require('./middleware/auth');

// Import scanner
const scanner = require('./scanner');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/honeypot';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected to "honeypot" database');
    
    // List available collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
};

// WebSocket server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('🔌 New WebSocket connection');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message:', data);
      
      // Handle different message types
      switch(data.type) {
        case 'subscribe':
          ws.subscribedChannels = ws.subscribedChannels || [];
          if (!ws.subscribedChannels.includes(data.channel)) {
            ws.subscribedChannels.push(data.channel);
          }
          break;
        case 'unsubscribe':
          if (ws.subscribedChannels) {
            ws.subscribedChannels = ws.subscribedChannels.filter(ch => ch !== data.channel);
          }
          break;
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          break;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
  });
});

// Broadcast function for WebSocket
const broadcast = (channel, data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && 
        client.subscribedChannels && 
        client.subscribedChannels.includes(channel)) {
      client.send(JSON.stringify({
        type: channel,
        payload: data,
        timestamp: new Date().toISOString()
      }));
    }
  });
};

// Make broadcast available globally
global.broadcast = broadcast;

// Routes - FIXED VERSION
app.use('/api/auth', authRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/threats', threatRoutes);
app.use('/api/url', urlAnalysisRoutes); // FIXED: Changed from urlRoutes to urlAnalysisRoutes

// Remove this line - it's mounting middleware without router
// app.use('/api/auth', authMiddleware); // ← REMOVE THIS LINE

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime()
  });
});

// Stats endpoint for frontend dashboard
app.get('/api/stats', auth, async (req, res) => {
  try {
    const Threat = require('./models/Threat');
    const User = require('./models/user');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalThreats,
      highRisk,
      mediumRisk,
      lowRisk,
      todayThreats,
      totalUsers,
      activeScanners
    ] = await Promise.all([
      Threat.countDocuments(),
      Threat.countDocuments({ severity: 'high' }),
      Threat.countDocuments({ severity: 'medium' }),
      Threat.countDocuments({ severity: 'low' }),
      Threat.countDocuments({ timestamp: { $gte: today } }),
      User.countDocuments(),
      scanner.getActiveScannerCount()
    ]);

    res.json({
      totalThreats,
      highRisk,
      mediumRisk,
      lowRisk,
      todayThreats,
      totalUsers,
      activeScanners: activeScanners || 3,
      systemStatus: 'online',
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Recent threats endpoint
app.get('/api/threats/recent', auth, async (req, res) => {
  try {
    const Threat = require('./models/Threat');
    const limit = parseInt(req.query.limit) || 10;
    
    const threats = await Threat.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();
    
    res.json(threats);
  } catch (error) {
    console.error('Error fetching recent threats:', error);
    res.status(500).json({ message: 'Failed to fetch recent threats' });
  }
});

// Start scanner on server start
let scannerInterval;
const startScanner = async () => {
  try {
    console.log('🚀 Starting threat scanner...');
    
    // Initial scan
    await scanner.runScan();
    
    // Schedule periodic scans (every 5 minutes)
    scannerInterval = setInterval(async () => {
      try {
        await scanner.runScan();
      } catch (error) {
        console.error('Scheduled scan error:', error);
      }
    }, 5 * 60 * 1000);
    
    console.log('✅ Scanner started successfully');
  } catch (error) {
    console.error('❌ Failed to start scanner:', error);
  }
};

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Server error:', err.stack);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// For Vercel deployment - export the app
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Start server for local development
  const startServer = async () => {
    await connectDB();
    
    server.listen(PORT, () => {
      console.log(`🚀 Backend running on port ${PORT}`);
      console.log(`🌐 WebSocket server running on ws://localhost:${PORT}`);
      console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
      
      // Start scanner
      startScanner();
    });
  };

  startServer().catch(console.error);
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  
  if (scannerInterval) {
    clearInterval(scannerInterval);
  }
  
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});