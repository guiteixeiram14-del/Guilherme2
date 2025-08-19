// server.js
import express from "express";
import fetch from "node-fetch";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// Rota principal para teste
app.get("/", (req, res) => {
  res.send("ok");
});

// Webhook Z-API
app.post("/webhook", async (req, res) => {
  try {
    const { body } = req;
    console.log("Mensagem recebida:", body);

    const mensagemRecebida = body.message || "";
    const isGroup = body.isGroup || false;
    const from = body.from;

    // Se for grupo, só responde se tiver @bot
    if (isGroup && !mensagemRecebida.toLowerCase().includes("@bot")) {
      return res.sendStatus(200); // não responde se não tiver menção
    }

    // Gerar resposta com ChatGPT
    const respostaChatGPT = await gerarRespostaChatGPT(mensagemRecebida);

    // Enviar resposta pelo Z-API
    if (from) {
      await fetch(`https://api.z-api.io/instances/YOUR_INSTANCE_ID/token/YOUR_TOKEN/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: from,
          message: respostaChatGPT
        }),
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.sendStatus(500);
  }
});

// Função para chamar o ChatGPT
async function gerarRespostaChatGPT(pergunta) {
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: pergunta }]
      })
    });
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ChatGPT:", error);
    return "Desculpe, não consegui processar sua mensagem.";
  }
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
