const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const mysql = require('mysql2')


// 以下の形式にすることで、他のファイルでインポートして使用できるようになります。
module.exports = {
	data: new SlashCommandBuilder()
		.setName('silent')
		.setDescription('@silentしなくてもいいし入力中も出ないしどのチャンネルからでも匿名に書き込めるかわりにファイル添付はできないコマンド')
		.addStringOption(option =>{
			return option.setName('input')
				.setDescription('発言(必須)')
				.setRequired(true)
		})
		.addStringOption(option => {
			return option.setName("channnel")
				.setDescription("チャンネル指定(既定値:匿名チャンネル)")
				.addChoices(
					{ name: '匿名', value: process.env.TOKUMEI_CHANNELID },
				)
		}),
	execute: async function(interaction) {
		try {
			const content = interaction.options.getString("input");
			const author = interaction.user.username;
			let Channelid = interaction.options.getString("channel");
			if(!Channelid) Channelid = default_Channelid;
			const sent = await interaction.guild.channels.cache.get(Channelid).send(content);
			let messageId = sent.id;
			let nowtime = new Date().toLocaleString('ja-JP');
			const connection = mysql.createConnection(process.env.DBURL)
			await connection.connect((err) => {
				if (err) throw err;
				const sql = "INSERT INTO logs values(?, ?, ?, ?, NULL)"
				connection.execute(sql,[messageId, author, content, nowtime], (err)=>{
					if(err) throw err;
				})
				connection.end();
			});
			await interaction.reply({ content: '>>> 送信済 すぐにこのメッセージは消えます', ephemeral: true });
			await interaction.deleteReply();
		} catch (err) {
			console.error(err)
			await interaction.reply({ content: `>>> エラーです！すみません！内容:${err}`, ephemeral: true })
		}
	},
};