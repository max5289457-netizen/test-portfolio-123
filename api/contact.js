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

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;

  if (!telegramToken || !telegramChatId) {
    return res.status(500).json({
      success: false,
      message: 'Сервер не настроен для отправки заявок. Добавьте TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID в переменные окружения.'
    });
  }

  const message = [
    '<b>📝 Новая заявка с сайта</b>',
    '',
    `<b>Имя:</b> ${String(name).trim()}`,
    `<b>Контакт:</b> ${String(contact).trim()}`,
    `<b>Тип проекта:</b> ${String(projectType).trim()}`,
    `<b>Бюджет:</b> ${String(budget || 'Не указан').trim()}`,
    '',
    '<b>Описание задачи:</b>',
    String(description).trim()
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

    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.description || 'Не удалось отправить сообщение в Telegram.');
    }

    return res.status(200).json({
      success: true,
      message: 'Заявка успешно отправлена. Я свяжусь с вами в ближайшее время.'
    });
  } catch (error) {
    console.error('Telegram send error:', error);
    return res.status(500).json({
      success: false,
      message: 'Не удалось отправить заявку. Проверьте настройки Telegram или напишите напрямую: max5289457@gmail.com.'
    });
  }
}
