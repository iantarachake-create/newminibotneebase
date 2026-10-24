const delay = ms => new Promise(res => setTimeout(res, ms))

module.exports = {
    cmd: "newgroup",
    alias: ["creategroup"],
    desc: "Create a new group",
    category: "owner",

    async execute(conn, m, { text, isOwner }) {
        if (!isOwner) return m.reply("👑 *Owner Only*")
        if (!text) return m.reply("📝 *Usage:* .newgroup Group Name")

        try {
            await m.react("🏗️")

            // ✅ Create group safely
            const res = await conn.groupCreate(text.trim(), [m.sender])

            if (!res || !res.id) {
                return m.reply("❌ *Failed to create group (No response from WhatsApp)*")
            }

            const groupId = res.id

            // small delay (important for WhatsApp stability)
            await delay(1500)

            // ✅ Get invite link safely
            let invite = ""
            try {
                invite = await conn.groupInviteCode(groupId)
            } catch {
                invite = "Unavailable"
            }

            // ✅ Final response
            await conn.sendMessage(m.from, {
                text:
`✅ *GROUP CREATED SUCCESSFULLY!*

📛 *Name:* ${text}
🆔 *ID:* ${groupId}

🔗 *Invite Link:*
https://chat.whatsapp.com/${invite}

> *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴇɴɢɪɴᴇ* 🚀`
            }, { quoted: m })

        } catch (e) {
            console.error("GROUP CREATE ERROR:", e)

            // Better error feedback
            m.reply(`❌ *Failed to create group*

⚠️ Possible reasons:
• WhatsApp blocked request temporarily  
• Too many groups created  
• Invalid group name  

Try again after a few seconds.`)
        }
    }
}
