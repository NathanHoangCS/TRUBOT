require('dotenv').config();
await rest.put(Routes.applicationCommands('1319967938215673887'), { body: commands });
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Set up the bot client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
});

// Your bot token and client ID
const TOKEN = process.env.DISCORD_TOKEN;
console.log(`Loaded Token: ${TOKEN}`);
const CLIENT_ID = '1319967938215673887'; // Find this in the Discord Developer Portal

// Register slash commands
const commands = [
    new SlashCommandBuilder()
        .setName('trubot')
        .setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends the current session'),
];

// Register the commands with Discord's API
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Helper function to deal a card
function dealCard() {
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const suits = ['♠', '♥', '♦', '♣'];
    const rank = ranks[Math.floor(Math.random() * ranks.length)];
    const suit = suits[Math.floor(Math.random() * suits.length)];
    return `${rank}${suit}`;
}

// Blackjack logic
function playBlackjack() {
    const playerCards = [dealCard(), dealCard()];
    const dealerCards = [dealCard(), dealCard()];
    return `You drew: ${playerCards.join(', ')}\nDealer drew: ${dealerCards.join(', ')}.\nGame over!`;
}

// Poker logic
function playPoker() {
    const playerHand = [dealCard(), dealCard(), dealCard(), dealCard(), dealCard()];
    return `Your Poker hand: ${playerHand.join(', ')}. Game over!`;
}

// Event: Bot ready
client.once('ready', () => {
    console.log('TRubot is online!');
});

// Event: Slash command interaction
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'trubot') {
        await interaction.reply(
            `Hello, this is TRubot! What would you like to play?\n1. Blackjack\n2. Poker\nType the number of your choice below!`
        );
    }

    if (commandName === 'end') {
        await interaction.reply('Ending the session. Goodbye!');
        process.exit(0); // Stops the bot
    }
});

// Event: Message create
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    if (message.content === '1') {
        const blackjackGame = playBlackjack();
        message.channel.send(blackjackGame);
    } else if (message.content === '2') {
        const pokerGame = playPoker();
        message.channel.send(pokerGame);
    }
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN);
