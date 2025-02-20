require('dotenv').config();
const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');

// Set up the bot client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

// Debugging: Confirm token is loaded
console.log(`Loaded Token: ${process.env.DISCORD_TOKEN}`);
console.log('Starting bot...');

// Add bot ready event
client.once('ready', () => {
    console.log(`${client.user.tag} is online! Connected to servers:`);
    client.guilds.cache.forEach((guild) => {
        console.log(`- ${guild.name} (ID: ${guild.id})`);
    });
});

// Log in the bot
client.login(process.env.DISCORD_TOKEN).catch((error) => {
    console.error('Failed to log in:', error);
});

console.log('After login attempt...');

// Slash Command Registration
const CLIENT_ID = '1319967938215673887'; // Your bot's Application ID
const GUILD_ID = '1327403319727095869'; // Your server's Guild ID

const commands = [
    new SlashCommandBuilder()
        .setName('trubot')
        .setDescription('Summons Trubot to play games'),
    new SlashCommandBuilder()
        .setName('end')
        .setDescription('Ends the current session'),
    new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clears any active game session'),
].map(command => command.toJSON());


const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands }
        );
        console.log('Slash commands registered!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
})();

// Game state
let activeGame = null;

async function startDeathroll(interaction) {
    try {
        // Step 1: Ask for the bet
        await interaction.reply('What are you betting on? (Type it below)');
        
        const filter = (response) => response.author.id === interaction.user.id;
        const collectedBet = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        if (!collectedBet.size) {
            await interaction.followUp('You did not provide a bet description. Cancelling game.');
            return;
        }

        const betDescription = collectedBet.first().content.trim();

        // Step 2: Ask for the starting number
        await interaction.followUp('What is the starting number for the Deathroll? (Type a number)');
        
        const collectedNumber = await interaction.channel.awaitMessages({ filter, max: 1, time: 30000 });

        if (!collectedNumber.size || isNaN(collectedNumber.first().content)) {
            await interaction.followUp('Invalid number. Cancelling game.');
            return;
        }

        const startingNumber = parseInt(collectedNumber.first().content, 10);
        if (startingNumber < 2) {
            await interaction.followUp('Starting number must be **2 or higher**. Cancelling game.');
            return;
        }

        // Step 3: Start the game
        activeGame = {
            currentMax: startingNumber,
            currentPlayer: interaction.user,
            players: [interaction.user],
            bet: betDescription,
        };

        await interaction.followUp(`Starting **Deathroll** for **"${betDescription}"** with max roll **${startingNumber}**!`);
        await interaction.followUp(`${activeGame.currentPlayer}, type \`roll ${activeGame.currentMax}\` to start.`);
    } catch (error) {
        console.error('Error starting Deathroll:', error);
        await interaction.followUp('An error occurred. Cancelling game.');
    }
}


async function handleRoll(message) {
    if (!activeGame) {
        return message.channel.send('No active Deathroll game. Use `/trubot` to start one.');
    }

    const input = message.content.trim().toLowerCase();
    const expectedRollCommand = `roll ${activeGame.currentMax}`;

    if (input !== expectedRollCommand) {
        return message.reply(`Incorrect command! You must type **\`${expectedRollCommand}\`**.`);
    }

    // Generate the next roll number
    const nextRoll = Math.floor(Math.random() * activeGame.currentMax) + 1;
    activeGame.currentMax = nextRoll;

    message.channel.send(`${activeGame.currentPlayer.username} rolls **${nextRoll}** out of ${expectedRollCommand.split(" ")[1]}.`);

    if (nextRoll === 1) {
        message.channel.send(
            `${activeGame.currentPlayer.username} rolled a **1**! The game ends and they lose the bet on "${activeGame.bet}". 🎉`
        );
        activeGame = null;
        return;
    }

    // Switch player
    activeGame.currentPlayer = activeGame.players.find((p) => p.id !== activeGame.currentPlayer.id);
    message.channel.send(`${activeGame.currentPlayer}, it's your turn! Type \`roll ${nextRoll}\`.`);
}

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'trubot') {
        await interaction.reply('Hello! What would you like to play?\n1. Blackjack\n2. Poker\n3. Deathroll');
    } else if (commandName === 'end') {
        if (activeGame) {
            activeGame = null;
            await interaction.reply('The current game session has been ended.');
        } else {
            await interaction.reply('There is no active game session.');
        }
    } else if (commandName === 'clear') {
        activeGame = null;
        await interaction.reply('✅ **Game session cleared!** You can now start a new game.');
    }
});



// Handle Message Events
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content === '1') {
        message.channel.send('You chose Blackjack!');
    } else if (message.content === '2') {
        message.channel.send('You chose Poker!');
    } else if (message.content === '3') {
        await startDeathroll(message);
    } else if (activeGame && message.content.toLowerCase().startsWith("roll ")) {
        await handleRoll(message);
    }
});
