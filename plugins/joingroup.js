/**
 * NEEBASE Plugin: Group Joiner
 * Base: Master Engine 2026 (Unified Edition)
 * Features: invite link extraction, isCreator check, POPKID-XD Styling
 */

module.exports = {
    cmd: "join",
    alias: ["joinme", "f_join", "joingroup"],
    category: "group",
    desc: "To Join a Group from Invite link",
    use: '.join < Group Link >',
    filename: __filename,
    execute: async (conn, mek, context) => {
        // --- 1. Map NEEBASE Context to your Logic ---
        const { 
            reply, q, quoted, pushname, isCreator, from 
        } = context;

        try {
            // Permission messages
            const msr = {
                own_cmd: "⚠️ *Access Denied*\n\nYou don't have permission to use this command. Only my *Creator* can perform this action."
            };

            // --- 2. Security Check (isCreator) ---
            if (!isCreator) return reply(msr.own_cmd);

            // --- 3. Input Check ---
            if (!q && !quoted) {
                return reply("📍 *Please provide a Group Link*️ 🖇️\n\n*Usage:* `.join <link>` or reply to a link.");
            }

            let groupLink;
            const isUrl = (url) => url.includes('chat.whatsapp.com');

            // --- 4. Link Extraction Logic ---
            if (quoted && quoted.text && isUrl(quoted.text)) {
                groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
            } else if (q && isUrl(q)) {
                groupLink = q.split('https://chat.whatsapp.com/')[1];
            } else if (q) {
                // Handle cases where only the code is provided
                groupLink = q.trim();
            }

            if (!groupLink) return reply("❌ *Invalid Group Link* 🖇️\n\nMake sure it is a valid WhatsApp invite URL.");

            // --- 5. Execution (Accept Invite) ---
            await conn.groupAcceptInvite(groupLink);

            // --- 6. Stylish Success Message ---
            const successText = `✨ *POPKID-XD JOINER* ✨\n\n✔️ *Successfully Joined*\n👤 *Requested By:* ${pushname}\n\n> *I am now a member of the group. Ready to manage!*`;
            
            return reply(successText);

        } catch (e) {
            console.error('[JOIN ERROR]:', e);
            return reply(`❌ *Failed to Join Group*\n\n*Reason:* ${e.message || "Invalid or Revoked Link"}`);
        }
    }
};
