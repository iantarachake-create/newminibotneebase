const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

module.exports = {
    cmd: "welcome",
    alias: ["goodbye", "setwelcome"],
    desc: "Toggle Welcome/Goodbye messages ON or OFF",
    category: "group",
    isGroup: true,
    isAdmin: true,
    async execute(conn, m, { text }) {
        const dbDir = path.join(__dirname, '../database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
        
        let settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile)) : {};

        if (text === "on") {
            settings[m.from] = { ...settings[m.from], welcome: true };
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
            m.reply("✅ *Welcome & Goodbye messages enabled for this group.*");
        } else if (text === "off") {
            settings[m.from] = { ...settings[m.from], welcome: false };
            fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
            m.reply("❌ *Welcome & Goodbye messages disabled.*");
        } else {
            m.reply("💡 *Usage:* .welcome on OR .welcome off");
        }
    }
};
