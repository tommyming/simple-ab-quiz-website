"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList } from 'recharts'

interface Question {
  id: string
  question: string
  optionA: string
  optionB: string
  votes?: {
    optionA: number
    optionB: number
  }
  selectedOption?: "A" | "B" | null
}

const CHARACTERISTIC_PAIRS = [
  "Collaborative vs Independent",
  "Detail-oriented vs Big-picture thinker",
  "Proactive vs Reactive",
  "Flexible vs Structured",
  "Risk-taker vs Risk-averse",
  "Specialist vs Generalist",
  "Analytical vs Creative",
  "Fast-paced vs Methodical",
  "Introverted vs Extroverted",
  "Process-driven vs Results-driven"
]

export default function ResultsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [title, setTitle] = useState("Your Quiz Title")
  const [analysis, setAnalysis] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedQuestions = localStorage.getItem("abQuestions")
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions))
    } else {
      // Fetch from API if not in localStorage
      fetch("/api/questions")
        .then((res) => res.json())
        .then((data) => {
          setQuestions(data)
          localStorage.setItem("abQuestions", JSON.stringify(data))
        })
    }

    const savedTitle = localStorage.getItem("quizTitle")
    if (savedTitle) {
      setTitle(savedTitle)
    }
  }, [])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setAnalysis([])
    try {
      // Collect answers for each question (A or B)
      const answers = questions.map(q => {
        if (q.selectedOption === "A") return q.optionA
        if (q.selectedOption === "B") return q.optionB
        return "No answer"
      })
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions,
          answers,
          characteristics: CHARACTERISTIC_PAIRS
        })
      })
      if (!res.ok) throw new Error("Failed to analyze")
      const data = await res.json()
      setAnalysis(data)
    } catch (e: any) {
      setError(e.message || "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Calculate total votes for a question
  const getTotalVotes = (question: Question) => {
    if (!question.votes) return 0
    return question.votes.optionA + question.votes.optionB
  }

  // Calculate percentage for an option
  const getPercentage = (question: Question, option: "A" | "B") => {
    if (!question.votes) return 0
    const total = getTotalVotes(question)
    if (total === 0) return 0

    const votes = option === "A" ? question.votes.optionA : question.votes.optionB
    return Math.round((votes / total) * 100)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center space-y-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-3xl font-bold">{title} Results</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="icon">
              <Link href="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/display">Back to Display</Link>
            </Button>
            <Button onClick={handleAnalyze} disabled={loading} variant="default">
              {loading ? "Analyzing..." : "Analyze with AI"}
            </Button>
          </div>
        </div>

        {error && <div className="text-red-500">{error}</div>}

        {questions.length === 0 ? (
          <Card className="w-full p-6 text-center">
            <CardContent>
              <h2 className="text-xl font-medium mb-4">No questions available</h2>
              <Button asChild>
                <Link href="/create">Create Questions</Link>
              </Button>
            </CardContent>
          </Card>
        ) : analysis.length > 0 ? (
          <div className="w-full space-y-10">
            {questions.map((question, idx) => (
              <Card key={question.id} className="w-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-2xl md:text-4xl font-bold">{question.question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {analysis[idx] && (
                    <ResponsiveContainer width="100%" height={80}>
                      <BarChart
                        layout="vertical"
                        data={Object.entries(analysis[idx]).map(([k, v]) => ({ name: k, value: v }))}
                        margin={{ left: 40, right: 40 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis type="category" dataKey="name" width={120} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#6366f1">
                          <LabelList dataKey="value" position="right" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="w-full space-y-6">
            {questions.map((question) => {
              const totalVotes = getTotalVotes(question)
              const percentA = getPercentage(question, "A")
              const percentB = getPercentage(question, "B")

              return (
                <Card key={question.id} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl md:text-4xl font-bold">{question.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-3 text-xl md:text-2xl">
                            A
                          </div>
                          <span className="text-lg md:text-2xl font-semibold">{question.optionA}</span>
                        </div>
                        <span className="font-medium">
                          {question.votes?.optionA || 0} votes ({percentA}%)
                        </span>
                      </div>
                      <Progress value={percentA} className="h-2 bg-gray-200" indicatorClassName="bg-red-500" />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-3 text-xl md:text-2xl">
                            B
                          </div>
                          <span className="text-lg md:text-2xl font-semibold">{question.optionB}</span>
                        </div>
                        <span className="font-medium">
                          {question.votes?.optionB || 0} votes ({percentB}%)
                        </span>
                      </div>
                      <Progress value={percentB} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />
                    </div>

                    <div className="text-sm text-muted-foreground text-center">Total votes: {totalVotes}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
