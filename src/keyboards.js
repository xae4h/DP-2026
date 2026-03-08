const { hall } = require('./hall');

function getActionKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🎟 Все мои билеты', callback_data: 'all_tickets' }],
            [{ text: '❌ Отменить бронь', callback_data: 'cancel_tickets' }],
            [{ text: '➡ Забронировать ещё', callback_data: 'book_more' }]
        ]
    };
}

function getAllTicketsKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '🎟 Все мои билеты', callback_data: 'all_tickets' }],
            [{ text: '♻️ Восстановить бронь', callback_data: 'restore_booking' }],
            [{ text: '❌ Отменить бронь', callback_data: 'cancel_tickets' }],
            [{ text: '➡ Забронировать ещё', callback_data: 'book_more' }]
        ]
    };
}

function getRestoreKeyboard() {
    return {
        inline_keyboard: [
            [{ text: '⬅️ Назад', callback_data: 'restore_back' }]
        ]
    };
}

function getLimitKeyboard() {
    return {
        inline_keyboard: [[
            { text: '🎟 Билеты', callback_data: 'all_tickets' },
            { text: '❌ Сдать', callback_data: 'cancel_tickets' }
        ]]
    };
}

function getCancelKeyboard(user) {
    const cancelKeyboard = user.selectedSeats.map((seat, idx) => [
        { text: seat.replace(/Секция \d+, /, ''), callback_data: `cancel_${idx}` }
    ]);

    cancelKeyboard.push([{ text: '⬅️ Назад', callback_data: 'back_to_actions' }]);
    return { inline_keyboard: cancelKeyboard };
}

function getPickupKeyboard(pickupOptions) {
    return {
        inline_keyboard: pickupOptions.map((option, index) => [{ text: option, callback_data: `pickup_${index}` }])
    };
}

function getSeatsKeyboard(sectionId, user) {
    const section = hall[sectionId];
    const keyboard = [];

    for (const rowNum in section.rows) {
        const rowButtons = [{ text: `р${rowNum}`, callback_data: 'noop' }];
        section.rows[rowNum].forEach((seat) => {
            let status = seat.status;
            if (
                user.selectedSeats.includes(`Ряд ${rowNum}, Место ${seat.number}`) ||
                user.selectedSeats.includes(`Секция ${sectionId}, Ряд ${rowNum}, Место ${seat.number}`)
            ) {
                status = '❌';
            }
            rowButtons.push({
                text: `${seat.number} ${status}`,
                callback_data: `${sectionId}-${rowNum}-${seat.number}`
            });
        });
        keyboard.push(rowButtons);
    }

    keyboard.push([{ text: '⬅️ Вернуться к выбору секции', callback_data: 'back_to_sections' }]);
    keyboard.push([{ text: '✅ Завершить бронирование', callback_data: 'finish_booking' }]);
    return { inline_keyboard: keyboard };
}

module.exports = {
    getActionKeyboard,
    getAllTicketsKeyboard,
    getLimitKeyboard,
    getRestoreKeyboard,
    getCancelKeyboard,
    getPickupKeyboard,
    getSeatsKeyboard
};
