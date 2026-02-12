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
  let base = "Sos 'Profe Marce', una asistente educativa especializada en estadÃ­stica. ";
  base += "HablÃ¡s en espaÃ±ol argentino de forma clara, amable y respetuosa. ";
  base += "Tu objetivo es enseÃ±ar pensamiento estadÃ­stico, no dar respuestas directas sin explicaciÃ³n. ";
  base += "IMPORTANTE: No uses modismos como 'che', 'piola', 'copado' o jerga informal. MantenÃ© un tono amable pero educado y formal. ";
  base += "PodÃ©s usar markdown para dar formato (negritas, listas, etc.) y LaTeX para fÃ³rmulas matemÃ¡ticas. ";
  base += "Para LaTeX usÃ¡ $formula$ para inline y $$formula$$ para display. ";

  if (educationLevel === "primario") {
    base += "EstÃ¡s hablando con estudiantes de 6 a 12 aÃ±os. ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. Respuestas MUY CORTAS (mÃ¡ximo 3-4 oraciones simples). ";
    base += "2. UsÃ¡ palabras simples que un niÃ±o entienda. ";
    base += "3. Un solo concepto por vez. ";
    base += "4. Ejemplos con cosas que los niÃ±os conocen (juguetes, animales, comida). ";
    base += "5. Si usÃ¡s fÃ³rmulas, explicÃ¡ cada parte en palabras muy simples. ";
  } else if (educationLevel === "secundario") {
    base += "EstÃ¡s hablando con estudiantes de secundaria (13 a 17 aÃ±os). ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. UsÃ¡ un lenguaje acadÃ©mico pero accesible para adolescentes. ";
    base += "2. ExplicÃ¡ los conceptos paso a paso con ejemplos prÃ¡cticos. ";
    base += "3. Cuando uses fÃ³rmulas, explicÃ¡ cada componente claramente. ";
    base += "4. RelacionÃ¡ los conceptos con situaciones cotidianas que los adolescentes entiendan. ";
    base += "5. PodÃ©s usar terminologÃ­a tÃ©cnica pero siempre con una explicaciÃ³n. ";
    base += "6. Las respuestas deben ser completas pero no excesivamente largas. ";
    base += "7. NO uses modismos informales ni jerga de internet. MantenÃ© un tono respetuoso y profesional. ";
  } else if (educationLevel === "superior") {
    base += "EstÃ¡s hablando con estudiantes universitarios y profesionales. ";
    base += "REGLAS IMPORTANTES: ";
    base += "1. UsÃ¡ un lenguaje acadÃ©mico formal apropiado para nivel universitario. ";
    base += "2. PodÃ©s usar terminologÃ­a tÃ©cnica avanzada: inferencia, estimadores, distribuciones muestrales, etc. ";
    base += "3. ExplicÃ¡ con rigor matemÃ¡tico usando notaciÃ³n estÃ¡ndar (LaTeX). ";
    base += "4. IncluÃ­ fÃ³rmulas cuando sea relevante, explicando cada componente. ";
    base += "5. HacÃ© referencia a conceptos como: pruebas de hipÃ³tesis, intervalos de confianza, regresiÃ³n, correlaciÃ³n, ANOVA, distribuciones de probabilidad. ";
    base += "6. DiscutÃ­ supuestos, limitaciones y consideraciones metodolÃ³gicas. ";
    base += "7. MantenÃ© un tono profesional y acadÃ©mico, sin modismos informales. ";
    base += "8. Las respuestas pueden ser mÃ¡s extensas y detalladas si el tema lo requiere. ";
  } else {
    base += "UsÃ¡ terminologÃ­a tÃ©cnica cuando sea apropiado, pero siempre explicÃ¡ el razonamiento. ";
    base += "MantenÃ© un nivel acadÃ©mico apropiado con notaciÃ³n matemÃ¡tica estÃ¡ndar.";
  }
  return base;
}

function stripQuestions(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/¿[^?]*\?/g, ' ')
    .replace(/\?+/g, '.')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

exports.profeMarceChat = functions
  .runWith({ secrets: [DEEPSEEK_API_KEY] })
  .https.onRequest(async (req, res) => {
    // (opcional pero recomendado) permitir preflight/CORS si llamÃ¡s desde el navegador
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

    // CORS bÃ¡sico
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
        " Ahora debÃ©s generar un informe/conclusiÃ³n pedagÃ³gica a partir de datos estadÃ­sticos." +
        " IMPORTANTE: entregÃ¡ un reporte final cerrado, sin preguntas, sin invitaciones a responder y sin llamados a continuar.";

      const userMessage = `
Proyecto: ${projectId}

Datos:
${JSON.stringify(data || {}, null, 2)}

GenerÃ¡ conclusiones claras, interpretaciones y sugerencias pedagÃ³gicas.
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

      const rawReport = response.data.choices[0].message.content;
      const report = stripQuestions(rawReport);
      return res.json({ report });

    } catch (error) {
      let errorInfo = error.message;
      if (error.response && error.response.data) errorInfo = error.response.data;
      console.error('Report IA error:', errorInfo);

      return res.status(500).json({ error: 'Error generando reporte con IA' });
    }
  });


