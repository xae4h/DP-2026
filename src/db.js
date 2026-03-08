const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const FREE = '✅';
const BOOKED = '❌';
const BLOCKED = '◼️';

const dbFile = path.join(__dirname, '..', 'data', 'bot.sqlite');
let dbPromise = null;
let txQueue = Promise.resolve();

function ensureDbDir() {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

function normalizeName(name) {
    return String(name || '')
        .toLowerCase()
        .replace(/ё/g, 'е')
        .replace(/\s+/g, ' ')
        .trim();
}

function cleanPickupLabel(value) {
    return String(value || '')
        .replace(/^🔥+\s*/u, '')
        .trim();
}

function seatText(sectionId, rowNum, seatNum) {
    return `Секция ${sectionId}, Ряд ${rowNum}, Место ${seatNum}`;
}

async function getDb() {
    if (!dbPromise) {
        ensureDbDir();
        dbPromise = open({
            filename: dbFile,
            driver: sqlite3.Database
        });
    }
    return dbPromise;
}

function runExclusiveTransaction(work) {
    const task = async () => {
        const db = await getDb();
        await db.exec('BEGIN IMMEDIATE');
        try {
            const result = await work(db);
            await db.exec('COMMIT');
            return result;
        } catch (error) {
            try {
                await db.exec('ROLLBACK');
            } catch (_) {
                // ignore rollback failure
            }
            throw error;
        }
    };

    const chained = txQueue.then(task, task);
    txQueue = chained.catch(() => undefined);
    return chained;
}

async function initDb() {
    const db = await getDb();
    await db.exec('PRAGMA journal_mode = WAL;');
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            chat_id INTEGER PRIMARY KEY,
            tg_user_id INTEGER,
            username TEXT,
            full_name TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS reservations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            tg_user_id INTEGER,
            full_name TEXT NOT NULL,
            full_name_norm TEXT NOT NULL,
            section_id INTEGER NOT NULL,
            row_num INTEGER NOT NULL,
            seat_num INTEGER NOT NULL,
            pickup_option TEXT,
            status TEXT NOT NULL CHECK(status IN ('active', 'legacy', 'cancelled')),
            source TEXT NOT NULL CHECK(source IN ('live', 'legacy')),
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now')),
            cancelled_at TEXT
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_active_or_legacy_seat
        ON reservations(section_id, row_num, seat_num)
        WHERE status IN ('active', 'legacy');

        CREATE INDEX IF NOT EXISTS idx_reservations_chat_status
        ON reservations(chat_id, status);

        CREATE INDEX IF NOT EXISTS idx_reservations_name_status
        ON reservations(full_name_norm, status);
    `);

    const userColumns = await db.all(`PRAGMA table_info(users)`);
    const hasUsername = userColumns.some((c) => c.name === 'username');
    if (!hasUsername) {
        await db.exec('ALTER TABLE users ADD COLUMN username TEXT;');
    }
}


async function upsertUser(chatId, tgUserId, fullName = null, dbUsername = null, dbConn = null) {
    const db = dbConn || (await getDb());
    await db.run(
        `
        INSERT INTO users(chat_id, tg_user_id, username, full_name, created_at, updated_at)
        VALUES (?, ?, ?, COALESCE(?, ''), datetime('now'), datetime('now'))
        ON CONFLICT(chat_id) DO UPDATE SET
            tg_user_id = COALESCE(excluded.tg_user_id, users.tg_user_id),
            username = COALESCE(excluded.username, users.username),
            full_name = CASE
                WHEN COALESCE(excluded.full_name, '') <> '' THEN excluded.full_name
                ELSE users.full_name
            END,
            updated_at = datetime('now')
        `,
        [chatId, tgUserId ?? null, dbUsername, fullName]
    );
}

async function setUserName(chatId, tgUserId, fullName, dbUsername = null) {
    await upsertUser(chatId, tgUserId, fullName, dbUsername);
    const db = await getDb();
    const trimmed = String(fullName || '').trim();
    if (!trimmed) return;

    await db.run(
        `
        UPDATE reservations
        SET full_name = ?,
            full_name_norm = ?,
            updated_at = datetime('now')
        WHERE chat_id = ? AND status = 'active'
        `,
        [trimmed, normalizeName(trimmed), chatId]
    );
}

async function getUserState(chatId) {
    const db = await getDb();
    const userRow = await db.get('SELECT full_name FROM users WHERE chat_id = ?', [chatId]);
    const seats = await db.all(
        `
        SELECT section_id, row_num, seat_num, pickup_option
        FROM reservations
        WHERE chat_id = ? AND status = 'active'
        ORDER BY row_num, seat_num
        `,
        [chatId]
    );

    const selectedSeats = seats.map((s) => seatText(s.section_id, s.row_num, s.seat_num));
    const pickupOption = seats.find((s) => s.pickup_option)?.pickup_option || null;

    return {
        name: userRow?.full_name || '',
        pickupOption,
        selectedSeats
    };
}

async function reserveSeat({ chatId, tgUserId, username, fullName, sectionId, rowNum, seatNum }) {
    try {
        return await runExclusiveTransaction(async (db) => {
        const existing = await db.get(
            `
            SELECT id
            FROM reservations
            WHERE section_id = ? AND row_num = ? AND seat_num = ?
              AND status IN ('active', 'legacy')
            `,
            [sectionId, rowNum, seatNum]
        );
        if (existing) {
            return { ok: false, reason: 'occupied' };
        }

        await upsertUser(chatId, tgUserId, fullName || '', username, db);
        const effectiveName = fullName && fullName.trim() ? fullName.trim() : 'Без имени';

        await db.run(
            `
            INSERT INTO reservations(
                chat_id, tg_user_id, full_name, full_name_norm,
                section_id, row_num, seat_num, pickup_option,
                status, source, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NULL, 'active', 'live', datetime('now'), datetime('now'))
            `,
            [chatId, tgUserId ?? null, effectiveName, normalizeName(effectiveName), sectionId, rowNum, seatNum]
        );

        return { ok: true };
        });
    } catch (error) {
        throw error;
    }
}

async function cancelSeat(chatId, sectionId, rowNum, seatNum) {
    const db = await getDb();
    const result = await db.run(
        `
        UPDATE reservations
        SET status = 'cancelled',
            cancelled_at = datetime('now'),
            updated_at = datetime('now')
        WHERE chat_id = ?
          AND section_id = ?
          AND row_num = ?
          AND seat_num = ?
          AND status = 'active'
        `,
        [chatId, sectionId, rowNum, seatNum]
    );

    return result.changes > 0;
}

async function setPickupOption(chatId, pickupOption) {
    const db = await getDb();
    await db.run(
        `
        UPDATE reservations
        SET pickup_option = ?, updated_at = datetime('now')
        WHERE chat_id = ? AND status = 'active'
        `,
        [pickupOption, chatId]
    );
}

async function getBookingRowsForExport() {
    const db = await getDb();
    const rows = await db.all(
        `
        SELECT r.tg_user_id, r.full_name, r.row_num, r.seat_num, r.pickup_option, u.username
        FROM reservations r
        LEFT JOIN users u ON u.chat_id = r.chat_id
        WHERE r.status IN ('active', 'legacy')
        ORDER BY r.full_name ASC, r.row_num ASC, r.seat_num ASC
        `
    );
    return rows.map((row) => ({
        id: row.tg_user_id ?? '',
        fullName: row.full_name,
        ticket: `${row.row_num},${row.seat_num}`,
        pickup: cleanPickupLabel(row.pickup_option) || 'Не указано',
        profileLink: row.username ? `https://t.me/${row.username}` : (row.tg_user_id ? `tg://user?id=${row.tg_user_id}` : '')
    }));
}

