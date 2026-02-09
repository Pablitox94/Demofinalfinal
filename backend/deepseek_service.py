from emergentintegrations.llm.chat import LlmChat, UserMessage
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

EMERGENT_API_KEY = os.getenv('EMERGENT_LLM_KEY')

class ProfeMarceChat:
    def __init__(self, education_level: str = "secundario"):
        self.education_level = education_level
        self.system_message = self._get_system_message()
    
    def _get_system_message(self) -> str:
        base = "Sos 'Profe Marce', una asistente educativa especializada en estadística. "
        base += "Hablás en español argentino de forma clara, amable y respetuosa. "
        base += "Tu objetivo es enseñar pensamiento estadístico, no dar respuestas directas sin explicación. "
        base += "IMPORTANTE: No uses modismos como 'che', 'piola', 'copado' o jerga informal. Mantené un tono amable pero educado y formal. "
        base += "Podés usar markdown para dar formato (negritas, listas, etc.) y LaTeX para fórmulas matemáticas. "
        base += "Para LaTeX usá $formula$ para inline y $$formula$$ para display. "
        
        if self.education_level == "primario":
            base += "Estás hablando con estudiantes de 6 a 12 años. "
            base += "REGLAS IMPORTANTES: "
            base += "1. Respuestas MUY CORTAS (máximo 3-4 oraciones simples). "
            base += "2. Usá palabras simples que un niño entienda. "
            base += "3. Un solo concepto por vez. "
            base += "4. Ejemplos con cosas que los niños conocen (juguetes, animales, comida). "
            base += "5. Si usás fórmulas, explicá cada parte en palabras muy simples. "
        elif self.education_level == "secundario":
            base += "Estás hablando con estudiantes de secundaria (13 a 17 años). "
            base += "REGLAS IMPORTANTES: "
            base += "1. Usá un lenguaje académico pero accesible para adolescentes. "
            base += "2. Explicá los conceptos paso a paso con ejemplos prácticos. "
            base += "3. Cuando uses fórmulas, explicá cada componente claramente. "
            base += "4. Relacioná los conceptos con situaciones cotidianas que los adolescentes entiendan. "
            base += "5. Podés usar terminología técnica pero siempre con una explicación. "
            base += "6. Las respuestas deben ser completas pero no excesivamente largas. "
            base += "7. NO uses modismos informales ni jerga de internet. Mantené un tono respetuoso y profesional. "
        elif self.education_level == "superior":
            base += "Estás hablando con estudiantes universitarios y profesionales. "
            base += "REGLAS IMPORTANTES: "
            base += "1. Usá un lenguaje académico formal apropiado para nivel universitario. "
            base += "2. Podés usar terminología técnica avanzada: inferencia, estimadores, distribuciones muestrales, etc. "
            base += "3. Explicá con rigor matemático usando notación estándar (LaTeX). "
            base += "4. Incluí fórmulas cuando sea relevante, explicando cada componente. "
            base += "5. Hacé referencia a conceptos como: pruebas de hipótesis, intervalos de confianza, regresión, correlación, ANOVA, distribuciones de probabilidad. "
            base += "6. Discutí supuestos, limitaciones y consideraciones metodológicas. "
            base += "7. Mantené un tono profesional y académico, sin modismos informales. "
            base += "8. Las respuestas pueden ser más extensas y detalladas si el tema lo requiere. "
        else:
            base += "Usá terminología técnica cuando sea apropiado, pero siempre explicá el razonamiento. "
            base += "Mantené un nivel académico apropiado con notación matemática estándar."
        
        return base
    
    async def chat(self, user_message: str, session_id: str) -> str:
        try:
            chat = LlmChat(
                api_key=EMERGENT_API_KEY,
                session_id=session_id,
                system_message=self.system_message
            ).with_model("openai", "gpt-5.1")
            
            message = UserMessage(text=user_message)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            return f"Lo siento, tuve un problema: {str(e)}"

