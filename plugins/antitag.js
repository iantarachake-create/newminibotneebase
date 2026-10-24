const fs = require('fs');
const path = require('path');

// Local database path
const dbPath = path.join(__dirname, '../database/antitag.json');

// Helper to load/save settings
const getDB = () => JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const saveDB = (data) => fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));

// Ensure database exists
if (!fs.existsSync(dbPath)) {
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath));
    fs.writeFileSync(dbPath, JSON.stringify({}));
}

module.exports = {
    cmd: "antitag",
    alias: ["at", "tagblock"],
    desc: "Prevent mass tagging in groups",
    category: "ADMIN",
    groupOnly: true,
    async execute(conn, m, { text, args }) {
        // Ensure user is admin
        const groupMetadata = await conn.groupMetadata(m.from);
        const participants = groupMetadata.participants;
        const isAdmin = participants.find(p => p.id === m.sender)?.admin;
        if (!isAdmin && !m.isOwner) return m.reply("❌ *ᴀᴅᴍɪɴ ᴏɴʟʏ ᴄᴏᴍᴍᴀɴᴅ!*");

        const action = args[0]?.toLowerCase();
        const db = getDB();

        if (!action) {
            const status = db[m.from]?.enabled ? "🟢 ᴇɴᴀʙʟᴇᴅ" : "🔴 ᴅɪꜱᴀʙʟᴇᴅ";
            const mode = db[m.from]?.action || "ᴅᴇʟᴇᴛᴇ";
            return m.reply(
                `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐀𝐍𝐓𝐈𝐓𝐀𝐆* ✨\n` +
                `══════════════════\n` +
                `📊 *ꜱᴛᴀᴛᴜꜱ:* ${status}\n` +
                `🛡️ *ᴍᴏᴅᴇ:* ${mode.toUpperCase()}\n\n` +
                `📝 *ᴄᴏᴍᴍᴀɴᴅꜱ:*\n` +
                `◦ .antitag on\n` +
                `◦ .antitag off\n` +
                `◦ .antitag set kick/delete\n` +
                `══════════════════`
            );
        }

        if (action === "on") {
            db[m.from] = { enabled: true, action: db[m.from]?.action || "delete" };
            saveDB(db);
            await m.react("✅");
            return m.reply("✅ *ᴀɴᴛɪᴛᴀɢ ᴇɴᴀʙʟᴇᴅ.*");
        }

        if (action === "off") {
            if (db[m.from]) db[m.from].enabled = false;
            saveDB(db);
            await m.react("❌");
            return m.reply("❌ *ᴀɴᴛɪᴛᴀɢ ᴅɪꜱᴀʙʟᴇᴅ.*");
        }

        if (action === "set") {
            const mode = args[1]?.toLowerCase();
            if (mode !== "kick" && mode !== "delete") return m.reply("❌ *ᴜꜱᴇ: .antitag set kick/delete*");
            db[m.from] = { enabled: db[m.from]?.enabled || false, action: mode };
            saveDB(db);
            return m.reply(`✅ *ᴀɴᴛɪᴛᴀɢ ᴀᴄᴛɪᴏɴ ꜱᴇᴛ ᴛᴏ:* ${mode.toUpperCase()}`);
        }
    }
};
