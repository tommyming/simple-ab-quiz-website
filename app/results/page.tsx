"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Home } from "lucide-react"
import { Progress } from "@/components/ui/progress"

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

export default function ResultsPage() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [title, setTitle] = useState("Your Quiz Title")

  useEffect(() => {
    const savedQuestions = localStorage.getItem("abQuestions")
    if (savedQuestions) {
      setQuestions(JSON.parse(savedQuestions))
    }

    const savedTitle = localStorage.getItem("quizTitle")
    if (savedTitle) {
      setTitle(savedTitle)
    }
  }, [])

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
          </div>
        </div>

        {questions.length === 0 ? (
          <Card className="w-full p-6 text-center">
            <CardContent>
              <h2 className="text-xl font-medium mb-4">No questions available</h2>
              <Button asChild>
                <Link href="/create">Create Questions</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="w-full space-y-6">
            {questions.map((question) => {
              const totalVotes = getTotalVotes(question)
              const percentA = getPercentage(question, "A")
              const percentB = getPercentage(question, "B")

              return (
                <Card key={question.id} className="w-full">
                  <CardHeader className="pb-2">
                    <CardTitle>{question.question}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white font-bold mr-2">
                            A
                          </div>
                          <span>{question.optionA}</span>
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
                          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold mr-2">
                            B
                          </div>
                          <span>{question.optionB}</span>
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
