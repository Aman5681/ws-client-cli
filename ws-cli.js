
import WebSocket from 'ws';
import readline from 'readline';
import fs from 'fs'
import path from 'path';

const WS_URL = 'ws://localhost:8080';

let ws;

let base64Chunks = [];
const DOWNLOAD_DIR = './downloads';
let fileInfo = null;

// Setup readline interface for CLI input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'WS> ',
});

// Ensure download dir exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

// Connect to WebSocket
function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    rl.prompt();
  });

  ws.on('message', (data) => {
    const message = data.toString();
    try {
      const json = JSON.parse(message);
      switch (json.type) {
        case 'FILE_INFO':
          fileInfo = json;
          base64Chunks = [];
          console.log(`📦 Receiving file: ${json.fileName} (${json.size} bytes)`);
          break;

        case 'FILE_CHUNK':
          base64Chunks.push(json.data);
          break;

        case 'FILE_END': {
          const fullBase64 = base64Chunks.join('');
          const buffer = Buffer.from(fullBase64, 'base64');

          const outputPath = path.join(DOWNLOAD_DIR, fileInfo.fileName);
          fs.writeFileSync(outputPath, buffer);

          console.log(`✅ File saved: ${outputPath}`);
          fileInfo = null;
          base64Chunks = [];
          break;
        }

        case 'ERROR':
          console.error('❌ Server error:', json.message);
          break;

        default:
          console.log('📩 Received JSON:', json);
      }
    } catch (err) {
      console.log(err);
      console.log('📩 Received:', message);
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
