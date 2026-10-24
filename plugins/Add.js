const { isBotAdmin, isSenderAdmin, jidToNum } = require('../lib/utils')

module.exports = {
    cmd: "add",
    alias: ["invite"],
    desc: "Add a member to the group",
    category: "admin",
    isGroup: true,
    async execute(conn, m, { text, isOwner }) {
        try {
            // 1. Permission Checks
            if (!await isBotAdmin(conn, m.from)) return m.reply("❌ *Error:* I need Admin rights.")
            if (!isOwner && !await isSenderAdmin(conn, m.from, m.sender)) return m.reply("❌ *Restricted:* Admins only.")

            // 2. Identify Target (Number from text or Reply)
            let target = m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || m.message?.extendedTextMessage?.contextInfo?.participant
            
            if (!target && text) {
                // Clean the input to get just numbers
                let input = text.replace(/[^0-9]/g, '')
                if (input.length < 10) return m.reply("⚠️ *Invalid Number:* Provide a full phone number.")
                target = input + '@s.whatsapp.net'
            }

            if (!target) return m.reply("⚠️ *Usage:* .add 254xxxx... or reply to a user's message.")

            const targetJid = target.replace(/:[0-9]+@/, '@')

            await m.react("➕")

            // 3. Attempt to add
            const response = await conn.groupParticipantsUpdate(m.from, [targetJid], 'add')

            // 4. Handle Response (WhatsApp returns status 403 if user has privacy settings on)
            if (response[0].status === "403") {
                return m.reply("⚠️ *Privacy Error:* I cannot add this user because of their privacy settings. Please send them the group link manually.")
            }

            const successText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐔𝐏𝐃𝐀𝐓𝐄* ✨\n\n` +
                                `➕ *Action:* User Added\n` +
                                `👤 *User:* @${jidToNum(targetJid)}\n` +
                                `✅ *Status:* Successfully Joined\n\n` +
                                `> *Mission Completed* 🛡️`;

            m.reply(successText, { mentions: [targetJid] })

        } catch (e) {
            console.error(e)
            m.reply("❌ *Action Failed:* Ensure the number is correct and the user is not already in the group.")
        }
    }
}
