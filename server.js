const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

function loadLocalEnv() {
  try {
    const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');

    for (const line of envFile.split(/\r?\n/)) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;

      const separatorIndex = trimmedLine.indexOf('=');
      if (separatorIndex < 1) continue;

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine.slice(separatorIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT) || 3000;
const rootDir = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp'
};

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];

    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8');
      if (!raw) return resolve({});

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error('Invalid JSON payload.'));
      }
    });
    req.on('error', reject);
  });
}

async function sendTelegramMessage(payload) {
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    const error = new Error('Telegram credentials are not configured.');
    error.code = 'CONFIG_ERROR';
    throw error;
  }

  const message = [
    '<b>📝 Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${String(payload.name || '').trim()}`,
    `<b>Контакт:</b> ${String(payload.contact || '').trim()}`,
    `<b>Тип проекта:</b> ${String(payload.projectType || '').trim()}`,
    `<b>Бюджет:</b> ${String(payload.budget || 'Не указан').trim()}`,
    '',
    '<b>Описание задачи:</b>',
    String(payload.description || '').trim()
  ].join('\n');

  const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramChatId,
      text: message,
      parse_mode: 'HTML'
    })
  });

  const result = await response.json();

  if (!response.ok || !result.ok) {
    const error = new Error(result.description || 'Telegram message could not be sent.');
    error.code = 'TELEGRAM_ERROR';
    throw error;
  }
}

async function handleContactRequest(req, res) {
  try {
    const payload = await readRequestBody(req);
    const { name, contact, projectType, description } = payload || {};

    if (!name || !contact || !projectType || !description) {
      return sendJson(res, 400, {
        success: false,
        message: 'Заполните все обязательные поля: имя, контакт, тип проекта и описание задачи.'
      });
    }

    await sendTelegramMessage(payload);

    return sendJson(res, 200, {
      success: true,
      message: 'Заявка успешно отправлена. Я свяжусь с вами в ближайшее время.'
    });
  } catch (error) {
    const message = error.code === 'CONFIG_ERROR'
      ? 'Сервер не настроен для отправки заявок. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в переменные окружения.'
      : 'Не удалось отправить заявку. Проверьте настройки Telegram или напишите напрямую: max5289457@gmail.com.';

    return sendJson(res, 500, {
      success: false,
      message
    });
  }
}

async function serveFile(filePath, res) {
  const decodedPath = decodeURIComponent(filePath);
  const safePath = path.normalize(decodedPath).replace(/^\.+/, '');
  const fullPath = path.join(rootDir, safePath);

  try {
    const data = await fs.promises.readFile(fullPath);
    const extension = path.extname(fullPath).toLowerCase();
    const mimeType = mimeTypes[extension] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end('<h1>404</h1>');
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      return handleContactRequest(req, res);
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return sendJson(res, 200, { ok: true });
    }

    const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
    return serveFile(pathname.replace(/^\//, ''), res);
  } catch (error) {
    return sendJson(res, 500, { success: false, message: 'Server error.' });
  }
});

server.listen(PORT, () => {
  console.log(`Portfolio server running at http://localhost:${PORT}`);
});
