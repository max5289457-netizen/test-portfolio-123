export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Метод не поддерживается.' });
  }

  const { name, contact, projectType, budget, description } = req.body || {};

  if (!name || !contact || !projectType || !description) {
    return res.status(400).json({
      success: false,
      message: 'Заполните все обязательные поля: имя, контакт, тип проекта и описание задачи.'
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>\"]/g, (character) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;'
    })[character]);
  }

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const unavailableMessage = 'Сервис заявок временно недоступен. Попробуйте позже или напишите напрямую: max5289457@gmail.com.';

  if (!telegramToken || !telegramChatId) {
    console.error('Contact service configuration is incomplete.');
    return res.status(503).json({
      success: false,
      message: unavailableMessage
    });
  }

  const message = [
    '<b>📝 Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${escapeHtml(String(name).trim())}`,
    `<b>Контакт:</b> ${escapeHtml(String(contact).trim())}`,
    `<b>Тип проекта:</b> ${escapeHtml(String(projectType).trim())}`,
    `<b>Бюджет:</b> ${escapeHtml(String(budget || 'Не указан').trim())}`,
    '',
    '<b>Описание задачи:</b>',
    escapeHtml(String(description).trim())
  ].join('\n');

  try {
    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      console.error('Telegram send failed with HTTP status %d.', response.status);
      return res.status(502).json({ success: false, message: unavailableMessage });
    }

    const result = await response.json();

    if (!result.ok) {
      const errorCode = Number.isInteger(result.error_code) ? result.error_code : 'unknown';
      console.error('Telegram rejected a contact message. Error code: %s.', errorCode);
      return res.status(502).json({ success: false, message: unavailableMessage });
    }

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена. Я свяжусь с вами в ближайшее время.'
    });
  } catch (error) {
    console.error(
      'Telegram contact delivery failed: %s.',
      error instanceof Error ? error.name : 'UnknownError'
    );
    return res.status(502).json({
      success: false,
      message: unavailableMessage
    });
  }
}
