const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = {
    cmd: "demote",
    desc: "Remove admin status",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { isOwner }) {
        try {
            if (!await isBotAdmin(conn, m.from)) return m.reply("❌ *Error:* I need Admin rights.")
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) return m.reply("❌ *Restricted:* Admins only.")

            let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
            if (!target) return m.reply("⚠️ *Tag or reply to an admin*")

            const targetJid = target.replace(/:[0-9]+@/, '@')

            await conn.groupParticipantsUpdate(m.from, [targetJid], 'demote')
            await m.react("⬇️")

            const successText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n` +
                                `🛡️ *Role:* Admin Removal\n` +
                                `👤 *User:* @${jidToNum(targetJid)}\n` +
                                `✅ *Status:* Successfully Demoted\n\n` +
                                `> *Mission Completed* 📉`;

            m.reply(successText, { mentions: [targetJid] })

        } catch (e) {
            m.reply("❌ *Action Failed*")
        }
    }
}