async function hydrateHallFromDb(hall) {
    const db = await getDb();
    const occupied = await db.all(
        `
        SELECT section_id, row_num, seat_num
        FROM reservations
        WHERE status IN ('active', 'legacy')
        `
    );

    for (const section of Object.values(hall)) {
        for (const row of Object.values(section.rows)) {
            for (const seat of row) {
                if (seat.status !== BLOCKED) {
                    seat.status = FREE;
                }
            }
        }
    }

    for (const seatRef of occupied) {
        const section = hall[seatRef.section_id];
        if (!section) continue;
        const row = section.rows[seatRef.row_num];
        if (!row) continue;
        const seat = row.find((s) => s.number === seatRef.seat_num);
        if (seat && seat.status !== BLOCKED) {
            seat.status = BOOKED;
        }
    }
}

async function claimLegacyReservations({ chatId, tgUserId, username, fullName, rowNum, seatNum }) {
    const norm = normalizeName(fullName);

    try {
        return await runExclusiveTransaction(async (db) => {
        const seed = await db.get(
            `
            SELECT id, pickup_option
            FROM reservations
            WHERE status = 'legacy'
              AND chat_id IS NULL
              AND full_name_norm = ?
              AND row_num = ?
              AND seat_num = ?
            LIMIT 1
            `,
            [norm, rowNum, seatNum]
        );

        if (!seed) {
            return { ok: false, reason: 'not_found' };
        }

        const existingActive = await db.get(
            `
            SELECT COUNT(*) AS c
            FROM reservations
            WHERE chat_id = ? AND status = 'active'
            `,
            [chatId]
        );

        const toClaim = await db.get(
            `
            SELECT COUNT(*) AS c
            FROM reservations
            WHERE status = 'legacy'
              AND chat_id IS NULL
              AND full_name_norm = ?
              AND pickup_option IS ?
            `,
            [norm, seed.pickup_option]
        );

        const currentCount = existingActive?.c || 0;
        const claimCount = toClaim?.c || 0;
        const maxSeats = 10;
        const totalAfterClaim = currentCount + claimCount;

        if (claimCount === 0) {
            return { ok: false, reason: 'not_found' };
        }

        if (totalAfterClaim > maxSeats) {
            return {
                ok: false,
                reason: 'limit_exceeded',
                currentCount,
                claimCount,
                maxSeats
            };
        }

        await upsertUser(chatId, tgUserId, fullName, username, db);
        const update = await db.run(
            `
            UPDATE reservations
            SET chat_id = ?,
                tg_user_id = ?,
                status = 'active',
                updated_at = datetime('now')
            WHERE status = 'legacy'
              AND chat_id IS NULL
              AND full_name_norm = ?
              AND pickup_option IS ?
            `,
            [chatId, tgUserId ?? null, norm, seed.pickup_option]
        );

        return { ok: true, claimedCount: update.changes };
        });
    } catch (error) {
        throw error;
    }
}

module.exports = {
    FREE,
    BOOKED,
    BLOCKED,
    initDb,
    getDb,
    setUserName,
    upsertUser,
    getUserState,
    reserveSeat,
    cancelSeat,
    setPickupOption,
    getBookingRowsForExport,
    hydrateHallFromDb,
    claimLegacyReservations
};
