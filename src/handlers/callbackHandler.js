const { getUser } = require('../users');
const { hall, pickupOptions } = require('../hall');
const { getActionKeyboard, getAllTicketsKeyboard, getCancelKeyboard, getLimitKeyboard, getPickupKeyboard, getRestoreKeyboard, getSeatsKeyboard } = require('../keyboards');
const { sendHallScheme } = require('../messages');
const {
    BOOKED,
    FREE,
    cancelSeat,
    getUserState,
    reserveSeat,
    setPickupOption,
    upsertUser
} = require('../db');

function sortSeatStringsByRow(seats) {
    return seats.slice().sort((a, b) => {
        const rowA = parseInt(a.match(/Ряд (\d+)/)?.[1] || 0, 10);
        const rowB = parseInt(b.match(/Ряд (\d+)/)?.[1] || 0, 10);
        return rowA - rowB;
    });
}

function applyStateToUser(user, state) {
    user.name = state.name || user.name || '';
    user.pickupOption = state.pickupOption || null;
    user.selectedSeats = state.selectedSeats || [];
}

function buildUserTicketsText(user) {
    if (!user.selectedSeats.length) {
        return 'У тебя пока нет активных билетов.';
    }

    const sortedSeats = sortSeatStringsByRow(user.selectedSeats);
    const seatsList = sortedSeats.map((seat) => seat.replace(/Секция \d+, /, '')).join('\n');
    const pickup = user.pickupOption ? `\n\nМесто получения:\n${user.pickupOption}` : '';
    return `Твои текущие билеты:\n\n${seatsList}${pickup}`;
}

function isMessageNotModifiedError(error) {
    const description = error?.response?.body?.description || '';
    return error?.code === 'ETELEGRAM' && String(description).toLowerCase().includes('message is not modified');
}

function isQueryTooOldError(error) {
    const description = error?.response?.body?.description || '';
    return error?.code === 'ETELEGRAM' && String(description).toLowerCase().includes('query is too old');
}

async function safeAnswerCallbackQuery(bot, queryId) {
    try {
        await bot.answerCallbackQuery(queryId);
    } catch (error) {
        if (!isQueryTooOldError(error)) throw error;
    }
}

async function safeEditReplyMarkup(bot, chatId, messageId, replyMarkup) {
    try {
        await bot.editMessageReplyMarkup(replyMarkup, { chat_id: chatId, message_id: messageId });
    } catch (error) {
        if (!isMessageNotModifiedError(error)) throw error;
    }
}

async function safeEditText(bot, chatId, messageId, text, options = {}) {
    try {
        await bot.editMessageText(text, { chat_id: chatId, message_id: messageId, ...options });
    } catch (error) {
        if (!isMessageNotModifiedError(error)) throw error;
    }
}

