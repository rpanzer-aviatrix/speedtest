// Load environment variables from .env file if it exists
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a fresh HTTPS agent for each speed test to avoid connection reuse
// This ensures accurate speed test measurements by including connection establishment time
function createFreshHttpsAgent() {
  return new https.Agent({
    rejectUnauthorized: false,
    keepAlive: false,        // Disable connection reuse
    maxSockets: 1,           // Limit to single connection
    maxFreeSockets: 0,       // Don't keep free sockets
    timeout: 60000,          // 60 seconds
    scheduling: 'fifo'       // First in, first out
  });
}

// No longer need to store connections - each request streams directly

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

// Function to send progress updates via SSE
function sendProgress(res, data) {
  console.log('Sending progress update:', data);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

// Single GET endpoint that runs speed test and streams results
app.get('/api/speedtest', async (req, res) => {
  const { fileSize } = req.query;
  
  if (!fileSize || !TEST_FILES[fileSize]) {
    return res.status(400).json({ error: 'Invalid file size. Use: small, medium, or large' });
  }

  const testFile = TEST_FILES[fileSize];
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Handle client disconnect
  req.on('close', () => {
    console.log('Client disconnected');
  });
  
  try {
    // Send test started event
    sendProgress(res, {
      type: 'started',
      fileSize: testFile.size,
      url: testFile.url,
      note: 'Using fresh connection (no connection pooling) for accurate speed measurement'
    });

    const startTime = Date.now();
    let downloadedBytes = 0;
    let totalBytes = 0;

    // Create axios request with progress tracking
    // Use a fresh HTTPS agent to avoid connection reuse for accurate speed testing
    const response = await axios({
      method: 'GET',
      url: testFile.url,
      responseType: 'stream',
      httpsAgent: createFreshHttpsAgent(),
      timeout: 300000,  // 5 minutes
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

        sendProgress(res, {
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

      sendProgress(res, {
        type: 'completed',
        totalTime: totalTime.toFixed(1),
        averageSpeed: averageSpeed.toFixed(2),
        totalBytes,
        fileSize: testFile.size,
        // Include progress data to ensure 100% completion
        percentage: 100,
        downloadedBytes: totalBytes,
        speed: averageSpeed.toFixed(2),
        elapsedTime: totalTime.toFixed(1)
      });
      
      // End the SSE stream
      res.end();
    });

    response.data.on('error', (error) => {
      console.log('Stream error:', error);
      sendProgress(res, {
        type: 'error',
        error: error.message
      });
      
      // End the SSE stream on error
      res.end();
    });

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
    
    sendProgress(res, {
      type: 'error',
      error: errorMessage
    });
    
    // End the SSE stream on error
    res.end();
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
