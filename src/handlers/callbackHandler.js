// src/handlers/callbackHandler.js
const { getUser, users } = require('../users');
const { hall, pickupOptions } = require('../hall');
const { getActionKeyboard, getCancelKeyboard, getPickupKeyboard, getSeatsKeyboard } = require('../keyboards');
const { sendHallScheme } = require('../messages');

// сортировка массива строк мест по номеру ряда
function sortSeatStringsByRow(seats) {
    return seats.slice().sort((a, b) => {
        const rowA = parseInt(a.match(/Ряд (\d+)/)?.[1] || 0, 10);
        const rowB = parseInt(b.match(/Ряд (\d+)/)?.[1] || 0, 10);
        return rowA - rowB;
    });
}

async function handleCallback(query, bot) {
    const chatId = query.message.chat.id;
    const messageId = query.message.message_id;
    const data = query.data;
    const user = getUser(chatId);

    await bot.answerCallbackQuery(query.id);

    // Выбор секции (число)
    if (/^\d+$/.test(data)) {
        const sectionId = data;
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await bot.sendMessage(chatId, `Ты выбрал(а) секцию ${sectionId}, номера рядов указаны слева\n\n❌ - занято\n✅ - свободно\n◼️ - недоступно\n\nВыбери места:`, { reply_markup: getSeatsKeyboard(sectionId, user) });
        return;
    }

    // Выбор места
    if (/^\d+-\d+-\d+$/.test(data)) {
        // --- проверка лимита 10 билетов ---
        if (user.selectedSeats.length >= 10) {
            return await bot.sendMessage(chatId, '🚫 Нельзя забронировать больше 10 мест!');
        }
        // --- конец проверки ---

        const [sectionId, rowNum, seatNum] = data.split('-').map(Number);
        const seat = hall[sectionId].rows[rowNum].find(s => s.number === seatNum);

        if (seat.status === '◼️') return await bot.sendMessage(chatId, 'Место недоступно 🚫');
        if (seat.status === '❌') return await bot.sendMessage(chatId, 'Место занято 😔');

        seat.status = '❌';
        user.selectedSeats.push(`Секция ${sectionId}, Ряд ${rowNum}, Место ${seatNum}`);

        await bot.editMessageReplyMarkup(getSeatsKeyboard(sectionId, user), { chat_id: chatId, message_id: messageId });
        await bot.sendMessage(chatId, `Ты выбрал(а) ряд ${rowNum}, место ${seatNum} ✅\n\n⚠️ ВНИМАНИЕ!!! ⚠️\nНажми кнопку "Завершить бронирование", чтобы сохранить места!`);
        return;
    }

    // Завершение бронирования
    if (data === 'finish_booking') {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'Ты не выбрал(а) ни одного места. 😅');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        } else {
            await bot.sendMessage(chatId, 'Выбери место получения билетов:', { reply_markup: getPickupKeyboard(pickupOptions) });
        }
        return;
    }

    // Выбор получения билетов
    if (/^pickup_\d+$/.test(data)) {
        const index = Number(data.split('_')[1]);
        user.pickupOption = pickupOptions[index];
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/62xf09fa4a9.webp');
        await bot.sendMessage(chatId, `Заберешь билеты здесь:\n${user.pickupOption}`);
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        return;
    }

    // Просмотр всех билетов
    if (data === 'all_tickets') {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'У тебя пока нет билетов. 😅');
        } else {
            const sortedSeats = sortSeatStringsByRow(user.selectedSeats);
            const seatsList = sortedSeats.map(seat => seat.replace(/Секция \d+, /, '')).join('\n');
            const pickup = user.pickupOption ? `\n\nМесто получения: \n${user.pickupOption}` : '';
            await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/25xf09f9898.webp');
            await bot.sendMessage(chatId, `Все твои билеты:\n\n${seatsList}${pickup}`);
        }
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        return;
    }

    // Отмена билетов
    if (data === 'cancel_tickets') {
        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'Нет билетов для отмены 😅');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
            return;
        }

        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/31xf09f98a2.webp');

        user.selectedSeats = sortSeatStringsByRow(user.selectedSeats);

        await bot.sendMessage(chatId, 'Выбери места, которые хочешь освободить:', {
            reply_markup: getCancelKeyboard(user)
        });

        return;
    }

    // Удаление конкретного билета
    if (/^cancel_\d+$/.test(data)) {
        const index = Number(data.split('_')[1]);
        const seatText = user.selectedSeats[index];
        const match = seatText.match(/Секция (\d+), Ряд (\d+), Место (\d+)/);
        if (match) {
            const sectionId = Number(match[1]);
            const rowNum = Number(match[2]);
            const seatNum = Number(match[3]);
            const seat = hall[sectionId].rows[rowNum].find(s => s.number === seatNum);
            if (seat) seat.status = '✅';
        }
        user.selectedSeats.splice(index, 1);

        if (user.selectedSeats.length) {
            user.selectedSeats = sortSeatStringsByRow(user.selectedSeats);
            await bot.editMessageReplyMarkup(getCancelKeyboard(user), { chat_id: chatId, message_id: messageId });
        } else {
            await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
            await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/75xf09f988e.webp');
            await bot.sendMessage(chatId, 'Все билеты удалены.');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        }
        return;
    }

    if (data === 'back_to_actions') {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
    }

    if (data === 'book_more') {
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/40xf09f988d.webp');
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await sendHallScheme(bot, chatId, getUser(chatId));
    }

    if (data === 'noop') return;

    if (data === 'back_to_sections') {
        await bot.editMessageReplyMarkup({ inline_keyboard: [] }, { chat_id: chatId, message_id: messageId });
        await sendHallScheme(bot, chatId, getUser(chatId));
        return;
    }
    
    if (data === 'back_to_menu') {
        await bot.editMessageText('Что хочешь сделать дальше?', {
            chat_id: chatId,
            message_id: messageId,
            reply_markup: getActionKeyboard()
        });
        return;
    }
}

module.exports = {
    handleCallback
};
