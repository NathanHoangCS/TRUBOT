require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Set up the bot client
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages],
});

// Debugging: Confirm the token is loaded
console.log(`Loaded Token: ${process.env.DISCORD_TOKEN}`);
console.log('Starting bot...');

// Ready Event: Confirm bot is online
client.once('ready', () => {
    console.log(`${client.user.tag} is online and ready!`);
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});

console.log('After login attempt...');

// Replace YOUR_CLIENT_ID and YOUR_GUILD_ID with actual IDs
const CLIENT_ID = process.env.CLIENT_ID || '1319967938215673887'; // Replace with your bot's Application ID
const GUILD_ID = process.env.GUILD_ID || '1327403319727095869'; // Replace with your server's Guild ID

// Slash command registration
const commands = [
    new SlashCommandBuilder()
        .setName('trubot')
        .setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends the current session'),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
})();

// Event: Slash Command Handling
client.on('interactionCreate', async (interaction) => {
    console.log(`Interaction received: ${interaction.commandName}`); // Log the command name
    if (!interaction.isCommand()) {
        console.log('Interaction is not a command');
        return;
    }

    const { commandName } = interaction;

    if (commandName === 'trubot') {
        console.log('Responding to /trubot...');
        await interaction.reply('Hello! What would you like to play?\n1. Blackjack\n2. Poker\n3. Deathroll');
    } else if (commandName === 'end') {
        console.log('Responding to /end...');
        await interaction.reply('Goodbye!');
    }
});

// Event: Message Create
client.on('messageCreate', (message) => {
    console.log(`Message received: ${message.content}`);
    if (message.author.bot) return;

    const content = message.content.trim();

    if (content.startsWith('3')) {
        const args = content.split(' ');
        const startingNumber = parseInt(args[1], 10);

        if (!startingNumber || isNaN(startingNumber) || startingNumber <= 1) {
            message.channel.send(
                'Invalid starting number! Use `3 <number>` to start Deathrolling. Example: `3 1000`.'
            );
            return;
        }

        // Ask for the bet description
        message.channel.send('What are you betting on? (Type it below)').then(() => {
            const filter = (response) => !response.author.bot && response.author.id === message.author.id;
            const collector = message.channel.createMessageCollector({ filter, max: 1, time: 30000 });

            collector.on('collect', (betMessage) => {
                const betDescription = betMessage.content.trim();
                if (!betDescription) {
                    message.channel.send('You must include a bet description to start the game.');
                    return;
                }

                startDeathroll(message, startingNumber, betDescription);
            });

            collector.on('end', (collected) => {
                if (collected.size === 0) {
                    message.channel.send('You did not provide a bet description in time. Game canceled.');
                }
            });
        });
    } else if (activeGame && !isNaN(content)) {
        handleRoll(message, content);
    }
});

// Deathroll Game Logic
let activeGame = null;

function startDeathroll(message, startingNumber, betDescription) {
    activeGame = {
        currentMax: startingNumber,
        currentPlayer: 1,
        players: [],
        bet: betDescription,
    };

    message.channel.send(
        `Starting Deathroll game with a maximum roll of **${startingNumber}** for: "${betDescription}".\n` +
        `Player 1, type your roll!`
    );
}

function handleRoll(message, rollInput) {
    if (!activeGame) {
        message.channel.send('No active Deathroll game. Start one by typing `3 <startingNumber>` and follow the prompts.');
        return;
    }

    const roll = parseInt(rollInput, 10);
    const { currentMax, currentPlayer, players } = activeGame;

    if (!players.includes(message.author.id)) {
        if (players.length < 2) {
            players.push(message.author.id);
        } else {
            message.channel.send('This game is only for two players.');
            return;
        }
    }

    if (roll < 1 || roll > currentMax) {
        message.channel.send(`Invalid roll! You must roll between 1 and ${currentMax}.`);
        return;
    }

    activeGame.currentMax = roll;
    message.channel.send(`Player ${currentPlayer} rolls **${roll}** out of ${currentMax}.`);

    if (roll === 1) {
        message.channel.send(
            `Player ${currentPlayer} rolled a **1**! Player ${
                currentPlayer === 1 ? 2 : 1
            } wins the bet on "${activeGame.bet}"! 🎉`
        );
        activeGame = null; // End the game
        return;
    }

    // Switch player
    activeGame.currentPlayer = currentPlayer === 1 ? 2 : 1;
    message.channel.send(`Player ${activeGame.currentPlayer}, your turn!`);
}
