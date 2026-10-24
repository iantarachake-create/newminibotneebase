const isAdmin = require('../lib/isAdmin');

module.exports = {
    cmd: 'disappear',
    alias: ['ephemeral', 'disappearing', 'vanish'],
    category: 'admin',
    description: 'Enable or disable disappearing messages in chat',
    execute: async (sock, m, context) => {
        // This links your Master Engine execution to the handler below
        const { text, args, isOwner } = context;
        const msgArgs = text ? text.split(' ') : args;
        
        // Prepare context for the handler to ensure compatibility
        const pluginContext = {
            chatId: m.chat,
            senderId: m.sender,
            senderIsOwnerOrSudo: isOwner,
            channelInfo: {}, // Placeholder for your base's context
            ...context
        };

        return await handler(sock, m, msgArgs, pluginContext);
    }
};

async function handler(sock, message, args, context) {
    const chatId = context.chatId || message.key.remoteJid;
    const channelInfo = context.channelInfo || {};
    const isGroup = chatId.endsWith('@g.us');
    const senderId = context.senderId || message.key.participant || message.key.remoteJid;
    const senderIsOwnerOrSudo = context.senderIsOwnerOrSudo || false;

    // Permission check
    if (isGroup && !senderIsOwnerOrSudo) {
        const { isSenderAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isSenderAdmin) {
            return await sock.sendMessage(chatId, {
                text: '❌ Only group admins or bot owner can change disappearing messages.',
                ...channelInfo
            }, { quoted: message });
        }
    }
    if (!isGroup && !senderIsOwnerOrSudo && !message.key.fromMe) {
        return await sock.sendMessage(chatId, {
            text: '❌ Only the bot owner can change disappearing messages in DMs.',
            ...channelInfo
        }, { quoted: message });
    }

    const input = args[0]?.toLowerCase();
    if (!input) {
        return await sock.sendMessage(chatId, {
            text: `*⏳ DISAPPEARING MESSAGES*\n\n` +
                `*Usage:*\n` +
                `• \`.disappear off\` — Disable\n` +
                `• \`.disappear 24h\` — 24 hours\n` +
                `• \`.disappear 7d\` — 7 days (default)\n` +
                `• \`.disappear 90d\` — 90 days`,
            ...channelInfo
        }, { quoted: message });
    }

    const durations = {
        'off': false,
        '0': false,
        '24h': 86400,
        '1d': 86400,
        '7d': 604800,
        '1w': 604800,
        '90d': 7776000,
        '3m': 7776000,
    };

    if (!(input in durations)) {
        return await sock.sendMessage(chatId, {
            text: `❌ Invalid option: *${input}*\n\nChoose: \`off\`, \`24h\`, \`7d\`, \`90d\``,
            ...channelInfo
        }, { quoted: message });
    }

    const seconds = durations[input];
    try {
        await sock.sendMessage(chatId, {
            disappearingMessagesInChat: seconds === false ? false : seconds
        });

        const labels = {
            'off': '❌ Disappearing messages *disabled*',
            '0': '❌ Disappearing messages *disabled*',
            '24h': '⏳ Disappearing messages set to *24 hours*',
            '1d': '⏳ Disappearing messages set to *24 hours*',
            '7d': '⏳ Disappearing messages set to *7 days*',
            '1w': '⏳ Disappearing messages set to *7 days*',
            '90d': '⏳ Disappearing messages set to *90 days*',
            '3m': '⏳ Disappearing messages set to *90 days*',
        };

        await sock.sendMessage(chatId, {
            text: labels[input],
            ...channelInfo
        }, { quoted: message });
    }
    catch (e) {
        console.error('[DISAPPEAR] Error:', e.message);
        await sock.sendMessage(chatId, {
            text: `❌ Failed to change disappearing messages: ${e.message}`,
            ...channelInfo
        }, { quoted: message });
    }
}
