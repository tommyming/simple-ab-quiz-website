"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export default function CreateQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [newQuestion, setNewQuestion] = useState("")
  const [optionA, setOptionA] = useState("")
  const [optionB, setOptionB] = useState("")
  const [title, setTitle] = useState("Your Quiz Title")
  const { toast } = useToast()

  // Load questions from localStorage on component mount
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

  // Save questions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("abQuestions", JSON.stringify(questions))
  }, [questions])

  const handleAddQuestion = () => {
    if (!newQuestion || !optionA || !optionB) {
      toast({
        title: "Missing information",
        description: "Please fill in the question and both options",
        variant: "destructive",
      })
      return
    }

    const newQuestionObj: Question = {
      id: Date.now().toString(),
      question: newQuestion,
      optionA,
      optionB,
      selectedOption: null,
    }

    setQuestions([...questions, newQuestionObj])
    setNewQuestion("")
    setOptionA("")
    setOptionB("")

    toast({
      title: "Question added",
      description: "Your question has been added successfully",
    })
  }

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
    toast({
      title: "Question deleted",
      description: "Your question has been removed",
    })
  }

  const clearAllQuestions = () => {
    if (window.confirm("Are you sure you want to delete all questions? This cannot be undone.")) {
      setQuestions([])
      localStorage.removeItem("abQuestions")
      toast({
        title: "All questions cleared",
        description: "All your questions have been removed",
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center space-y-8 max-w-3xl mx-auto">
        <div className="flex items-center justify-between w-full">
          <h1 className="text-3xl font-bold">{title}</h1>
          <Button asChild variant="outline">
            <Link href="/">Back to Home</Link>
          </Button>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Add a New Question</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                placeholder="Enter your question..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="optionA">Option A</Label>
                <Input
                  id="optionA"
                  placeholder="First option..."
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="optionB">Option B</Label>
                <Input
                  id="optionB"
                  placeholder="Second option..."
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAddQuestion} className="w-full">
              Add Question
            </Button>
          </CardFooter>
        </Card>

        <div className="w-full">
          <h2 className="text-2xl font-bold mb-4">Your Questions</h2>
          {questions.length === 0 ? (
            <Card className="p-6 text-center text-muted-foreground">
              No questions added yet. Add your first question above.
            </Card>
          ) : (
            <div className="space-y-4">
              {questions.map((q) => (
                <Card key={q.id} className="w-full">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4 w-full">
                        <div>
                          <h3 className="text-xl font-medium">{q.question}</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-muted rounded-md">
                            <span className="font-semibold">A:</span> {q.optionA}
                          </div>
                          <div className="p-3 bg-muted rounded-md">
                            <span className="font-semibold">B:</span> {q.optionB}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-5 w-5" />
                        <span className="sr-only">Delete question</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {questions.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-3 justify-between">
              <Button variant="destructive" onClick={clearAllQuestions}>
                Clear All Questions
              </Button>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/results">View Results</Link>
                </Button>
                <Button asChild>
                  <Link href="/display">Display Questions</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
