const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const default_Channelid = process.env.TOKUMEI_CHANNELID;
const mysql = require('mysql2')
const req_num = process.env.REQ_NUM;


// 以下の形式にすることで、他のファイルでインポートして使用できるようになります。
module.exports = {
	data: new SlashCommandBuilder()
		.setName('特定しますた')
		.setDescription(`${req_num}ポイント貯まる (${req_num}人から実行される) とそのメッセージの投稿者が晒し上げられます`)
		.addStringOption(option =>{
			return option.setName('message_id')
				.setDescription('わからなければ「discord メッセージid 取得 方法」で調べてください')
				.setRequired(true)
		}),
	execute: async function(interaction) {
		try {
			flag = false;
			const message = interaction.options.getString("message_id");
			await connection.connect((err) => {
				if (err) throw err;
				const sql = "SELECT * FROM logs WHERE message_id = ?"
				connection.execute(sql,[message], (err, results, fields)=>{
					if(err) throw err;
					console.log(results, fields);
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