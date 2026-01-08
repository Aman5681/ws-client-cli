
import WebSocket from 'ws';
import readline from 'readline';
import fs from 'fs'
import path from 'path';

const WS_URL = 'ws://localhost:8080';

let ws;

let chunks = [];
const DOWNLOAD_DIR = './downloads';
let fileInfo = null;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'WS> ',
});

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

function connect() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    console.log('✅ Connected to WebSocket server');
    rl.prompt();
  });

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    switch (msg.type) {
      case 'FILE_INFO':
        fileInfo = msg;
        chunks = [];
        console.log(`Receiving ${msg.fileName}`);
        break;

      case 'FILE_CHUNK':
        chunks.push(msg.data);
        break;

      case 'FILE_END': {
        const content = chunks.join('');
        const outputPath = path.join(DOWNLOAD_DIR, fileInfo.fileName);

        fs.writeFileSync(outputPath, content, 'utf8');

        fileInfo = null;
        chunks = [];
        break;
      }
    }
    rl.prompt();
  });



  ws.on('close', () => {
    console.log('Disconnected from WebSocket. Reconnecting in 5s...');
    setTimeout(connect, 5000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
}

function sendMessage(msg) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    let messageToSend;
    if (typeof msg === 'object') {
      messageToSend = JSON.stringify(msg);
    } else {
      messageToSend = msg;
    }
    ws.send(messageToSend);
    console.log('Sent:', messageToSend);
  } else {
    console.log('WebSocket not connected yet.');
  }
}

rl.on('line', (line) => {
  const input = line.trim();
  if (!input) return rl.prompt();

  try {
    const obj = JSON.parse(input);
    sendMessage(obj);
  } catch {
    try {
      const obj = eval('(' + input + ')');
      sendMessage(obj);
    } catch {
      sendMessage(input);
    }
  }

  rl.prompt();
});

connect();
