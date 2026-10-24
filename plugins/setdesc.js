const { isBotAdmin, isSenderAdmin } = require('../lib/utils')

module.exports = {
    cmd: "setdesc",
    alias: ["setdescription"],
    desc: "Change Group Name or Description",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { text, command, isOwner }) {
        try {
            if (!await isBotAdmin(conn, m.from)) return m.reply("❌ I need Admin rights.")
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) return m.reply("❌ Admins only.")
            if (!text) return m.reply(`📝 *Usage:* .${command} [text]`)

            if (command === "setname") {
                await conn.groupUpdateSubject(m.from, text)
            } else {
                await conn.groupUpdateDescription(m.from, text)
            }

            await m.react("📝")
            const type = command === "setname" ? "ɴᴀᴍᴇ" : "ᴅᴇꜱᴄʀɪᴘᴛɪᴏɴ";
            
            m.reply(`✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃* ✨\n══════════════════\n✅ *ɢʀᴏᴜᴘ ${type} ᴜᴘᴅᴀᴛᴇᴅ*\n══════════════════\n\n> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀𝗂𝗇𝖾 🇰🇪`)
        } catch (e) { m.reply("❌ Action Failed.") }
    }
}
