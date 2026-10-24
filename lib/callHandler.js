const config = require("../config");

async function handleIncomingCall(conn, call) {
    if (config.ANTICALL !== "true") return;

    for (let node of call) {
        if (node.status === 'offer') {
            const callerId = node.from;
            try {
                // 1. Terminate the call
                await conn.rejectCall(node.id, callerId);

                // 2. Send the professional warning
                const warningText = `✨ *𝐏𝐎𝐏𝐊𝐈𝐃-𝐌𝐃 𝐒𝐄𝐂𝐔𝐑𝐈𝐓𝐘* ✨\n` +
                                    `══════════════════════⊷\n` +
                                    `🚫 *ᴄᴀʟʟ ʀᴇᴊᴇᴄᴛᴇᴅ*\n` +
                                    `👤 *ᴜꜱᴇʀ:* @${callerId.split('@')[0]}\n` +
                                    `📢 *ɪɴꜰᴏ:* ᴠᴏɪᴄᴇ/ᴠɪᴅᴇᴏ ᴄᴀʟʟꜱ ᴀʀᴇ ᴅɪꜱᴀʙʟᴇᴅ ᴛᴏ ᴍᴀɪɴᴛᴀɪɴ ʙᴏᴛ ꜱᴛᴀʙɪʟɪᴛʏ.\n` +
                                    `══════════════════════⊷\n` +
                                    `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 🇰🇪`;

                await conn.sendMessage(callerId, { 
                    text: warningText, 
                    mentions: [callerId] 
                });
            } catch (err) {
                console.error("Call Rejection Error:", err.message);
            }
        }
    }
}

module.exports = { handleIncomingCall };