class ReportGenerator:
    @staticmethod
    async def generate_report(project_data: dict, education_level: str) -> str:
        try:
            if education_level == "primario":
                latex_example = r"$\text{Media} = \frac{\text{Suma}}{\text{Cantidad}}$"
                prompt = f"""
Generá un reporte estadístico educativo en español argentino para estudiantes de nivel primario (6 a 12 años).

Datos del proyecto:
- Nombre: {project_data.get('name', 'Sin nombre')}
- Tipo de análisis: {project_data.get('analysisType', 'univariado')}
- Variables: {project_data.get('variables', [])}
- Datos: {project_data.get('sampleData', [])}
- Estadísticas calculadas: {project_data.get('statistics', {})}

IMPORTANTE: Este reporte es PARA LOS ESTUDIANTES, no para el docente.
- Extensión: 10-15 oraciones simples (podés usar más si es necesario para explicar bien)
- Palabras simples que un niño entienda
- Sin modismos: 'che', 'piola', 'copado'
- Tono amable y respetuoso
- Ejemplos con cosas que los niños conocen
- PRIORIDAD: que se comprenda bien el concepto, no acortar por acortar

Estructura:
1. **¿Qué estudiamos?** (2-3 oraciones explicando el proyecto)
2. **¿Qué descubrimos?** (4-6 oraciones con los números más importantes y qué significan)
3. **¿Qué aprendimos?** (3-4 oraciones explicando la conclusión de forma clara)
4. **¿Por qué es importante?** (1-2 oraciones conectando con la vida real)

Podés usar:
- **Markdown** para dar formato (negritas, listas, etc.)
- **LaTeX** para fórmulas: usa $formula$ para inline y $$formula$$ para display
- Explicá las fórmulas en palabras simples

Ejemplo: {latex_example}
"""
            elif education_level == "secundario":
                prompt = f"""
Generá un reporte estadístico educativo completo en español argentino para estudiantes de nivel secundario (13 a 17 años).

Datos del proyecto:
- Nombre del proyecto: {project_data.get('name', 'Sin nombre')}
- Tipo de análisis: {project_data.get('analysisType', 'univariado')}
- Variables analizadas: {project_data.get('variables', [])}
- Muestra de datos: {project_data.get('sampleData', [])}
- Estadísticas calculadas: {project_data.get('statistics', {})}

IMPORTANTE: Este reporte es PARA LOS ESTUDIANTES, no para el docente.

REGLAS DE ESTILO:
- Lenguaje académico pero accesible para adolescentes
- NO uses modismos informales (che, piola, copado, etc.)
- Tono respetuoso y profesional
- Explicaciones claras y completas
- Conectá los resultados con el contexto/temática del proyecto

ESTRUCTURA DEL REPORTE:

## 1. Introducción
Describí brevemente qué se está analizando y por qué es relevante (2-3 oraciones).

## 2. Descripción de los Datos
- Identificá el tipo de variable(s) (cualitativa nominal/ordinal, cuantitativa discreta/continua)
- Mencioná la cantidad de datos (n)
- Describí brevemente la distribución

## 3. Análisis de Resultados
- Interpretá las medidas de tendencia central (media, mediana, moda) en el contexto del proyecto
- Si hay medidas de dispersión, explicá qué nos dicen sobre la variabilidad
- Hacé una lectura crítica de los gráficos (si fueron generados)

## 4. Conclusiones
- Sintetizá los hallazgos principales
- Relacioná con la temática/contexto del proyecto
- Sugerí posibles interpretaciones o decisiones basadas en los datos

## 5. Reflexión
- Una breve reflexión sobre qué podemos aprender de estos datos
- Posibles limitaciones o consideraciones adicionales

Usá:
- **Markdown** para formato (negritas, listas, encabezados)
- **LaTeX** para fórmulas: $formula$ para inline y $$formula$$ para display
- Ejemplo de fórmula: $\\bar{{x}} = \\frac{{\\sum x_i}}{{n}}$

El reporte debe tener aproximadamente 15-20 oraciones en total.
"""
            elif education_level == "superior":
                prompt = f"""
Generá un informe estadístico académico completo en español argentino para estudiantes universitarios y profesionales.

Datos del proyecto:
- Nombre del proyecto: {project_data.get('name', 'Sin nombre')}
- Tipo de análisis: {project_data.get('analysisType', 'univariado')}
- Variables analizadas: {project_data.get('variables', [])}
- Muestra de datos: {project_data.get('sampleData', [])}
- Estadísticas calculadas: {project_data.get('statistics', {})}

IMPORTANTE: Este informe es para nivel universitario/profesional.

REGLAS DE ESTILO:
- Lenguaje académico formal
- Notación matemática rigurosa con LaTeX
- Referencias a conceptos estadísticos avanzados
- Discusión de supuestos y limitaciones
- Tono profesional sin modismos informales

ESTRUCTURA DEL INFORME:

## 1. Resumen Ejecutivo
Síntesis de objetivos, metodología y hallazgos principales (2-3 oraciones).

## 2. Introducción y Contexto
- Descripción del problema o pregunta de investigación
- Relevancia del análisis
- Variables involucradas y sus tipos (escala de medición)

## 3. Metodología Estadística
- Descripción de los métodos estadísticos utilizados
- Justificación de la elección metodológica
- Supuestos del modelo y verificación de los mismos

## 4. Análisis Descriptivo
- Medidas de tendencia central con interpretación
- Medidas de dispersión y variabilidad
- Análisis de forma de la distribución (asimetría, curtosis si aplica)
- Fórmulas relevantes: $\\bar{{x}} = \\frac{{\\sum x_i}}{{n}}$, $s^2 = \\frac{{\\sum(x_i - \\bar{{x}})^2}}{{n-1}}$

## 5. Análisis Inferencial (si aplica)
- Intervalos de confianza
- Pruebas de hipótesis realizadas
- Interpretación de p-valores y decisiones estadísticas
- Análisis de correlación/regresión si corresponde

## 6. Resultados y Discusión
- Interpretación de los hallazgos en contexto
- Comparación con valores esperados o teóricos
- Implicaciones prácticas de los resultados

## 7. Limitaciones
- Limitaciones del estudio
- Posibles sesgos o fuentes de error
- Consideraciones sobre generalización

## 8. Conclusiones
- Síntesis de hallazgos principales
- Recomendaciones basadas en evidencia
- Sugerencias para investigaciones futuras

Usá:
- **Markdown** para formato
- **LaTeX** para fórmulas matemáticas
- Notación estadística estándar

El informe debe ser completo y riguroso, aproximadamente 25-35 oraciones.
"""
            else:
                prompt = f"""
Generá un reporte estadístico educativo en español argentino para nivel {education_level}.

Datos del proyecto:
- Nombre: {project_data.get('name', 'Sin nombre')}
- Tipo de análisis: {project_data.get('analysisType', 'univariado')}
- Variables: {project_data.get('variables', [])}
- Datos: {project_data.get('sampleData', [])}
- Estadísticas calculadas: {project_data.get('statistics', {})}

El reporte debe incluir:
1. Descripción del dataset
2. Identificación de variables (tipo, naturaleza)
3. Resultados estadísticos principales
4. Interpretación de los resultados
5. Conclusiones educativas
6. Errores comunes de interpretación a evitar
7. Recomendaciones pedagógicas

Adaptá el lenguaje al nivel educativo. No uses modismos informales.
"""
            
            chat = LlmChat(
                api_key=EMERGENT_API_KEY,
                session_id=f"report_{project_data.get('id', 'temp')}",
                system_message="Sos una experta en estadística educativa que genera reportes claros y pedagógicos en español argentino. Usás un tono formal, amable y respetuoso. Nunca usás modismos informales."
            ).with_model("openai", "gpt-5.1")
            
            message = UserMessage(text=prompt)
            response = await chat.send_message(message)
            return response
        except Exception as e:
            return f"Error generando reporte: {str(e)}"