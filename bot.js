require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Set up the bot client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
});

// Debug to confirm token is loaded
console.log(`Loaded Token: ${process.env.DISCORD_TOKEN}`);
console.log('Starting bot...');

// Add the ready event
client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});

console.log('After login attempt...');

// Slash command registration
const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = 'YOUR_CLIENT_ID'; // Replace with your bot's Client ID
const GUILD_ID = 'YOUR_GUILD_ID'; // Replace with your Discord server's Guild ID

const commands = [
    new SlashCommandBuilder()
        .setName('trubot')
        .setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends the current session'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Slash command handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'trubot') {
        await interaction.reply('Hello! What would you like to play?\n1. Blackjack\n2. Poker\n3. Deathroll');
    } else if (commandName === 'end') {
        await interaction.reply('Goodbye!');
    }
});

// Add logic for games
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
