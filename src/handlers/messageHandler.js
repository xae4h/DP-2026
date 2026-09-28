const fs = require('fs');
const path = require('path');
const { getUser } = require('../users');
const { sendHallScheme } = require('../messages');
const { getActionKeyboard, getLimitKeyboard, getRestoreKeyboard } = require('../keyboards');
const {
    claimLegacyReservations,
    getBookingRowsForExport,
    getUserState,
    setUserName,
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

function parseRestoreLine(text) {
    const match = String(text || '').trim().match(/^(.+?)\s*-\s*ряд\s*(\d+)\s*,\s*место\s*(\d+)$/i);
    if (!match) return null;
    return {
        fullName: match[1].trim(),
        rowNum: Number(match[2]),
        seatNum: Number(match[3])
    };
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

function escapeCsvCell(value) {
    const raw = String(value ?? '');
    if (/[\";\n\r]/.test(raw)) {
        return `"${raw.replace(/\"/g, '\"\"')}"`;
    }
    return raw;
}

function buildBookingCsv(rows) {
    const headers = ['ID', 'Ссылка', 'ФИО', 'ряд, место', 'Место выдачи'];
    const lines = [headers.map(escapeCsvCell).join(';')];

    for (const row of rows) {
        const cells = [row.id, row.profileLink, row.fullName, row.ticket, row.pickup];
        lines.push(cells.map(escapeCsvCell).join(';'));
    }

    // BOM for correct Cyrillic in Excel
    return `\uFEFF${lines.join('\n')}`;
}

async function handleMessage(msg, bot) {
    const chatId = msg.chat.id;
    const tgUserId = msg.from?.id ?? null;
    const username = msg.from?.username ?? null;
    const user = getUser(chatId);
    const text = msg.text;

    await upsertUser(chatId, tgUserId, null, username);
    applyStateToUser(user, await getUserState(chatId));

    if (text === '/start') {
        user.restoreMode = false;
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/0xf09f918b.webp');
        await bot.sendMessage(chatId, `Здесь ты можешь забронировать места или отменить бронь на концерт *"День Первокурсника"* Института Физики КФУ.\n\n📌Большой зал, КСК УНИКС\n🕓 14.10.2026 17:00`, { parse_mode: 'Markdown' });
        await bot.sendMessage(chatId, 'Чтобы продолжить, введи, пожалуйста, свои *Фамилию Имя*', { parse_mode: 'Markdown' });
        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/3xf09f98a0.webp');
        return;
    }

    if (text === '/restore') {
        user.restoreMode = true;
        applyStateToUser(user, await getUserState(chatId));
        await bot.sendMessage(chatId, buildUserTicketsText(user));
        await bot.sendMessage(
            chatId,
            'Восстановление старой брони.\nОтправь строку в формате:\n`Иванов Иван - ряд 5, место 12`',
            { parse_mode: 'Markdown', reply_markup: getRestoreKeyboard() }
        );
        return;
    }

    if (user.restoreMode) {
        const parsed = parseRestoreLine(text);
        if (!parsed) {
            await bot.sendMessage(chatId, 'Неверный формат. Пример: `Иванов Иван - ряд 5, место 12`', {
                parse_mode: 'Markdown',
                reply_markup: getRestoreKeyboard()
            });
            return;
        }

        const claim = await claimLegacyReservations({
            chatId,
            tgUserId,
            username,
            fullName: parsed.fullName,
            rowNum: parsed.rowNum,
            seatNum: parsed.seatNum
        });

        if (!claim.ok) {
            if (claim.reason === 'limit_exceeded') {
                await bot.sendMessage(
                    chatId,
                    `Твои билеты: ${claim.currentCount}\nНайдено билетов: ${claim.claimCount}\nЛимит билетов: ${claim.maxSeats}\n\nНевозможно полностью восстановить прошлую бронь. Сдай часть билетов`,
                    { reply_markup: getLimitKeyboard() }
                );
                return;
            }

            await bot.sendMessage(chatId, 'Не нашёл legacy-бронь с такими данными. Проверь ФИО, ряд и место.', {
                reply_markup: getRestoreKeyboard()
            });
            return;
        }

        user.restoreMode = false;
        applyStateToUser(user, await getUserState(chatId));
        await bot.sendMessage(chatId, `Готово. Восстановлено билетов: ${claim.claimedCount}.`);
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        return;
    }

    if (text && text.split(' ').length >= 2) {
        user.name = text.trim();
        await setUserName(chatId, tgUserId, user.name, username);
        applyStateToUser(user, await getUserState(chatId));

        await bot.sendSticker(chatId, 'https://cdn2.combot.org/siba_oscar/webp/66xf09fa5b0.webp');

        if (user.selectedSeats.length >= 10) {
            await bot.sendMessage(chatId, '⚠️ У тебя уже выбрано 10 мест. Невозможно выбрать больше билетов.');
            await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
        } else {
            await sendHallScheme(bot, chatId, user);
        }
        return;
    }

    if (text === '/getBookingList') {
        const rows = await getBookingRowsForExport();
        const bookingCsv = buildBookingCsv(rows);
        const filePath = path.join(__dirname, 'bookingList.csv');
        fs.writeFileSync(filePath, bookingCsv, 'utf8');
        await bot.sendDocument(chatId, filePath, {}, { filename: 'BookingList.csv' });
        fs.unlinkSync(filePath);
        return;
    }

    let randStickerNumber = Math.floor(Math.random() * 10);
    let neponLink = 'https://cdn2.combot.org/siba_oscar/webp/6xf09f97bf.webp';

    if (randStickerNumber === 0 || randStickerNumber === 1) neponLink = 'https://cdn2.combot.org/siba_oscar/webp/100xf09f9984.webp';
    if (randStickerNumber === 2 || randStickerNumber === 3) neponLink = 'https://cdn2.combot.org/siba_oscar/webp/83xf09fa494.webp';
    if (randStickerNumber === 4 || randStickerNumber === 5) neponLink = 'https://cdn2.combot.org/siba_oscar/webp/48xf09f9982.webp';
    if (randStickerNumber === 6 || randStickerNumber === 7) neponLink = 'https://cdn2.combot.org/siba_oscar/webp/47xf09fa4af.webp';

    await bot.sendSticker(chatId, neponLink);

    if (user.name) {
        await bot.sendMessage(chatId, 'Что хочешь сделать дальше?', { reply_markup: getActionKeyboard() });
    } else {
        await bot.sendMessage(chatId, 'Чтобы продолжить, введи, пожалуйста, свои *Фамилию Имя*', { parse_mode: 'Markdown' });
    }
}

module.exports = {
    handleMessage
};
