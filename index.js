const { Client, GatewayIntentBits, ActivityType } = require("discord.js");  // Correct CommonJS import
const fetch = require('node-fetch');  // Correct CommonJS import
const express = require('express');

// Set up a simple Express server to keep the bot alive
const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Discord bot is running!');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Web server running at http://0.0.0.0:${PORT}`);
});

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const cloudflareWorkerURL = 'https://jolly-scene-076b.andreasdeborger27.workers.dev/status'; // Replace with your actual Cloudflare worker URL

client.once("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Set initial activity to "Checking Cloudflare Worker"
    client.user.setActivity("Checking Cloudflare Worker", { type: ActivityType.Playing });

    // Periodically check the Cloudflare worker every 5 minutes
    setInterval(async () => {
        await checkCloudflareWorker();
    }, 300000); // Check every 5 minutes (300,000 ms)
});

// Handle uncaught promise rejections and errors
process.on("unhandledRejection", (error) => {
    console.error("Unhandled Rejection:", error);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
    client.destroy(); // Ensures client disconnects gracefully on uncaught errors
    process.exit(1); // You can restart the process here if necessary (for example using PM2 or Forever)
});

client.on("messageCreate", async (message) => {
    if (message.content === '!status') {
        await checkCloudflareWorker(message);
    }
});

async function checkCloudflareWorker(message) {
    try {
        // Set activity to "Checking Cloudflare Worker" while fetching the status
        client.user.setActivity("Checking Cloudflare Worker...", { type: ActivityType.Playing });

        const response = await fetch(cloudflareWorkerURL);

        // If the worker responds successfully, update activity to "Server Online"
        if (response.ok) {
            if (message) message.reply('Server Online');
            client.user.setActivity("Server Online", { type: ActivityType.Playing });
        } else {
            // If the worker is down, update activity to "Server Down"
            if (message) message.reply('Server Down');
            client.user.setActivity("Server Down", { type: ActivityType.Playing });
        }
    } catch (error) {
        console.error("Error checking Cloudflare worker:", error);
        if (message) message.reply('Server down!');
        client.user.setActivity("Server Down", { type: ActivityType.Playing });
    }
}

// Make sure bot stays running by catching unhandled promise rejections
client.login(process.env['DISCORD_BOT_TOKEN']).catch(error => {
    console.error("Error during login:", error);
});


//comment
