
import WebSocket from 'ws';
import readline from 'readline';

// Replace <YOUR_TOKEN_HERE> with your actual token
const WS_URL = 'ws://localhost:3063/api/gateway-service/push-events?authorization=eyJraWQiOiJLVjFFb3ZGZldpaFByMm54NkxtbU9JNUNNNzc2bDV4MmdtUEpOZ0xnczBJPSIsImFsZyI6IlJTMjU2In0.eyJhdF9oYXNoIjoiLU9FbjNBbW8weHBOX29hX3BlZWtaQSIsInN1YiI6IjUxMzNhZDlhLWMwYjEtNzAxNC1jYmVlLTM4YjI1YzAwMzE2MCIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAuYXAtc291dGgtMS5hbWF6b25hd3MuY29tXC9hcC1zb3V0aC0xX2dwNWtLMlFHbiIsImNvZ25pdG86dXNlcm5hbWUiOiI1MTMzYWQ5YS1jMGIxLTcwMTQtY2JlZS0zOGIyNWMwMDMxNjAiLCJjdXN0b206dXNlcklkIjoiMDA1MWUwMDAwMDRDZU4xQUFLIiwib3JpZ2luX2p0aSI6IjI1MTE1MTlhLWFkYWYtNGYyZC1iZTIxLThhZjJjZGNhN2VjZCIsImF1ZCI6IjRxcWJkcWxwaGRrbmx2MmVsbjZ1cXNxbmhvIiwiZXZlbnRfaWQiOiI4NTdmZjAwYy03ZGM1LTQxODQtODMxMy04MmJiZmZiNTVmNjgiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTc2MTE5NDc4MywibmFtZSI6IlFBIEFkbWluICAwMSIsImN1c3RvbTpvcmdJZCI6IjAwRDFlMDAwMDAwOHF2Z0VBQSIsImV4cCI6MTc2MTE5ODM4MywiY3VzdG9tOnJvbGUiOiJVbml2ZXJzaXR5IEFkbWluIiwiaWF0IjoxNzYxMTk0NzgzLCJqdGkiOiI4MDExNDZhMS1hYzMxLTQyNGUtYWMyYy1hYzJjYTFiMGNjNjMiLCJlbWFpbCI6InFhYWRtaW4wMUB5b3BtYWlsLmNvbSJ9.WCJ9D49iAkQf4UPwBt98VSeKx1Ltmh4pyXMzV6bHwwEZ9g2tvAl7tHKUjBlWadWoDy0mBM4z2I8RPrJfoPa4OsR-jnzmlOrQTmpJPOL2B5oYiO05FOcSTZgOzGJXayt7gf8aznyC9KDq7b9Am3f4R8t0pQLEuNw2GHRGH9HS3ndh8xGfUPf3X7q7GnpBE67RfzS7Uvmn_Ft97Eb_rwF9JVuMLdiikHvLmLDzTaFzT7ZbGsa3r21_yVKA4SYW_YhtaZYzoY24-umwGXaZkFsguqXoo4G4YmikSZDT8au-lXcidtmKli6dF7Ej0uHEpm6M6UsrUZ2Gz254pTcsS41A9w';

let ws;

// Setup readline interface for CLI input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'WS> ',
});

// Connect to WebSocket
function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    rl.prompt();
  });

  ws.on('message', (data) => {
    try {
      // Try to parse and pretty-print JSON messages
      const json = JSON.parse(data.toString());
      console.log('📩 Received:\n', JSON.stringify(json, null, 2));
    } catch {
      console.log('📩 Received:', data.toString());
    }
    rl.prompt();
  });

  ws.on('close', () => {
    console.log('❌ Disconnected from WebSocket. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('⚠️ WebSocket error:', err.message);
  });
}

// Function to send a message (string or JS object)
function sendMessage(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    let messageToSend;
    if (typeof msg === 'object') {
      messageToSend = JSON.stringify(msg);
    } else {
      messageToSend = msg;
    }
    ws.send(messageToSend);
    console.log('📤 Sent:', messageToSend);
  } else {
    console.log('⚠️ WebSocket not connected yet.');
  }
}

// Read input from CLI and send as JSON if possible
rl.on('line', (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();

  try {
    // Try parsing as JSON first
    const obj = JSON.parse(input);
    sendMessage(obj);
  } catch {
    try {
      // If invalid JSON, try eval to allow JS object syntax
      const obj = eval('(' + input + ')');
      sendMessage(obj);
    } catch {
      // Fallback: send as raw string
      sendMessage(input);
    }
  }

  rl.prompt();
});

// Start connection
connect();