async function handleCallback(query, bot) {
    const chatId = query.message.chat.id;
    const tgUserId = query.from?.id ?? null;
    const username = query.from?.username ?? null;
    const messageId = query.message.message_id;
    const data = query.data;
    const user = getUser(chatId);

    await safeAnswerCallbackQuery(bot, query.id);
    await upsertUser(chatId, tgUserId, null, username);
    applyStateToUser(user, await getUserState(chatId));

    if (/^\d+$/.test(data)) {
        const sectionId = data;
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendMessage(chatId, `Ты выбрал(а) секцию ${sectionId}, номера рядов указаны слева\n\n❌ - занято\n✅ - свободно\n◼️ - недоступно\n\nВыбери места:`, { reply_markup: getSeatsKeyboard(sectionId, user) });
        return;
    }

    if (/^\d+-\d+-\d+$/.test(data)) {
        if (user.selectedSeats.length >= 10) {
            await bot.sendMessage(chatId, '🚫 Нельзя забронировать больше 10 мест! Сначала нажми "Завершить бронирование" или сдай часть билетов.');
            return;
        }

        const [sectionId, rowNum, seatNum] = data.split('-').map(Number);
        const seat = hall[sectionId].rows[rowNum].find((s) => s.number === seatNum);

        if (seat.status === '◼️') return await bot.sendMessage(chatId, 'Место недоступно 🚫');
        if (seat.status === '❌') return await bot.sendMessage(chatId, 'Место занято 😔');

        const reserveResult = await reserveSeat({
            chatId,
            tgUserId,
            username,
            fullName: user.name,
            sectionId,
            rowNum,
            seatNum
        });

        if (!reserveResult.ok) {
            await bot.sendMessage(chatId, 'Место уже занято 😔');
            return;
        }

        seat.status = BOOKED;
        applyStateToUser(user, await getUserState(chatId));

        await safeEditReplyMarkup(bot, chatId, messageId, getSeatsKeyboard(sectionId, user));
        await bot.sendMessage(chatId, `Ты выбрал(а) ряд ${rowNum}, место ${seatNum} ✅\n\n⚠️ ВНИМАНИЕ!!! ⚠️\nНажми кнопку "Завершить бронирование", чтобы сохранить места!`);
        return;
    }

    if (data === 'finish_booking') {
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        applyStateToUser(user, await getUserState(chatId));

        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'Ты не выбрал(а) ни одного места. 😅');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        } else {
            await bot.sendMessage(chatId, 'Выбери место получения билетов:', { reply_markup: getPickupKeyboard(pickupOptions) });
        }
        return;
    }

    if (/^pickup_\d+$/.test(data)) {
        const index = Number(data.split('_')[1]);
        const option = pickupOptions[index];
        await setPickupOption(chatId, option);
        applyStateToUser(user, await getUserState(chatId));

        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/62xf09fa4a9.webp');
        await bot.sendMessage(chatId, `Заберешь билеты здесь:\n${option}`);
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getAllTicketsKeyboard() });
        return;
    }

    if (data === 'all_tickets') {
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        applyStateToUser(user, await getUserState(chatId));

        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'У тебя пока нет билетов. 😅');
        } else {
            const sortedSeats = sortSeatStringsByRow(user.selectedSeats);
            const seatsList = sortedSeats.map((seatText) => seatText.replace(/Секция \d+, /, '')).join('\n');
            const pickup = user.pickupOption ? `\n\nМесто получения: \n${user.pickupOption}` : '';
            await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/25xf09f9898.webp');
            await bot.sendMessage(chatId, `Все твои билеты:\n\n${seatsList}${pickup}`);
        }
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getAllTicketsKeyboard() });
        return;
    }

    if (data === 'restore_booking') {
        user.restoreMode = true;
        applyStateToUser(user, await getUserState(chatId));
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendMessage(chatId, buildUserTicketsText(user));
        await bot.sendMessage(
            chatId,
            'Восстановление старой брони.\nОтправь строку в формате:\n`Иванов Иван - ряд 5, место 12`',
            { parse_mode: 'Markdown', reply_markup: getRestoreKeyboard() }
        );
        return;
    }

    if (data === 'restore_back') {
        user.restoreMode = false;
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        return;
    }

    if (data === 'cancel_tickets') {
        applyStateToUser(user, await getUserState(chatId));
        if (!user.selectedSeats.length) {
            await bot.sendMessage(chatId, 'Нет билетов для отмены 😅');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
            return;
        }

        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/31xf09f98a2.webp');

        user.selectedSeats = sortSeatStringsByRow(user.selectedSeats);
        await bot.sendMessage(chatId, 'Выбери места, которые хочешь освободить:', {
            reply_markup: getCancelKeyboard(user)
        });
        return;
    }

    if (/^cancel_\d+$/.test(data)) {
        const index = Number(data.split('_')[1]);
        applyStateToUser(user, await getUserState(chatId));

        const seatText = user.selectedSeats[index];
        const match = seatText?.match(/Секция (\d+), Ряд (\d+), Место (\d+)/);

        if (match) {
            const sectionId = Number(match[1]);
            const rowNum = Number(match[2]);
            const seatNum = Number(match[3]);

            await cancelSeat(chatId, sectionId, rowNum, seatNum);

            const seat = hall[sectionId]?.rows[rowNum]?.find((s) => s.number === seatNum);
            if (seat && seat.status !== '◼️') {
                seat.status = FREE;
            }
        }

        applyStateToUser(user, await getUserState(chatId));

        if (user.selectedSeats.length) {
            user.selectedSeats = sortSeatStringsByRow(user.selectedSeats);
            await safeEditReplyMarkup(bot, chatId, messageId, getCancelKeyboard(user));
        } else {
            await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
            await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/75xf09f988e.webp');
            await bot.sendMessage(chatId, 'Все билеты удалены.');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        }
        return;
    }

    if (data === 'back_to_actions') {
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        return;
    }

    if (data === 'book_more') {
        applyStateToUser(user, await getUserState(chatId));
        if (user.selectedSeats.length >= 10) {
            await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
            await bot.sendMessage(chatId, '⚠️ У тебя уже выбрано 10 мест. Невозможно выбрать больше билетов.', {
                reply_markup: getLimitKeyboard()
            });
            return;
        }

        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/40xf09f988d.webp');
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await sendHallScheme(bot, chatId, getUser(chatId));
        return;
    }

    if (data === 'noop') return;

    if (data === 'back_to_sections') {
        await safeEditReplyMarkup(bot, chatId, messageId, { inline_keyboard: [] });
        await sendHallScheme(bot, chatId, getUser(chatId));
        return;
    }

    if (data === 'back_to_menu') {
        await safeEditText(bot, chatId, messageId, 'Что хочешь сделать дальше?', {
            reply_markup: getActionKeyboard()
        });
    }
}

module.exports = {
    handleCallback
};
