// src/hall.js
// Структура зала и варианты получения билетов — точно как в оригинале
const hall = {
    1: {
        name: "", rows: {
            7: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            8: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            9: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            10: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            11: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
        }
    },
    2: {
        name: "", rows: {
            2: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            3: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            4: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            5: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            6: [{ number: 1, status: "✅" }, { number: 2, status: "✅" }, { number: 3, status: "✅" }, { number: 4, status: "✅" }],
            7: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }, { number: 8, status: "✅" }],
            8: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }, { number: 8, status: "✅" }],
            9: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }, { number: 8, status: "✅" }],
            10: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }, { number: 8, status: "✅" }],
            11: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }, { number: 8, status: "✅" }],
        }
    },
    3: {
        name: "", rows: {
            2: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }],
            3: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }],
            4: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }],
            5: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }],
            6: [{ number: 5, status: "✅" }, { number: 6, status: "✅" }, { number: 7, status: "✅" }],
            7: [{ number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            8: [{ number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            9: [{ number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            10: [{ number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            11: [{ number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
        }
    },
    4: {
        name: "", rows: {
            2: [{ number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            3: [{ number: 20, status: "◼️" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            4: [{ number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            5: [{ number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            6: [{ number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            7: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            8: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            9: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            10: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
        }
    },
    5: {
        name: "", rows: {
            2: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            3: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            4: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            5: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            6: [{ number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }, { number: 27, status: "✅" }],
            7: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            8: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            9: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            10: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
        }
    },
    6: {
        name: "", rows: {
            2: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            3: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            4: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            5: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            6: [{ number: 28, status: "✅" }, { number: 29, status: "✅" }, { number: 30, status: "✅" }, { number: 31, status: "✅" }],
            7: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            8: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            9: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            10: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
        }
    },
    7: {
        name: "", rows: {
            14: [{ number: 8, status: "✅" }, { number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            15: [{ number: 8, status: "✅" }, { number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            16: [{ number: 8, status: "✅" }, { number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            17: [{ number: 8, status: "✅" }, { number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            18: [{ number: 8, status: "✅" }, { number: 9, status: "✅" }, { number: 10, status: "✅" }, { number: 11, status: "✅" }],
            19: [{ number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }, { number: 16, status: "✅" }],
            20: [{ number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }, { number: 16, status: "✅" }],
            21: [{ number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }, { number: 16, status: "✅" }],
            22: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            23: [{ number: 11, status: "✅" }, { number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }],
            24: [{ number: 10, status: "✅" }, { number: 11, status: "✅" }, { number: 12, status: "✅" }, { number: 13, status: "✅" }],
        }
    },
    8: {
        name: "", rows: {
            14: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            15: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            16: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            17: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            18: [{ number: 12, status: "✅" }, { number: 13, status: "✅" }, { number: 14, status: "✅" }, { number: 15, status: "✅" }],
            19: [{ number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }, { number: 20, status: "✅" }],
            20: [{ number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }, { number: 20, status: "✅" }],
            21: [{ number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }, { number: 20, status: "✅" }],
            22: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            23: [{ number: 15, status: "✅" }, { number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }],
            24: [{ number: 14, status: "✅" }, { number: 15, status: "✅" }, { number: 16, status: "✅" }, { number: 17, status: "✅" }],
        }
    },
    9: {
        name: "", rows: {
            14: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            15: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            16: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            17: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            18: [{ number: 16, status: "✅" }, { number: 17, status: "✅" }, { number: 18, status: "✅" }, { number: 19, status: "✅" }],
            19: [{ number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }, { number: 24, status: "✅" }],
            20: [{ number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }, { number: 24, status: "✅" }],
            21: [{ number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }, { number: 24, status: "✅" }],
            22: [{ number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }, { number: 23, status: "✅" }],
            23: [{ number: 19, status: "✅" }, { number: 20, status: "✅" }, { number: 21, status: "✅" }, { number: 22, status: "✅" }],
            24: [{ number: 18, status: "✅" }, { number: 19, status: "✅" }, { number: 20, status: "✅" }, { number: 21, status: "✅" }],
        }
    },
    10: {
        name: "", rows: {
            12: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            13: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            14: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            15: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            16: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            17: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            18: [{ number: 32, status: "✅" }, { number: 33, status: "✅" }, { number: 34, status: "✅" }, { number: 35, status: "✅" }],
            19: [{ number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }, { number: 40, status: "✅" }],
            20: [{ number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }, { number: 40, status: "✅" }],
            21: [{ number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }, { number: 40, status: "✅" }],
            22: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            23: [{ number: 35, status: "✅" }, { number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }],
            24: [{ number: 34, status: "◼️" }, { number: 35, status: "✅" }, { number: 36, status: "✅" }, { number: 37, status: "✅" }],
        }
    },
    11: {
        name: "", rows: {
            12: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            13: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            14: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            15: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            16: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            17: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            18: [{ number: 36, status: "✅" }, { number: 37, status: "✅" }, { number: 38, status: "✅" }, { number: 39, status: "✅" }],
            19: [{ number: 41, status: "✅" }, { number: 42, status: "✅" }, { number: 43, status: "✅" }, { number: 44, status: "✅" }],
            20: [{ number: 41, status: "✅" }, { number: 42, status: "✅" }, { number: 43, status: "✅" }, { number: 44, status: "✅" }],
            21: [{ number: 41, status: "✅" }, { number: 42, status: "✅" }, { number: 43, status: "✅" }, { number: 44, status: "✅" }],
            22: [{ number: 40, status: "✅" }, { number: 41, status: "✅" }, { number: 42, status: "✅" }, { number: 43, status: "✅" }],
            23: [{ number: 39, status: "✅" }, { number: 40, status: "✅" }, { number: 41, status: "✅" }, { number: 42, status: "✅" }],
            24: [{ number: 38, status: "✅" }, { number: 39, status: "✅" }, { number: 40, status: "✅" }, { number: 41, status: "✅" }],
            25: [{ number: 23, status: "✅" }, { number: 24, status: "✅" }, { number: 25, status: "✅" }, { number: 26, status: "✅" }],
            26: [{ number: 22, status: "✅" }, { number: 23, status: "✅" }, { number: 24, status: "✅" }, { number: 25, status: "◼️" }],
        }
    },
    12: {
        name: "", rows: {
            19: [{ number: 45, status: "✅" }, { number: 46, status: "✅" }, { number: 47, status: "✅" }, { number: 48, status: "✅" }],
            20: [{ number: 45, status: "✅" }, { number: 46, status: "✅" }, { number: 47, status: "✅" }, { number: 48, status: "✅" }],
            21: [{ number: 45, status: "✅" }, { number: 46, status: "✅" }, { number: 47, status: "✅" }, { number: 48, status: "✅" }],
            22: [{ number: 44, status: "✅" }, { number: 45, status: "✅" }, { number: 46, status: "✅" }, { number: 47, status: "✅" }],
            23: [{ number: 43, status: "✅" }, { number: 44, status: "✅" }, { number: 45, status: "✅" }, { number: 46, status: "◼️" }],
            24: [{ number: 47, status: "✅" }, { number: 43, status: "✅" }, { number: 44, status: "◼️" }, { number: 45, status: "◼️" }],
        }
    },
};

const pickupOptions = [
    '🔥04.03 14:00-16:00 - КСК УНИКС, 5 этаж',
    '🔥10.03 12:00-14:00 - ИФ, 1 этаж у буфета',
    '🔥12.03 14:00-16:00 - ИФ, 1 этаж у буфета'
];

function calculateSections() {
    const sections = {};
    for (let secId in hall) {
        let free = 0;
        for (let rowNum in hall[secId].rows) {
            free += hall[secId].rows[rowNum].filter(s => s.status === "✅").length;
        }
        sections[secId] = free;
    }
    return sections;
}

module.exports = {
    hall,
    pickupOptions,
    calculateSections
};
