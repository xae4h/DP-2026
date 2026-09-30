require('dotenv').config();
const bot = require('./src/bot');
const { hall } = require('./src/hall');
const messageHandler = require('./src/handlers/messageHandler');
const callbackHandler = require('./src/handlers/callbackHandler');
const { hydrateHallFromDb, initDb, reserveSeat, BOOKED } = require('./src/db');

function createDeduper(ttlMs = 120000) {
    const seen = new Map();
    return (key) => {
        const now = Date.now();
        const expiresAt = seen.get(key);
        if (expiresAt && expiresAt > now) return true;
        seen.set(key, now + ttlMs);
        if (seen.size > 5000) {
            for (const [k, exp] of seen.entries()) {
                if (exp <= now) seen.delete(k);
            }
        }
        return false;
    };
}


async function reserveInitialSeats() {
    const seatsToReserve = [
        { sectionId: 4, rowNum: 10, seatNum: 24 },
        { sectionId: 4, rowNum: 10, seatNum: 25 },
        { sectionId: 4, rowNum: 10, seatNum: 26 },
        { sectionId: 4, rowNum: 10, seatNum: 27 },
        { sectionId: 5, rowNum: 10, seatNum: 28 },
        { sectionId: 5, rowNum: 10, seatNum: 29 },
        { sectionId: 5, rowNum: 10, seatNum: 30 },
        { sectionId: 5, rowNum: 10, seatNum: 31 },
        { sectionId: 6, rowNum: 10, seatNum: 32 },
        { sectionId: 6, rowNum: 10, seatNum: 33 },
        { sectionId: 6, rowNum: 10, seatNum: 34 },
        { sectionId: 6, rowNum: 10, seatNum: 35 },
    ];

    let reservedCount = 0;
    let alreadyBookedCount = 0;

    for (const seat of seatsToReserve) {
        const result = await reserveSeat({
            chatId: 0,
            tgUserId: null,
            username: null,
            fullName: 'Забронировано',
            sectionId: seat.sectionId,
            rowNum: seat.rowNum,
            seatNum: seat.seatNum
        });

        if (result.ok) {
            reservedCount++;
            // Обновляем статус в зале
            const section = hall[seat.sectionId];
            if (section) {
                const row = section.rows[seat.rowNum];
                if (row) {
                    const seatObj = row.find(s => s.number === seat.seatNum);
                    if (seatObj) {
                        seatObj.status = BOOKED;
                    }
                }
            }
        } else {
            alreadyBookedCount++;
        }
    }

    console.log(`Забронировано мест: ${reservedCount}, уже занято: ${alreadyBookedCount}`);
}

async function bootstrap() {
    await initDb();
    await hydrateHallFromDb(hall);

    // Бронируем места 24-35 при запуске
    await reserveInitialSeats();

    console.log('Bot starting...');
    const isDuplicate = createDeduper();

    bot.on('polling_error', (err) => {
        console.error('Polling error:', err?.response?.body || err?.message || err);
    });
    bot.on('webhook_error', (err) => {
        console.error('Webhook error:', err?.response?.body || err?.message || err);
    });
    bot.on('message', async (msg) => {
        const messageKey = `m:${msg?.chat?.id}:${msg?.message_id}`;
        if (isDuplicate(messageKey)) return;
        try {
            await messageHandler.handleMessage(msg, bot);
        } catch (err) {
            console.error('Error in message handler:', err?.response?.body?.description || err?.message || err);
        }
    });
    bot.on('callback_query', async (query) => {
        const callbackKey = `c:${query?.id}`;
        if (isDuplicate(callbackKey)) return;
        try {
            await callbackHandler.handleCallback(query, bot);
        } catch (err) {
            console.error('Error in callback handler:', err?.response?.body?.description || err?.message || err);
        }
    });
}

bootstrap().catch((error) => {
    console.error('Failed to bootstrap bot:', error);
    process.exit(1);
});