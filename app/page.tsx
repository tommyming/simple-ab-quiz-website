"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight, Settings, Trash2 } from "lucide-react"
import { useMobile } from "@/hooks/use-mobile"
import { useRouter } from "next/navigation"
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

export default function Home() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useMobile()
  const [title, setTitle] = useState("Your Quiz Title")
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true)
      const savedQuestions = localStorage.getItem("abQuestions")
      
      if (savedQuestions) {
        const parsedQuestions = JSON.parse(savedQuestions);
        setQuestions(parsedQuestions);
        
        // Find the first unanswered question index
        const firstUnansweredIndex = findFirstUnansweredQuestionIndex(parsedQuestions);
        setCurrentIndex(firstUnansweredIndex);
      } else {
        // Fetch questions from the API endpoint that reads questions.txt
        try {
          const res = await fetch("/api/questions")
          if (!res.ok) throw new Error("Failed to fetch questions")
          const data = await res.json()
          setQuestions(data)
          localStorage.setItem("abQuestions", JSON.stringify(data))
          
          // For fresh questions, start at first question (they're all unanswered)
          setCurrentIndex(0);
        } catch (error) {
          console.error("Error loading questions:", error)
          toast({
            title: "Error loading questions",
            description: "Could not load questions from the server.",
            variant: "destructive",
          })
          setQuestions([])
        }
      }
      
      const savedTitle = localStorage.getItem("quizTitle")
      if (savedTitle) {
        setTitle(savedTitle)
      }
      
      setIsLoading(false)
    }
    
    loadQuestions()
  }, [toast])

  // Save questions to localStorage whenever they change
  useEffect(() => {
    if (questions.length > 0) {
      localStorage.setItem("abQuestions", JSON.stringify(questions))
    }
  }, [questions])

  // Find the first unanswered question index
  const findFirstUnansweredQuestionIndex = (questionsList: Question[]) => {
    const unansweredIndex = questionsList.findIndex(q => q.selectedOption === undefined || q.selectedOption === null);
    // If all questions are answered, return index 0
    return unansweredIndex === -1 ? 0 : unansweredIndex;
  };

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
      // Filter out questions without answers
      const answeredQuestions = questions.filter(q => q.selectedOption !== null);
      
      // Check if we have any answered questions
      if (answeredQuestions.length === 0) {
        toast({
          title: "No answered questions",
          description: "Please answer at least one question before analyzing",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Collect answers for answered questions only
      const filteredAnswers = answeredQuestions.map(q => {
        if (q.selectedOption === "A") return q.optionA;
        if (q.selectedOption === "B") return q.optionB;
        return "No answer"; // Should never reach here due to filter
      });
      
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questions: answeredQuestions,
          answers: filteredAnswers,
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

  // Handle clearing answers/votes while keeping questions
  const handleClearAnswers = async () => {
    setLoading(true);
    
    try {
      // Fetch fresh questions from the API
      const res = await fetch("/api/questions");
      if (!res.ok) throw new Error("Failed to fetch questions");
      const freshQuestions = await res.json();
      
      // Set the fresh questions with no selections/votes
      setQuestions(freshQuestions);
      localStorage.setItem("abQuestions", JSON.stringify(freshQuestions));
      
      // Also clear any stored analysis
      localStorage.removeItem("aiAnalysis");
      
      // After reset, always start at the first question (index 0)
      // since all questions are now unanswered
      setCurrentIndex(0);
      
      // Show toast to guide user
      toast({
        title: "All answers have been reset",
        description: "Please answer each question again by selecting option A or B",
      });
      
      // Add visual cue/animation to the options to attract attention
      const optionsContainer = document.querySelector('[class*="grid-cols-2"]');
      if (optionsContainer) {
        optionsContainer.classList.add('animate-pulse');
        setTimeout(() => {
          optionsContainer?.classList.remove('animate-pulse');
        }, 1500);
      }
    } catch (error) {
      console.error("Error resetting questions:", error);
      toast({
        title: "Error resetting questions",
        description: "Could not reset the questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Show loading state while questions are being loaded
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent className="p-6 flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
            <h2 className="text-xl font-medium">Loading questions...</h2>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full text-center p-6">
          <CardContent>
            <h1 className="text-2xl font-bold mb-4">No Questions Available</h1>
            <p className="mb-6">Could not load questions from questions.txt. Please check that the file exists and is properly formatted.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild>
                <Link href="/create">Create Questions</Link>
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry Loading
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  // Format question to replace options with blank space
  const formatQuestionWithBlank = (question: string) => {
    // Match "Would you rather A or B?" pattern
    return question.replace(/(.+) or (.+)\?$/i, (match, p1, p2) => {
      // Find the longer option to determine blank size
      const maxLength = Math.max(p1.length, p2.length);
      // Create underscores based on length (minimum 10, maximum 20)
      const blankLength = Math.min(Math.max(maxLength, 10), 20);
      const blank = '____________'.substring(0, blankLength);
      return `Would you rather <span class="relative inline-block mx-1">
                <span class="invisible">${blank}</span>
                <span class="absolute bottom-0 left-0 right-0 h-px bg-current"></span>
              </span> ?`;
    });
  }

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

    // Find the next unanswered question
    const nextUnansweredIndex = findFirstUnansweredQuestionIndex(updatedQuestions);
    
    // If we found an unanswered question that's not the current one, go to it
    if (nextUnansweredIndex !== currentIndex) {
      setTimeout(() => setCurrentIndex(nextUnansweredIndex), 200);
    } 
    // Otherwise, if there are more questions, go to the next one
    else if (currentIndex < questions.length - 1) {
      setTimeout(() => setCurrentIndex(currentIndex + 1), 200);
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href="/create">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Create/Edit</span>
            </Link>
          </Button>
          <Button 
            variant="outline"
            onClick={handleClearAnswers}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Reset
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
            <CardContent className="p-0 flex flex-col items-center space-y-10">
              <h2 
                className="text-3xl md:text-6xl font-bold text-left w-full"
                dangerouslySetInnerHTML={{ __html: formatQuestionWithBlank(currentQuestion.question) }}
              ></h2>

              <div className={`grid ${isMobile ? "grid-rows-2 gap-10" : "grid-cols-2 gap-20"} w-full mt-10`}>
                <button
                  onClick={() => handleVote("A")}
                  className={`flex flex-col items-center justify-center p-10 md:p-16 text-2xl md:text-4xl font-semibold
                    ${
                      currentQuestion.selectedOption === "A"
                        ? "bg-red-500 text-white"
                        : "bg-transparent hover:bg-red-500 hover:text-white"
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
                        : "bg-transparent hover:bg-blue-500 hover:text-white"
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
