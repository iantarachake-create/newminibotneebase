const fs = require('fs');
const path = require('path');
const settingsFile = path.join(__dirname, '../database/group_settings.json');

async function GroupEvents(conn, anu) {
    try {
        const { id, participants, action } = anu;
        
        // Ensure database directory exists
        const dbDir = path.join(__dirname, '../database');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir);
        
        // Load group settings
        let settings = fs.existsSync(settingsFile) ? JSON.parse(fs.readFileSync(settingsFile)) : {};
        
        // Only proceed if welcome is enabled for this specific group
        if (!settings[id] || !settings[id].welcome) return;

        const metadata = await conn.groupMetadata(id);

        for (let num of participants) {
            let ppUser;
            try {
                ppUser = await conn.profilePictureUrl(num, 'image');
            } catch {
                ppUser = 'https://files.catbox.moe/j9ia5c.png'; // Default Popkid Logo
            }

            if (action === 'add') {
                let welcomeTxt = `〆 *WELCOME TO ${metadata.subject.toUpperCase()}* 〆\n\n`;
                welcomeTxt += `👤 *User:* @${num.split('@')[0]}\n`;
                welcomeTxt += `📜 *Group Info:* ${metadata.desc || 'Enjoy your stay!'}\n\n`;
                welcomeTxt += `*POPKID-MD MASTER ENGINE* 🇰🇪`;

                await conn.sendMessage(id, { 
                    image: { url: ppUser }, 
                    caption: welcomeTxt, 
                    mentions: [num] 
                });
            } else if (action === 'remove') {
                let goodbyeTxt = `〆 *GOODBYE FROM ${metadata.subject.toUpperCase()}* 〆\n\n`;
                goodbyeTxt += `User @${num.split('@')[0]} has left the chat.\nWe wish you the best!`;

                await conn.sendMessage(id, { 
                    image: { url: ppUser }, 
                    caption: goodbyeTxt, 
                    mentions: [num] 
                });
            }
        }
    } catch (err) {
        console.log("Group Event Error: ", err.message);
    }
}

module.exports = { GroupEvents };
