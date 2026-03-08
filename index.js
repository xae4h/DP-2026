require('dotenv').config();
const bot = require('./src/bot');
const { hall } = require('./src/hall');
const messageHandler = require('./src/handlers/messageHandler');
const callbackHandler = require('./src/handlers/callbackHandler');
const { hydrateHallFromDb, initDb } = require('./src/db');

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

async function bootstrap() {
    await initDb();

    await hydrateHallFromDb(hall);
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
