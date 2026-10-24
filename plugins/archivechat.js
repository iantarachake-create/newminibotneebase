module.exports = {
    cmd: "archivechat",
    alias: ["archive", "unarchive", "unarchivechat"],
    desc: "Archive or unarchive the current chat",
    category: "OWNER",
    isOwner: true,

    async execute(conn, m, { args }) {
        const chatId = m.chat;
        const rawText = m.body.toLowerCase();
        
        // Auto-detect action from command name (same as your reference script)
        const isUnarchive = rawText.startsWith(m.prefix + 'unarchive');
        const action = args[0]?.toLowerCase() || (isUnarchive ? 'unarchive' : 'archive');

        if (!['archive', 'unarchive'].includes(action)) {
            return m.reply(`*📦 ARCHIVE CHAT*\n\n*Usage:*\n• \`.archivechat archive\` — Archive this chat\n• \`.archivechat unarchive\` — Unarchive this chat\n\n_Or use aliases: \`.archive\` / \`.unarchive\`_`);
        }

        const shouldArchive = action === 'archive';

        try {
            // 1. Send the message FIRST. 
            // If we send it after archive, the chat will pop back out.
            const statusMsg = shouldArchive ? `📦 *Chat archived!*` : `📂 *Chat unarchived!*`;
            await m.reply(statusMsg);

            // 2. Small delay to let the message deliver before archiving
            await new Promise(resolve => setTimeout(resolve, 800));

            // 3. Perform the Archive logic exactly like the reference script
            await conn.chatModify({
                archive: shouldArchive,
                lastMessages: [
                    {
                        key: m.key,
                        messageTimestamp: m.messageTimestamp
                    }
                ]
            }, chatId);

        } catch (e) {
            console.error('[ARCHIVECHAT] Error:', e.message);
            m.reply(`❌ Failed to ${action} chat: ${e.message}`);
        }
    }
};
