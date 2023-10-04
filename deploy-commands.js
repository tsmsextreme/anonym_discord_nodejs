const fs = require('fs')
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const applicationId = process.env.APPLICATIONID;
const guildId = process.env.SERVERID;
const token = process.env.TOKEN;


const rest = new REST().setToken(token);

let Commands = [];
let CommandFileNames = fs.readdirSync("./commands", {withFileTypes: true});

CommandFileNames.forEach((commandPath)=>{
    Commands.push(require(`./commands/${commandPath.name}`).data.toJSON());
});

// Discordサーバーにコマンドを登録

(async () => {
    try {
        await rest.put(
			Routes.applicationGuildCommands(applicationId, guildId),
			{ body: Commands },
		);
        console.log('サーバー固有のコマンドが登録されました！');
    } catch (error) {
        console.error('コマンドの登録中にエラーが発生しました:', error);
    }
})();
