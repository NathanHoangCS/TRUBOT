require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
});

console.log(`Loaded Token: ${process.env.DISCORD_TOKEN}`);
console.log('Starting bot...');

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);
});

client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});

console.log('After login attempt...');

const CLIENT_ID = '1319967938215673887';
const GUILD_ID = '1327403319727095869';

const commands = [
    new SlashCommandBuilder().setName('trubot').setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder().setName('end').setDescription('Ends the current session'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

let activeGame = null;

// Start Deathrolling Game (WoW Rules)
async function startDeathroll(message) {
    if (activeGame) {
        message.channel.send('A Deathroll game is already in progress. Finish it first.');
        return;
    }

    const filter = (response) => response.author.id === message.author.id && !response.author.bot;

    // Step 1: Ask for the maximum roll number
    await message.channel.send('What is the maximum roll number? (Type a number)');

    try {
        const collectedMax = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const startingNumber = parseInt(collectedMax.first().content.trim(), 10);

        if (isNaN(startingNumber) || startingNumber <= 1) {
            message.channel.send('Invalid number! Please type `3` again to restart.');
            return;
        }

        // Step 2: Ask for the bet description
        await message.channel.send('What are you betting on? (Type it below)');

        const collectedBet = await message.channel.awaitMessages({ filter, max: 1, time: 30000, errors: ['time'] });
        const betDescription = collectedBet.first().content.trim();

        if (!betDescription) {
            message.channel.send('You must include a bet description. Type `3` again to restart.');
            return;
        }

        activeGame = {
            currentMax: startingNumber,
            currentPlayer: 1,
            players: [],
            bet: betDescription,
        };

        message.channel.send(
            `Starting Deathroll game with a max roll of **${startingNumber}** for "${betDescription}".\n` +
            `Player 1, roll by typing **/roll**.`
        );

    } catch (error) {
        message.channel.send('You did not respond in time. Game canceled.');
    }
}

// Handle Rolls Based on WoW Deathrolling
async function handleRoll(message) {
    if (!activeGame) {
        message.channel.send('No active Deathroll game. Type `3` to start.');
        return;
    }

    const { currentMax, currentPlayer, players } = activeGame;

    // Ensure correct players join
    if (!players.includes(message.author.id)) {
        if (players.length < 2) {
            players.push(message.author.id);
            message.channel.send(`Player ${players.length} joined!`);
        } else {
            message.channel.send('This game is only for two players.');
            return;
        }
    }

    // Ensure the correct player rolls
    if (players[currentPlayer - 1] !== message.author.id) {
        message.channel.send(`It's not your turn! Player ${currentPlayer}, you must roll.`);
        return;
    }

    // Roll a random number between 1 and the current max
    const rolledNumber = Math.floor(Math.random() * currentMax) + 1;

    // Announce roll
    message.channel.send(`Player ${currentPlayer} rolls **${rolledNumber}** out of ${currentMax}.`);

    // Check if the game is over (rolled 1)
    if (rolledNumber === 1) {
        message.channel.send(
            `Player ${currentPlayer} rolled a **1**! Player ${
                currentPlayer === 1 ? 2 : 1
            } wins the bet on "${activeGame.bet}"! 🎉`
        );
        activeGame = null; // End the game
        return;
    }

    // Update the game state
    activeGame.currentMax = rolledNumber;
    activeGame.currentPlayer = currentPlayer === 1 ? 2 : 1;

    message.channel.send(`Player ${activeGame.currentPlayer}, it's your turn! Type **/roll**.`);
}

// Message Event for Deathroll
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    const content = message.content.trim();

    if (content === '3') {
        await startDeathroll(message);
    } else if (content === '/roll') {
        await handleRoll(message);
    }
});
