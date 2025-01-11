require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Set up the bot client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
});

// Your bot token and client ID
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1319967938215673887'; // Replace with your actual Client ID

// Debug to confirm token is loaded
console.log(`Loaded Token: ${process.env.DISCORD_TOKEN}`);

// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('trubot')
        .setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends the current session'),
];

// Add logic for games (Deathroll example provided)
function playDeathroll(message, startingNumber) {
    let currentMax = startingNumber;
    let currentPlayer = 1;

    const roll = () => Math.floor(Math.random() * currentMax) + 1;

    const rollGame = async () => {
        while (currentMax > 1) {
            const rolledNumber = roll();
            await message.channel.send(
                `Player ${currentPlayer} rolls **${rolledNumber}** out of ${currentMax}`
            );

            if (rolledNumber === 1) {
                await message.channel.send(
                    `Player ${currentPlayer} rolled a **1**! Player ${
                        currentPlayer === 1 ? 2 : 1
                    } wins the Deathroll! 🎉`
                );
                return;
            }

            currentMax = rolledNumber;
            currentPlayer = currentPlayer === 1 ? 2 : 1;
        }
    };

    rollGame();
}

// Event: Message create
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === '1') {
        message.channel.send('You chose Blackjack!');
    } else if (message.content === '2') {
        message.channel.send('You chose Poker!');
    } else if (message.content.startsWith('3')) {
        const args = message.content.split(' ');
        const startingNumber = parseInt(args[1]);

        if (!startingNumber || isNaN(startingNumber) || startingNumber <= 1) {
            message.channel.send(
                'Invalid starting number! Use `3 <number>` to start Deathrolling. Example: `3 1000`.'
            );
        } else {
            message.channel.send(
                `Starting Deathroll game with a maximum roll of **${startingNumber}**! Player 1, roll first.`
            );
            playDeathroll(message, startingNumber);
        }
    }
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN);
