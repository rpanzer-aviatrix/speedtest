// Load environment variables from .env file if it exists
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// HTTPS agent to ignore TLS certificate validation and handle timeouts
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  timeout: 60000 // 60 seconds
});

// Store active connections for SSE
const connections = new Map();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Test file URLs with different sizes - configurable via environment variables
const TEST_FILES = {
  small: {
    url: process.env.SMALL_FILE_URL || 'https://ipv4.download.thinkbroadband.com/10MB.zip', 
    size: '10MB',
    description: 'Small file (10MB)'
  },
  medium: {
    url: process.env.MEDIUM_FILE_URL || 'https://ipv4.download.thinkbroadband.com/100MB.zip', 
    size: '100MB',
    description: 'Medium file (100MB)'
  },
  large: {
    url: process.env.LARGE_FILE_URL || 'https://ipv4.download.thinkbroadband.com/1GB.zip',
    size: '1GB', 
    description: 'Large file (1GB)'
  }
};

// SSE endpoint for progress updates
app.get('/api/progress/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Store connection
  connections.set(sessionId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', sessionId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    connections.delete(sessionId);
  });
});

// Function to send progress updates via SSE
function sendProgress(sessionId, data) {
  const connection = connections.get(sessionId);
  if (connection) {
    console.log('Sending progress update:', data);
    connection.write(`data: ${JSON.stringify(data)}\n\n`);
  } else {
    console.log('No connection found for sessionId:', sessionId);
  }
}

// Speed test endpoint
app.post('/api/speedtest', async (req, res) => {
  const { fileSize, sessionId } = req.body;
  
  if (!fileSize || !TEST_FILES[fileSize]) {
    return res.status(400).json({ error: 'Invalid file size' });
  }

  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const testFile = TEST_FILES[fileSize];
  
  try {
    // Send test started event
    sendProgress(sessionId, {
      type: 'started',
      fileSize: testFile.size,
      url: testFile.url
    });

    const startTime = Date.now();
    let downloadedBytes = 0;
    let totalBytes = 0;

    // Create axios request with progress tracking
    const response = await axios({
      method: 'GET',
      url: testFile.url,
      responseType: 'stream',
      httpsAgent: httpsAgent,
      maxRedirects: 15,
      onDownloadProgress: (progressEvent) => {
        console.log('Download progress:', progressEvent);
        downloadedBytes = progressEvent.loaded;
        totalBytes = progressEvent.total || progressEvent.loaded;
        
        const percentage = Math.round((downloadedBytes / totalBytes) * 100);
        const currentTime = Date.now();
        const elapsedTime = (currentTime - startTime) / 1000; // seconds
        const speed = downloadedBytes / elapsedTime; // bytes per second
        const speedMbps = (speed * 8) / (1024 * 1024); // Convert to Mbps

        sendProgress(sessionId, {
          type: 'progress',
          percentage,
          downloadedBytes,
          totalBytes,
          speed: speedMbps.toFixed(2),
          elapsedTime: elapsedTime.toFixed(1)
        });
      }
    });

    console.log('Response:', response);

    // Consume the stream but don't store the data
    response.data.on('data', () => {
      console.log('Data received');
      // Data is processed in onDownloadProgress callback
    });

    response.data.on('end', () => {
      console.log('Stream ended');
      const endTime = Date.now();
      const totalTime = (endTime - startTime) / 1000;
      const averageSpeed = (totalBytes / totalTime * 8) / (1024 * 1024); // Mbps

      sendProgress(sessionId, {
        type: 'completed',
        totalTime: totalTime.toFixed(1),
        averageSpeed: averageSpeed.toFixed(2),
        totalBytes,
        fileSize: testFile.size
      });
    });

    response.data.on('error', (error) => {
      console.log('Stream error:', error);
      sendProgress(sessionId, {
        type: 'error',
        error: error.message
      });
    });

    res.json({ message: 'Speed test started', sessionId });

  } catch (error) {
    console.error('Speed test error:', error);
    
    let errorMessage = error.message;
    if (error.code === 'ECONNRESET') {
      errorMessage = 'Connection was reset by the server. Please try again.';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'Request timed out. Please try again with a smaller file.';
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = 'Server not found. Please check your internet connection.';
    }
    
    sendProgress(sessionId, {
      type: 'error',
      error: errorMessage
    });
    res.status(500).json({ error: 'Failed to start speed test' });
  }
});

// Get available test files
app.get('/api/test-files', (req, res) => {
  res.json(TEST_FILES);
});

// Start server
app.listen(PORT, () => {
  console.log(`Speed test server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to access the application`);
  console.log('\nConfigured test file URLs:');
  console.log(`  Small (10MB):  ${TEST_FILES.small.url}`);
  console.log(`  Medium (100MB): ${TEST_FILES.medium.url}`);
  console.log(`  Large (1GB):   ${TEST_FILES.large.url}`);
  console.log('\nTo customize URLs, set environment variables:');
  console.log('  SMALL_FILE_URL, MEDIUM_FILE_URL, LARGE_FILE_URL\n');
});
