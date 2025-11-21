import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { questions, answers, characteristics } = await req.json()
  console.log("Received questions:", questions)
  console.log("Received answers:", answers)
  // Prepare prompt for Azure OpenAI
  const prompt = `You MUST analyze ALL of the following answers COLLECTIVELY and return ONLY a valid JSON object with scores for each characteristic pair. 

Your response must ONLY contain a JSON object and NOTHING ELSE - no explanations, markdown formatting, or extra text. The JSON must be valid and parseable.

For each characteristic, provide a score with ONE decimal place (e.g. 60.5, 39.5) where each pair adds up to 100.0.

ONLY return a JSON object in this exact format:
{
  "Flexible": 60.5, 
  "Structured": 39.5, 
  "Collaborative": 70.3, 
  "Independent": 29.7,
  ... other characteristics ...
}

Questions and Answers:
${questions.map((q: any, i: number) => `Q: ${q.question}\nA: ${answers[i]}`).join('\n')}

Characteristic pairs (each pair must add up to 100.0):
${characteristics.map((c: string) => c).join('\n')}`

  console.log("Characteristic pairs being analyzed:", characteristics)

  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiBase = process.env.AZURE_OPENAI_API_BASE_URL
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o-mini"

  const url = `${apiBase}/${deployment}/chat/completions?api-version=${apiVersion}`

  const headers = new Headers({
    'Content-Type': 'application/json',
    'api-key': apiKey || '',
  })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are an expert in analyzing behavioral characteristics of software engineers. You MUST return ONLY valid JSON without any explanations or extra text. Do not include markdown code blocks, backticks, or comments in your response.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.2,
      response_format: { type: "json_object" }
    }),
  })

  if (!response.ok) {    
    console.log(response)
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 })
  }

  const data = await response.json()
  
  // Extract the JSON from the model's response
  let scores = {}  // Changed from array to object
  try {
    let text = data.choices[0].message.content

    // Remove Markdown code block markers (``` or ```json)
    text = text.replace(/```(?:json)?/gi, '').trim()
    
    // First try to parse the text directly
    try {
      scores = JSON.parse(text)
      console.log("Parsed scores directly:", scores)
    } catch (directParseError) {
      // If direct parsing fails, try to extract the object using regex
      console.log("Direct parsing failed, trying regex extraction")
      const match = text.match(/\{[\s\S]*?\}/)
      if (match) {
        scores = JSON.parse(match[0])
        console.log("Extracted scores using regex:", scores)
      } else {
        console.log("No JSON object found in response:", text)
        return NextResponse.json({ error: 'No JSON object found in response' }, { status: 500 })
      }
    }
  } catch (e) {
    console.log("Error parsing response:", e)
    return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
  }

  return NextResponse.json(scores)
} 