
import WebSocket from 'ws';
import readline from 'readline';

// Replace <YOUR_TOKEN_HERE> with your actual token
const WS_URL = '';

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
