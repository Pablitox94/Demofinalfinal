const functions = require("firebase-functions");
const axios = require("axios");
const { defineSecret } = require("firebase-functions/params");

// Definimos el secreto
const DEEPSEEK_API_KEY = defineSecret("DEEPSEEK_API_KEY");

exports.profeMarceChat = functions
  .runWith({ secrets: [DEEPSEEK_API_KEY] })
  .https.onRequest(async (req, res) => {
    try {
      const userInput = req.body.userInput;

      if (!userInput) {
        return res.status(400).json({ error: "userInput requerido" });
      }

      // Tomamos la key segura
      const apiKey = DEEPSEEK_API_KEY.value();

      const response = await axios.post(
        "https://api.deepseek.com/chat/completions",
        {
          model: "deepseek-chat",
          messages: [
            { role: "user", content: userInput }
          ]
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );

      res.json({
        reply: response.data.choices[0].message.content
      });

   } catch (error) {

  let errorInfo = error.message;

  if (error.response && error.response.data) {
    errorInfo = error.response.data;
  }

  console.error("DeepSeek error:", errorInfo);

  res.status(500).json({
    error: "Error consultando DeepSeek"
  });
}

  });
