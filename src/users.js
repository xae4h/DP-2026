const users = {};

function getUser(chatId) {
    if (!users[chatId]) {
        users[chatId] = {
            id: chatId,
            name: '',
            selectedSeats: [],
            pickupOption: null,
            lastSchemeMsgId: null,
            restoreMode: false
        };
    }
    return users[chatId];
}

module.exports = {
    users,
    getUser
};
