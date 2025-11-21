"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Home } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"

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

// Import characteristic pairs for analysis
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

export default function DisplayQuestions() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const isMobile = useMobile()
  const [title, setTitle] = useState("Your Quiz Title")
  const router = useRouter()

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

  // Save questions to localStorage whenever they change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("abQuestions", JSON.stringify(questions))
    }
  }, [questions])

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Handle analyze - triggers AI analysis and redirects to results
  const handleAnalyze = async () => {
    setLoading(true)
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
      
      // Store analysis results in localStorage so results page can access them
      localStorage.setItem("aiAnalysis", JSON.stringify(data))
      
      // Navigate to results page
      router.push("/results")
    } catch (error) {
      console.error("Analysis failed:", error)
      // Navigate to results page anyway, the error will be shown there
      router.push("/results")
    } finally {
      setLoading(false)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
            <p className="mb-6">You haven't created any questions yet.</p>
            <Button asChild>
              <Link href="/create">Create Questions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  const handleVote = (option: "A" | "B") => {
    const updatedQuestions = [...questions]
    const currentSelectedOption = updatedQuestions[currentIndex].selectedOption

    // Initialize votes if they don't exist
    if (!updatedQuestions[currentIndex].votes) {
      updatedQuestions[currentIndex].votes = { optionA: 0, optionB: 0 }
    }

    // If the same option is clicked again, do nothing
    if (currentSelectedOption === option) {
      return
    }

    // If the other option was previously selected, decrement its vote count
    if (currentSelectedOption) {
      if (currentSelectedOption === "A") {
        updatedQuestions[currentIndex].votes!.optionA = Math.max(0, updatedQuestions[currentIndex].votes!.optionA - 1)
      } else {
        updatedQuestions[currentIndex].votes!.optionB = Math.max(0, updatedQuestions[currentIndex].votes!.optionB - 1)
      }
    }

    // Increment the vote count for the selected option
    if (option === "A") {
      updatedQuestions[currentIndex].votes!.optionA += 1
    } else {
      updatedQuestions[currentIndex].votes!.optionB += 1
    }

    // Update the selected option
    updatedQuestions[currentIndex].selectedOption = option

    setQuestions(updatedQuestions)

    // Go to next question if not last
    if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href="/">
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Link>
          </Button>
          <Button 
            variant="outline"
            onClick={handleAnalyze}
            disabled={loading}
          >
            {loading ? "Analyzing..." : "Analyze"}
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {title}: Question {currentIndex + 1} of {questions.length}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-4/5">
          <Card className="p-8 md:p-20 border-0 shadow-none">
            <CardContent className="p-0 flex flex-col items-center text-center space-y-10">
              <h2 className="text-3xl md:text-6xl font-bold">{currentQuestion.question}</h2>

              <div className={`grid ${isMobile ? "grid-rows-2 gap-10" : "grid-cols-2 gap-20"} w-full mt-10`}>
                <button
                  onClick={() => handleVote("A")}
                  className={`flex flex-col items-center justify-center p-10 md:p-16 text-2xl md:text-4xl font-semibold
                    ${
                      currentQuestion.selectedOption === "A"
                        ? "bg-red-500 text-white"
                        : "bg-transparent text-gray-800 hover:bg-gray-100"
                    } 
                    rounded-2xl border-4 ${
                      currentQuestion.selectedOption === "A" ? "border-red-600" : "border-gray-300"
                    } min-h-[200px] md:min-h-[300px] transition-colors`}
                >
                  <span className="text-4xl md:text-6xl font-bold">{currentQuestion.optionA}</span>
                </button>
                <button
                  onClick={() => handleVote("B")}
                  className={`flex flex-col items-center justify-center p-10 md:p-16 text-2xl md:text-4xl font-semibold
                    ${
                      currentQuestion.selectedOption === "B"
                        ? "bg-blue-500 text-white"
                        : "bg-transparent text-gray-800 hover:bg-gray-100"
                    } 
                    rounded-2xl border-4 ${
                      currentQuestion.selectedOption === "B" ? "border-blue-600" : "border-gray-300"
                    } min-h-[200px] md:min-h-[300px] transition-colors`}
                >
                  <span className="text-4xl md:text-6xl font-bold">{currentQuestion.optionB}</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 flex justify-between">
        <Button onClick={handlePrevious} disabled={currentIndex === 0} variant="outline" size="lg">
          <ChevronLeft className="mr-2 h-5 w-5" /> Previous
        </Button>
        <Button onClick={handleNext} disabled={currentIndex === questions.length - 1} variant="outline" size="lg">
          Next <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
