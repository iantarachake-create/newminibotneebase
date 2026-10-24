const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = {
    cmd: "link",
    alias: ["grouplink", "gclink"],
    desc: "Get the current group invite link",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { isOwner }) {
        try {
            // 1. Check if Bot is Admin (Necessary to fetch links)
            if (!await isBotAdmin(conn, m.from)) {
                return m.reply("❌ *Error:* I need Admin rights to fetch the link.")
            }

            // 2. Fetch the unique invite code
            const code = await conn.groupInviteCode(m.from)
            await m.react("🔗")

            // 3. Format the response with POPKID-MD branding
            const responseText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐋𝐈𝐍𝐊 𝐅𝐄𝐓𝐂𝐇* ✨\n\n` +
                                 `👥 *Group:* ${m.pushName || 'This Chat'}\n` +
                                 `🔗 *Invite Link:* \nhttps://chat.whatsapp.com/${code}\n\n` +
                                 `> *Shared by Popkid Md Engine* 🇰🇪`;

            m.reply(responseText)

        } catch (e) {
            console.error(e)
            m.reply("❌ *Action Failed:* Could not retrieve the group link.")
        }
    }
}
