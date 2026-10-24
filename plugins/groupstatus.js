const { jidToNum } = require('../lib/utils')

module.exports = {
    cmd: "groupstatus",
    alias: ["ginfo", "groupinfo"],
    desc: "Get detailed group info",
    category: "misc",
    isGroup: true,
    async execute(conn, m) {
        try {
            const metadata = await conn.groupMetadata(m.from)
            const admins = metadata.participants.filter(v => v.admin !== null).length
            const createdAt = new Date(metadata.creation * 1000).toLocaleString('en-GB', { timeZone: 'Africa/Nairobi' })
            
            let statusText = `📊 *𝐆𝐑𝐎𝐔𝐏 𝐒𝐓𝐀𝐓𝐔𝐒* 📊\n\n` +
                             `📝 *Name:* ${metadata.subject}\n` +
                             `🆔 *ID:* ${metadata.id}\n` +
                             `📅 *Created:* ${createdAt}\n` +
                             `👑 *Owner:* @${jidToNum(metadata.owner || metadata.id.split('-')[0] + '@s.whatsapp.net')}\n` +
                             `👥 *Members:* ${metadata.participants.length}\n` +
                             `🛡️ *Admins:* ${admins}\n\n` +
                             `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 𝟤𝟢𝟤𝟨 🇰🇪`
            
            m.reply(statusText, { mentions: [metadata.owner] })
        } catch (e) {
            m.reply("❌ *Could not fetch group info*")
        }
    }
}
