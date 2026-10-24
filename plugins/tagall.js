const { isSenderAdmin } = require('../lib/utils')

module.exports = {
    cmd: "tagall",
    alias: ["hidetag", "htag"],
    desc: "Tag all members with names",
    category: "admin",
    isGroup: true,

    async execute(conn, m, { text, isOwner }) {
        try {
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) {
                return m.reply("❌ *Restricted:* Admins only.")
            }

            const metadata = await conn.groupMetadata(m.from)
            const participants = metadata.participants

            let tagMsg = `📢 *𝐀𝐓𝐓𝐄𝐍𝐓𝐈𝐎𝐍 𝐄𝐕𝐄𝐑𝐘𝐎𝐍𝐄* 📢\n\n`
            if (text) tagMsg += `📝 *Message:* ${text}\n\n`
            tagMsg += `👥 *Total Members:* ${participants.length}\n\n`

            for (let participant of participants) {
                // We fetch the name from the participant object or fall back to the ID split
                // This prevents the "conn.contacts" undefined error
                const name = participant.notify || participant.verifiedName || participant.name || participant.id.split('@')[0]
                
                // Using your exact requested style
                tagMsg += `@${name}\n`
            }

            tagMsg += `\n> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴇɴɢɪɴᴇ* 🇰🇪`

            await m.react("📢")

            await conn.sendMessage(
                m.from,
                {
                    text: tagMsg,
                    mentions: participants.map(a => a.id)
                },
                { quoted: m }
            )

        } catch (e) {
            console.error("TagAll Error:", e)
            m.reply("❌ *Failed to tag all members*")
        }
    }
}
