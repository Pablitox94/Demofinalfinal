// Usa v1 para poder acceder a runWith y bindear el secreto correctamente
const functions = require('firebase-functions/v1');
const axios = require('axios');
const { defineSecret } = require('firebase-functions/params');

// Definimos el secreto
const DEEPSEEK_API_KEY = defineSecret('DEEPSEEK_API_KEY');

function applyCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

function getSystemMessage(educationLevel) {
  let base = "Sos 'Profe Marce', una asistente educativa especializada en estadística. ";
  base += "Hablás en español argentino de forma clara, amable y respetuosa. ";
  base += "Tu objetivo es enseñar pensamiento estadístico, no dar respuestas directas sin explicación. ";
  base += "IMPORTANTE: No uses modismos como 'che', 'piola', 'copado' o jerga informal. Mantené un tono amable pero educado y formal. ";
  base += "Podés usar markdown para dar formato (negritas, listas, etc.) y LaTeX para fórmulas matemáticas. ";
  base += "Para LaTeX usá $formula$ para inline y $$formula$$ para display. ";

  if (educationLevel === "primario") {
    base += "Estás hablando con estudiantes de 6 a 12 años. ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. Respuestas MUY CORTAS (máximo 3-4 oraciones simples). ";
    base += "2. Usá palabras simples que un niño entienda. ";
    base += "3. Un solo concepto por vez. ";
    base += "4. Ejemplos con cosas que los niños conocen (juguetes, animales, comida). ";
    base += "5. Si usás fórmulas, explicá cada parte en palabras muy simples. ";
  } else if (educationLevel === "secundario") {
    base += "Estás hablando con estudiantes de secundaria (13 a 17 años). ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. Usá un lenguaje académico pero accesible para adolescentes. ";
    base += "2. Explicá los conceptos paso a paso con ejemplos prácticos. ";
    base += "3. Cuando uses fórmulas, explicá cada componente claramente. ";
    base += "4. Relacioná los conceptos con situaciones cotidianas que los adolescentes entiendan. ";
    base += "5. Podés usar terminología técnica pero siempre con una explicación. ";
    base += "6. Las respuestas deben ser completas pero no excesivamente largas. ";
    base += "7. NO uses modismos informales ni jerga de internet. Mantené un tono respetuoso y profesional. ";
  } else if (educationLevel === "superior") {
    base += "Estás hablando con estudiantes universitarios y profesionales. ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. Usá un lenguaje académico formal apropiado para nivel universitario. ";
    base += "2. Podés usar terminología técnica avanzada: inferencia, estimadores, distribuciones muestrales, etc. ";
    base += "3. Explicá con rigor matemático usando notación estándar (LaTeX). ";
    base += "4. Incluí fórmulas cuando sea relevante, explicando cada componente. ";
    base += "5. Hacé referencia a conceptos como: pruebas de hipótesis, intervalos de confianza, regresión, correlación, ANOVA, distribuciones de probabilidad. ";
    base += "6. Discutí supuestos, limitaciones y consideraciones metodológicas. ";
    base += "7. Mantené un tono profesional y académico, sin modismos informales. ";
    base += "8. Las respuestas pueden ser más extensas y detalladas si el tema lo requiere. ";
  } else {
    base += "Usá terminología técnica cuando sea apropiado, pero siempre explicá el razonamiento. ";
    base += "Mantené un nivel académico apropiado con notación matemática estándar.";
  }

  return base;
}

exports.profeMarceChat = functions
  .runWith({ secrets: [DEEPSEEK_API_KEY] })
  .https.onRequest(async (req, res) => {
    // (opcional pero recomendado) permitir preflight/CORS si llamás desde el navegador
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
      const userInput = req.body.userInput;
      const educationLevel = req.body.educationLevel || 'secundario';

      if (!userInput) {
        return res.status(400).json({ error: 'userInput requerido' });
      }

      const apiKey = DEEPSEEK_API_KEY.value();
      const systemMessage = getSystemMessage(educationLevel);

      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userInput },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.json({
        reply: response.data.choices[0].message.content,
        educationLevel,
      });

    } catch (error) {
      let errorInfo = error.message;
      if (error.response && error.response.data) errorInfo = error.response.data;
      console.error('DeepSeek error:', errorInfo);

      return res.status(500).json({ error: 'Error consultando DeepSeek' });
    }
  });

  exports.generateReport = functions
  .runWith({ secrets: [DEEPSEEK_API_KEY], timeoutSeconds: 120, memory: '1GB' })
  .https.onRequest(async (req, res) => {

    // CORS básico
    applyCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');

    try {
      const { projectId, educationLevel, data } = req.body;

      if (!projectId) {
        return res.status(400).json({ error: 'projectId requerido' });
      }

      const apiKey = DEEPSEEK_API_KEY.value();

      const systemMessage =
        getSystemMessage(educationLevel) +
        " Ahora debés generar un informe/conclusión pedagógica a partir de datos estadísticos.";

      const userMessage = `
Proyecto: ${projectId}

Datos:
${JSON.stringify(data || {}, null, 2)}

Generá conclusiones claras, interpretaciones y sugerencias pedagógicas.
`;

      const response = await axios.post(
        'https://api.deepseek.com/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: userMessage },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return res.json({
        report: response.data.choices[0].message.content,
      });

    } catch (error) {
      let errorInfo = error.message;
      if (error.response && error.response.data) errorInfo = error.response.data;
      console.error('Report IA error:', errorInfo);

      return res.status(500).json({ error: 'Error generando reporte con IA' });
    }
  });
