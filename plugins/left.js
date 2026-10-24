module.exports = {
    cmd: "left",
    alias: ["leave", "out"],
    desc: "Make the bot leave the group",
    category: "owner",
    isGroup: true,
    async execute(conn, m, { isOwner }) {
        if (!isOwner) return m.reply("👑 *Owner Only*")
        
        try {
            await m.react("👋")
            await m.reply("👋 *GoodBye Everyone!* \n\nᴘᴏᴘᴋɪᴅ-ᴍᴅ ɪs ɴᴏᴡ ʟᴇᴀᴠɪɴɢ. 🇰🇪")
            await conn.groupLeave(m.from)
        } catch (e) {
            m.reply("❌ *Error leaving group*")
        }
    }
}
