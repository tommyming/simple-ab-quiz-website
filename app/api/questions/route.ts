import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  const filePath = path.join(process.cwd(), 'questions.txt')
  const fileContent = await fs.readFile(filePath, 'utf-8')
  const lines = fileContent.split('\n').filter(Boolean)

  // Parse each line into question, optionA, optionB
  const questions = lines.map((line, idx) => {
    // Format: Would you rather A or B?
    const match = line.match(/^Would you rather (.+) or (.+)\?$/i)
    if (!match) {
      return null
    }
    return {
      id: (idx + 1).toString(),
      question: line,
      optionA: match[1].trim(),
      optionB: match[2].trim(),
      selectedOption: null,
      votes: { optionA: 0, optionB: 0 },
    }
  }).filter(Boolean)

  return NextResponse.json(questions)
} 