const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = {
    cmd: "resetlink",
    alias: ["revoke", "resetglink"],
    desc: "Reset the group invite link",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { isOwner }) {
        try {
            if (!await isBotAdmin(conn, m.from)) return m.reply("❌ *Error:* I need Admin rights.")
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) return m.reply("❌ *Restricted:* Admins only.")

            await conn.groupRevokeInvite(m.from)
            await m.react("🔄")
            
            const successText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n` +
                                `🔄 *Action:* Link Revoked\n` +
                                `✅ *Status:* New Link Generated\n\n` +
                                `> *Security Updated* 🛡️`;

            m.reply(successText)
        } catch (e) {
            m.reply("❌ *Action Failed*")
        }
    }
}
