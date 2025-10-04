import { consumeStream, convertToModelMessages, streamText, type UIMessage } from "ai"
import { google } from "@ai-sdk/google"

export const maxDuration = 30

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()

  const prompt = convertToModelMessages(messages)

  const result = await streamText({
    model: google("models/gemini-2.0-flash"),
    prompt,
    system: `Eres un asistente especializado en análisis de áreas afectadas por incendios forestales. 
    Tu función es ayudar a los usuarios a entender las características de lugares donde ya ha pasado el fuego.
    
    Puedes ayudar con:
    - Análisis de regeneración vegetal post-incendio 
    - Evaluación de riesgos de erosión del suelo
    - Identificación de especies que pueden recolonizar el área
    - Recomendaciones para la restauración del ecosistema
    - Análisis de la calidad del suelo después del fuego
    - Evaluación de la fauna que puede regresar al área
    
    Responde siempre en español y de manera clara y técnica, pero accesible para diferentes niveles de conocimiento.`,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    onFinish: async ({ isAborted }) => {
      if (isAborted) {
        console.log("Chat aborted")
      }
    },
    consumeSseStream: consumeStream,
  })
}
