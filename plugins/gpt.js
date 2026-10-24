const axios = require('axios');

// --- AI API POOL (Fallback Logic) ---
const AI_APIS = [
    (q) => `https://mistral.stacktoy.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://llama.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`,
    (q) => `https://mistral.gtech-apiz.workers.dev/?apikey=Suhail&text=${encodeURIComponent(q)}`
];

const askAI = async (query) => {
    for (const apiUrl of AI_APIS) {
        try {
            const { data } = await axios.get(apiUrl(query), { timeout: 15000 });
            // Extracting response from data.data.response based on your script
            const response = data?.data?.response || data?.result || data?.response; 
            
            if (response && typeof response === 'string' && response.trim()) {
                return response.trim();
            }
        } catch (err) {
            continue; // Try the next API in the list
        }
    }
    throw new Error('All AI systems are currently busy.');
};

module.exports = {
    cmd: "gpt",
    alias: ["ai", "ask", "llama", "chat"],
    desc: "Ask the POPKID-MD AI a question",
    category: "AI",
    async execute(conn, m, { text }) {
        // Handle input correctly to prevent .match errors
        let input = text || m.body || '';
        if (typeof input !== 'string') input = input.toString();

        let query = input.replace(m.prefix + m.command, '').trim();
        
        // Check quoted message if no direct text
        if (!query && m.quoted) {
            query = m.quoted.body || m.quoted.text || '';
        }

        if (!query) {
            return m.reply(`🤖 *ᴘᴏᴘᴋɪᴅ-ᴍᴅ ᴀɪ ᴀssɪsᴛᴀɴᴛ*\n\n*Usage:* .gpt <your question>\n*Example:* .gpt write a poem about Kenya 🇰🇪`);
        }

        try {
            await m.react("🤖");

            // Fetch answer using fallback logic
            const answer = await askAI(query);

            await m.react("✅");

            // Formatting the response with your branding
            const responseText = `🤖 *ᴀɪ ʀᴇsᴘᴏɴsᴇ*\n\n` +
                                 `${answer}\n\n` +
                                 `> 𝖯𝗈𝗉𝗄𝗂𝖽 𝖬𝖽 𝖤𝗇𝗀ɪɴ𝖾 𝟤𝟢𝟤𝟨 🇰🇪`;

            return await m.reply(responseText);

        } catch (err) {
            console.error("AI Plugin Error:", err.message);
            await m.react("❌");
            return m.reply(`⚠️ *ᴀɪ ᴇʀʀᴏʀ:* ${err.message}`);
        }
    }
};
