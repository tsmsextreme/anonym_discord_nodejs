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
			const message_id = interaction.options.getString("message_id");
			const connection = mysql.createConnection(process.env.DBURL)
			connection.connect((err) => {
				if (err) throw err;
				let sql = "SELECT * FROM logs WHERE message_id = ?;"
				connection.execute(sql,[message_id], (err, results)=>{
					if(err) throw err;
					let message = results[0];
					let moderator_list_ = message.moderator ? message.moderator.split(",") : [];
					if(moderator_list_.includes(interaction.user.username)){
						interaction.reply({ embeds : [{
							title: "/特定しますた　🧨発動",
							discription: "__あなたはすでに特定ポイントを追加しています__",
							color: 0x00bfff,
							fields: [
							{
								name: "送信日時",
								value: message.time
							},
							{
								name: "内容",
								value: message.content
							},
							{
								name: "累計特定Pt",
								value: moderator_list_.length
							}
						]}], ephemeral: true });
						return 0;
					}

					moderator_list_.push(interaction.user.username);
					let sql = "UPDATE logs SET moderator = ? WHERE message_id = ?;"
					connection.execute(sql, [moderator_list_.join(","), message_id], (err) => {if(err) throw err})
					interaction.reply({ embeds : [{
						title: "/特定しますた　⬆追加",
						discription: "__特定ポイントを追加しました__",
						color: 0x00bfff,
						fields: [
						{
							name: "送信日時",
							value: message.time
						},
						{
							name: "内容",
							value: message.content
						},
						{
							name: "累計特定Pt",
							value: moderator_list_.length
						}
					]}], ephemeral: true });
					connection.end();
					
					if(moderator_list_.length < req_num) return 0;
					interaction.guild.channels.cache.get(process.env.TOKUTEI_NOTIFY_CHANNELID).send({ embeds : [{
						title: "/特定しますた　🧨発動",
						discription: "__特定ポイントがたまりました！🎉__",
						color: 0x00bfff,
						fields: [
						{
							name: "送信日時",
							value: message.time
						},
						{
							name: "内容",
							value: message.content
						},
						{
							name: "送信者",
							value: `||${message.author}||`
						}
					]}]});
				})
				
			});

		} catch (err) {
			console.error(err)
			await interaction.reply({ content: `>>> エラーです！すみません！内容:${err}`, ephemeral: true })
		}
	},
};