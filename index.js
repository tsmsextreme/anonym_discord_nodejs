const fs = require('fs')
const { Client, Events, GatewayIntentBits, Partials} = require('discord.js'); 
require('dotenv').config();
const TOKEN = process.env.TOKEN;

const client = new Client({	intents: [		
    GatewayIntentBits.DirectMessageReactions,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildBans,
    GatewayIntentBits.GuildEmojisAndStickers,
    GatewayIntentBits.GuildIntegrations,
    GatewayIntentBits.GuildInvites,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildScheduledEvents,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildWebhooks,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.MessageContent],
partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.GuildScheduledEvent,
    Partials.Message,
    Partials.Reaction,
    Partials.ThreadMember,
    Partials.User
]});



let Commands = [];
let CommandFileNames = fs.readdirSync("./commands", {withFileTypes: true});
CommandFileNames.forEach((commandPath)=>{
    Commands.push(require(`./commands/${commandPath.name}`));
})

client.once("ready", c => {
    // ゴミコマンドお掃除
    
    // client.guilds.fetch(process.env.SERVERID).then((guild)=>{
    //     guild.commands.fetch().then(console.log).catch(console.error);
    //     guild.commands.set([])
    //     .then(console.log)
    //     .catch(console.error);
    // });
    
    
    console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

client.on("messageCreate", async message => {
    if(message.channelId !== process.env.TOKUMEI_CHANNELID || message.author.id === process.env.APPLICATIONID) return 0;
    let content = message.content.replaceAll("@silent", "");
    let attachments_urls = [];
    message.attachments.each(attachment => attachments_urls.push(attachment.url))
    await message.delete();
    if(message.content == "" && attachments_urls.length == 0) return 0;
    let bot_post = `>>> ${content} ${attachments_urls.join("\n")}`;
    if(message.content == "") bot_post = `>>> ${attachments_urls.join("\n")}`
    await client.channels.cache.get(message.channelId).send(bot_post);
});

client.on(Events.InteractionCreate, interaction => {

    if (!interaction.isChatInputCommand()) return;

    isCommandExisted = false;
    
    Commands.forEach(async command => {
        if(interaction.commandName == command.data.name){
            isCommandExisted = true;
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'コマンド実行時にエラーになりました。', ephemeral: true });
                }
            }
        }
    });
    if(!isCommandExisted) console.error(`${interaction.commandName}というコマンドには対応していません。`)
});

client.login(TOKEN);

// 死活監視用サーバー
const http = require("http");
const port = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
    response.writeHead(200);

    const responseMessage = "now ON!";
    response.end(responseMessage);
});

server.listen(port);

console.log("OK")