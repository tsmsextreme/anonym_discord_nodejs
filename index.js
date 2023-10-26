const fs = require('fs')
const { Client, Events, GatewayIntentBits, Partials} = require('discord.js'); 
require('dotenv').config();
const TOKEN = process.env.TOKEN;
const mysql = require('mysql2')

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
    if(parseInt(process.env.DELETE_COMMAND)){
        client.guilds.fetch(process.env.SERVERID).then((guild)=>{
            guild.commands.fetch().then(console.log).catch(console.error);
            guild.commands.set([])
            .then(console.log)
            .catch(console.error);
        });
    }
    if(parseInt(process.env.UPDATE_MESSAGEID)){
        const mysql = require('mysql2');
        const connection = mysql.createConnection(process.env.DBURL);
        (async()=>{
            const channel = client.channels.cache.get(process.env.TOKUMEI_CHANNELID);
            let message = await channel.messages
              .fetch({ limit: 1 })
              .then(messagePage => (messagePage.size === 1 ? messagePage.at(0) : null));
            while (message) {
              await channel.messages
                .fetch({ limit: 100, before: message.id })
                .then(messagePage => {
                    messagePage.forEach(msg => {
                        
                        let message_create_at_JST_date = new Date(msg.createdTimestamp);
                        let message_create_at_JST = message_create_at_JST_date.toLocaleString('ja-JP')
                        connection.connect(() => {
                            const sql = `UPDATE logs SET message_id = ${msg.id} WHERE time <= '${message_create_at_JST}' ORDER BY time DESC LIMIT 1;`
                            console.log(sql, msg.content);
                            connection.query(sql)
                        });
                    });
                  message = 0 < messagePage.size ? messagePage.at(messagePage.size - 1) : null;
                });
            }
        })();
        
    }
    
    console.log(`準備OKです! ${c.user.tag}がログインします。`);
});

client.on("messageCreate", async message => {
    if(message.channelId !== process.env.TOKUMEI_CHANNELID || message.author.id === process.env.APPLICATIONID) return 0;
    let content = message.content.replaceAll("@silent", "");
    let attachments_urls = [];
    message.attachments.each(attachment => attachments_urls.push(attachment.url))
    if(message.content == "" && attachments_urls.length == 0) return 0;
    let bot_post = `>>> ${content} ${attachments_urls.join("\n")}`;
    if(message.content == "") bot_post = `>>> ${attachments_urls.join("\n")}`
    await client.channels.cache.get(message.channelId).send(bot_post);
    let nowDate = new Date(message.createdTimestamp);
    //nowDate.setHours(nowDate.getHours()+9);
    nowtime = nowDate.toLocaleString('ja-JP');
    const connection = mysql.createConnection(process.env.DBURL)
    connection.connect((err) => {
        if (err) throw err;
        const sql = "INSERT INTO logs values(?, ?, ?, ?, NULL)"
        connection.execute(sql,[message.id, message.user.username, bot_post, nowtime], (err)=>{
            if(err) throw err;
        })
        connection.end();
    });
    console.log(message,process.env.APPLICATIONID);
    
    setTimeout(() => {
        message.delete()
        .then((deleteMessage) => console.log("削除することが出来ました"))
        .catch((error) => console.log("こちらのメッセージは既に削除されていました。"));
    }, 1000);
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