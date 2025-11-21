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
  const [analysis, setAnalysis] = useState<Record<string, number> | null>(null)
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
    
    // Check for analysis results in localStorage
    const savedAnalysis = localStorage.getItem("aiAnalysis")
    if (savedAnalysis) {
      try {
        setAnalysis(JSON.parse(savedAnalysis))
      } catch (e) {
        console.error("Failed to parse saved analysis:", e)
      }
    }
  }, [])

  const handleAnalyze = async () => {
    setLoading(true)
    setError(null)
    setAnalysis(null)
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
          <h1 className="text-3xl font-bold">Codeaholics Guests Are:</h1>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="icon">
              <Link href="/">
                <Home className="h-5 w-5" />
                <span className="sr-only">Home</span>
              </Link>
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
        ) : analysis ? (
          <div className="w-full space-y-10">
            {/* Visualize characteristic pairs as progress bars */}
            {(() => {
              console.log("Analysis data:", analysis);
              
              // For each pair, calculate and render a progress bar
              return CHARACTERISTIC_PAIRS.map((pair) => {
                const [left, right] = pair.split(" vs ").map(s => s.trim());
                console.log(`Processing pair: ${left} vs ${right}`);
                
                // Get scores from analysis (or use default if missing)
                const leftScore = analysis[left] || 50.0;
                const rightScore = analysis[right] || (100.0 - leftScore);
                
                // Ensure the values add up to 100.0
                const total = leftScore + rightScore;
                let finalLeftScore = leftScore;
                let finalRightScore = rightScore;
                
                if (Math.abs(total - 100.0) > 0.1) {
                  // If the total is not close to 100, normalize
                  finalLeftScore = +(leftScore / total * 100).toFixed(1);
                  finalRightScore = +(100 - finalLeftScore).toFixed(1);
                }
                
                console.log(`${left}: ${finalLeftScore}, ${right}: ${finalRightScore}`);

                return (
                  <Card key={pair} className="w-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-2xl md:text-4xl font-bold">
                        <span className={finalLeftScore > finalRightScore ? "text-sky-500" : ""}>
                          {left}
                        </span>
                        {" vs "}
                        <span className={finalRightScore > finalLeftScore ? "text-emerald-500" : ""}>
                          {right}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between mb-1">
                        <span className={`font-semibold ${finalLeftScore > finalRightScore ? "text-sky-500 font-bold" : ""}`}>
                          {left} ({finalLeftScore})
                        </span>
                        <span className={`font-semibold ${finalRightScore > finalLeftScore ? "text-emerald-500 font-bold" : ""}`}>
                          {right} ({finalRightScore})
                        </span>
                      </div>
                      <div className="w-full h-6 bg-gray-200 rounded-full flex overflow-hidden">
                        <div
                          className="bg-sky-400 h-full"
                          style={{ width: `${finalLeftScore}%` }}
                          title={`${left}: ${finalLeftScore}%`}
                        />
                        <div
                          className="bg-emerald-400 h-full"
                          style={{ width: `${finalRightScore}%` }}
                          title={`${right}: ${finalRightScore}%`}
                        />
                      </div>
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>{finalLeftScore}%</span>
                        <span>{finalRightScore}%</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              });
            })()}
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
