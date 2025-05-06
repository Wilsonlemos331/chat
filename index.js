const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📲 Escaneie o QR code com o WhatsApp.');
});

client.on('ready', () => {
    console.log('🤖 Bot está pronto!');
});

client.on('group_join', async (notification) => {
    const chat = await notification.getChat();
    const contact = await notification.getContact();
    const number = contact.number;

    const isMozambican = number.startsWith('258');

    if (!isMozambican) {
        await chat.sendMessage(`🚫 Número estrangeiro detectado: @${number}. Será removido do grupo.`, {
            mentions: [contact]
        });

        setTimeout(async () => {
            try {
                await chat.removeParticipants([contact.id._serialized]);
                console.log(`❌ ${number} removido do grupo.`);
            } catch (err) {
                console.error('Erro ao remover participante:', err);
            }
        }, 1000);
        return;
    }

    try {
        const profilePicUrl = await client.getProfilePicUrl(contact.id._serialized);
        if (profilePicUrl) {
            const media = await MessageMedia.fromUrl(profilePicUrl);
            await chat.sendMessage(media, {
                caption: `👋 Olá @${number}, seja bem-vindo(a) ao grupo *${chat.name}*!`,
                mentions: [contact]
            });
        } else {
            await chat.sendMessage(`👋 Olá @${number}, bem-vindo(a) ao grupo *${chat.name}*! (Sem foto de perfil)`, {
                mentions: [contact]
            });
        }
    } catch (err) {
        console.error('Erro ao obter foto de perfil:', err);
        await chat.sendMessage(`👋 Olá @${number}, seja bem-vindo(a) ao grupo *${chat.name}*!`, {
            mentions: [contact]
        });
    }
});

function removerLinksExternos(msg) {
    const linkRegex = /https?:\/\/[^\s]+/;
    if (linkRegex.test(msg.body)) {
        msg.delete(true);
        msg.reply("❌ *Links externos não são permitidos!*");
    }
}

const delay = ms => new Promise(res => setTimeout(res, ms));

function gerarMensagemConfirmacao(numero, quantidadeMB, acumulado) {
    const agora = new Date();
    const hora = agora.toTimeString().split(" ")[0];
    const data = agora.toISOString().split("T")[0];
    return `🔔 *Confirmação de Transferência* 🔔

📞 *Número:* ${numero}
// 💾 *A Transferência:* de ${quantidadeMB}MB foi concluída com sucesso para o número ${numero} válidos por 24h. *O futuro é tudo de bom! Vamos?*
// 📈 *Total acumulado:* ${acumulado}MB
⏰ *Data e Hora:* ${hora} - *${data}*`;
}

