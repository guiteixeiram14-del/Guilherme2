app.post('/webhook', async (req, res) => {
  res.status(200).send('ok'); // responde rápido para evitar retry da Z-API

  try {
    const body = req.body || {};
    const text =
      body?.text?.message ??
      body?.message?.text ??
      body?.message?.content ??
      '';
    const sender =
      body?.participantPhone ?? body?.phone ?? body?.from ?? '';

    if (!text || !sender) return;

    // Ignora mensagens que não começam com @bot
    if (!text.trim().toLowerCase().startsWith('@bot')) return;

    // Remove @bot do início e pega o comando
    const commandText = text.replace(/^@bot\s*/i, '').trim().toLowerCase();

    let reply = '';

    // Comandos especiais
    if (commandText === 'ajuda') {
      reply = 'Oi! Eu sou o bot 🤖. Use "@bot {mensagem}" para me perguntar qualquer coisa. Alguns comandos: ajuda, piada, sobre.';
    } else if (commandText === 'piada') {
      reply = 'Por que o computador foi ao médico? Porque ele tinha um vírus! 😂';
    } else if (commandText === 'sobre') {
      reply = 'Eu sou um bot conectado ao ChatGPT e Z-API, posso responder perguntas em tempo real!';
    } else {
      // Se não for comando especial, envia pro ChatGPT
      const ai = await openai.responses.create({
        model: MODEL,
        input: `Responda em pt-BR, breve e útil. Pergunta: "${commandText}"`
      });
      reply = (ai.output_text || '').trim();
    }

    if (!reply) return;

    // Enviar resposta via Z-API
    const url = `https://api.z-api.io/instances/${process.env.ZAPI_INSTANCE}/token/${process.env.ZAPI_TOKEN}/send-text`;

    await axios.post(
      url,
      { phone: sender, message: `BOT: ${reply}` },
      {
        headers: {
          'Client-Token': process.env.ZAPI_CLIENT_TOKEN,
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

  } catch (err) {
    console.error('Erro no handler:', err?.response?.data || err.message);
  }
});
