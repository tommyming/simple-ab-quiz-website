import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { questions, answers, characteristics } = await req.json()

  // Prepare prompt for Azure OpenAI
  const prompt = `Given the following questions, answers, and characteristic pairs, analyze each answer and return a score (0-100) for each characteristic in the pair for each question. Respond in JSON array format, one object per question, e.g. [{"Flexible":80,"Structured":20}, ...].\n\nQuestions and Answers:\n${questions.map((q: any, i: number) => `Q: ${q.question}\nA: ${answers[i]}`).join('\n')}\n\nCharacteristic pairs:\n${characteristics.map((c: string) => c).join('\n')}`

  const apiKey = process.env.AZURE_OPENAI_API_KEY
  const apiBase = process.env.AZURE_OPENAI_API_BASE_URL
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-35-turbo'

  const url = `${apiBase}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`

  const headers = new Headers({
    'Content-Type': 'application/json',
    'api-key': apiKey || '',
  })

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'You are an expert in analyzing behavioral characteristics of software engineers.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 512,
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 })
  }

  const data = await response.json()
  // Extract the JSON from the model's response
  let scores = []
  try {
    const text = data.choices[0].message.content
    scores = JSON.parse(text)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to parse response' }, { status: 500 })
  }

  return NextResponse.json(scores)
} 