client.on('message', async msg => {
    const chat = await msg.getChat();
    if (!chat.isGroup) return;

    const contact = await msg.getContact();
    const name = contact.pushname || 'usuário';
    const firstName = name.split(" ")[0];

    removerLinksExternos(msg);

    const comando = msg.body.toLowerCase();
    if (!comando.startsWith('!')) return;

    const partes = comando.split(" ");
    const nomeComando = partes[0];

    await delay(500);
    await chat.sendStateTyping();
    await delay(1000);

    switch (nomeComando) {
        case '!menu':
            await msg.reply(`📜 *COMANDOS DISPONÍVEIS:*

✅ !menu — Mostrar comandos
✅ !megas — Tabela de megas
✅ !iv — Top Tudo Vodacom
✅ !im — Top Tudo Movitel
✅ !pagamento — Formas de pagamento
✅ !confirmar — Confirmar megas
✅ !ban @ — Banir membro
✅ !menções — Mencionar todos
✅ !link — Link do grupo
✅ !abrir — Abrir grupo
✅ !fechar — Fechar grupo
✅ !ad número — Adicionar
✅ !re número — Remover estrangeiro`);
            break;

        case '!megas':
            await msg.reply(`📊 *TABELA DE MEGAS VODACOM (Atualizado 28/05/2025)*

━━━━━━━━━━━━━━━━━━━━━
💸 10MT — 500MB
💸 20MT — 1GB
💸 40MT — 2GB
💸 50MT — 2.5GB
💸 60MT — 3GB
💸 100MT — 5GB
━━━━━━━━━━━━━━━━━━━━━

🗓 *Pacotes Mensais:*
📦 175MT — 5GB
📦 285MT — 10GB
📦 385MT — 15GB
📦 490MT — 20GB
📦 700MT — 30GB
📦 1200MT — 52GB
━━━━━━━━━━━━━━━━━━━━
Para os pacotes *Mensais de internet*, o cliente não pode possuir nenhuma taxa de crédito (*Txuna CREDITO*) ativa ou pendência financeira em seu cadastro.
Em caso de dúvidas ou para regularização, estamos à disposição! ✅
━━━━━━━━━━━━━━━━━━━━
💳 FORMAS DE PAGAMENTO:
━━━━━━━━━━━━━━━━━━━━━
📱 Mpesa: 857745146 – Wilson Ofrasio Lemos
📱 Emola: 863517395 – Wilson Ofrasio Lemos
🏦 Millennium Bim: 395208944 – Saguate Wilson
━━━━━━━━━━━━━━━━━━━━━`);
            break;

        case '!iv':
            await msg.reply(`📞 *TOP TUDO VODACOM*:

✅ 450MT — Ilimitado + 11GB + 10min Roaming
✅ 550MT — Ilimitado + 15GB + 10min Roaming
✅ 700MT — Ilimitado + 20GB + 10min Roaming
✅ 1150MT — Ilimitado + 38GB + 10min Roaming
✅ 2300MT — Ilimitado + 100GB + 10min Roaming
━━━━━━━━━━━━━━━━━━━━

Para os pacotes *Mensais de internet*, o cliente não pode possuir nenhuma taxa de crédito (*Txuna CREDITO*) ativa ou pendência financeira em seu cadastro.
Em caso de dúvidas ou para regularização, estamos à disposição! ✅
💳 FORMAS DE PAGAMENTO:
━━━━━━━━━━━━━━━━━━━━━
📱 Mpesa: 857745146 – Wilson Ofrasio Lemos
📱 Emola: 863517395 – Wilson Ofrasio Lemos
🏦 Millennium Bim: 395208944 – Saguate Wilson
━━━━━━━━━━━━━━━━━━━━━`);
            break;

        case '!im':
            await msg.reply(`📞 *TOP TUDO MOVITEL*:

✅ 460MT — Ilimitado + 9.9GB + 12min Roaming
✅ 920MT — Ilimitado + 20GB + 30min Roaming


💳 FORMAS DE PAGAMENTO:
━━━━━━━━━━━━━━━━━━━━━
📱 Mpesa: 857745146 – Wilson Ofrasio Lemos
📱 Emola: 863517395 – Wilson Ofrasio Lemos
🏦 Millennium Bim: 395208944 – Saguate Wilson
━━━━━━━━━━━━━━━━━━━━━`);
            break;

        case '!pagamento':
            await msg.reply(`💳 FORMAS DE PAGAMENTO:
━━━━━━━━━━━━━━━━━━━━━
📱 Mpesa: 857745146 – Wilson Ofrasio Lemos
📱 Emola: 863517395 – Wilson Ofrasio Lemos
🏦 Millennium Bim: 395208944 – Saguate Wilson
━━━━━━━━━━━━━━━━━━━━━`);
            break;

        case '!confirmar':
            if (partes.length < 3) {
                await msg.reply("❗ *Use assim:* !confirmar +258xxxxxxxxx 500");
                return;
            }

            const numero = partes[1];
            const quantidade = parseInt(partes[2]);
            const caminho = './historico_acumulado.json';
            let historico = {};

            if (fs.existsSync(caminho)) {
                historico = JSON.parse(fs.readFileSync(caminho));
            }

            historico[numero] = (historico[numero] || 0) + quantidade;
            fs.writeFileSync(caminho, JSON.stringify(historico, null, 2));
            await msg.reply(gerarMensagemConfirmacao(numero, quantidade, historico[numero]));
            break;

        case '!ban':
            if (msg.mentionedIds.length === 0) {
                await msg.reply("❗ *Use:* !ban @usuario");
                break;
            }
            try {
                await chat.removeParticipants([msg.mentionedIds[0]]);
                await msg.reply(`🚫 *Usuário removido.*`);
            } catch {
                await msg.reply("❌ *Erro ao remover. Você é admin?*");
            }
            break;

        case '!menções':
        case '!@everyone':
            const mentions = await Promise.all(chat.participants.map(p => client.getContactById(p.id._serialized)));
            await chat.sendMessage(`📢 *Chamada geral:* Olá a todos!`, { mentions });
            break;

        case '!link':
            const inviteCode = await chat.getInviteCode();
            await msg.reply(`🔗 *Link do Grupo:* https://chat.whatsapp.com/${inviteCode}`);
            break;

        case '!abrir':
            await chat.setMessagesAdminsOnly(false);
            await msg.reply("✅ *Grupo aberto!*");
            break;

        case '!fechar':
            await chat.setMessagesAdminsOnly(true);
            await msg.reply("🔒 *Grupo fechado!* Apenas administradores podem enviar mensagens.");
            break;

        case '!ad':
            if (partes.length < 2) {
                await msg.reply("❗ *Use:* !ad +25884xxxxxxx");
                break;
            }
            let num = partes[1].replace(/\D/g, '');
            if (!num.startsWith("258")) num = "258" + num;
            try {
                await chat.addParticipants([num + "@c.us"]);
                await msg.reply(`✅ *Número adicionado:* +${num}`);
            } catch {
                await msg.reply("❌ Erro ao adicionar número.");
            }
            break;

        // Auto-remover estrangeiros ao entrarem no grupo
if (msg.message?.protocolMessage?.type === 3) {
    const newParticipant = msg.message.protocolMessage.key.participant;
    if (newParticipant && !newParticipant.startsWith('258')) {
        await sock.sendMessage(from, { text: '🌍 Número estrangeiro detectado e removido automaticamente.' });
        await sock.groupParticipantsUpdate(from, [newParticipant], 'remove');
    }
}

    }
});

client.initialize();
