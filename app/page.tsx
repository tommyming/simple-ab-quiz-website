"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Pencil, Check, X } from "lucide-react"

export default function Home() {
  const [title, setTitle] = useState("Your Quiz Title")
  const [subtitle, setSubtitle] = useState("The description of your quiz is here.")
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingSubtitle, setEditingSubtitle] = useState(false)
  const [tempTitle, setTempTitle] = useState("")
  const [tempSubtitle, setTempSubtitle] = useState("")

  // Load title and subtitle from localStorage on component mount
  useEffect(() => {
    const savedTitle = localStorage.getItem("quizTitle")
    const savedSubtitle = localStorage.getItem("quizSubtitle")

    if (savedTitle) setTitle(savedTitle)
    if (savedSubtitle) setSubtitle(savedSubtitle)
  }, [])

  // Save title and subtitle to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("quizTitle", title)
    localStorage.setItem("quizSubtitle", subtitle)
  }, [title, subtitle])

  const handleEditTitle = () => {
    setTempTitle(title)
    setEditingTitle(true)
  }

  const handleEditSubtitle = () => {
    setTempSubtitle(subtitle)
    setEditingSubtitle(true)
  }

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setTitle(tempTitle)
    }
    setEditingTitle(false)
  }

  const handleSaveSubtitle = () => {
    if (tempSubtitle.trim()) {
      setSubtitle(tempSubtitle)
    }
    setEditingSubtitle(false)
  }

  const handleCancelTitle = () => {
    setEditingTitle(false)
  }

  const handleCancelSubtitle = () => {
    setEditingSubtitle(false)
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center space-y-8 text-center">
        <div className="relative">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempTitle}
                onChange={(e) => setTempTitle(e.target.value)}
                className="text-2xl font-bold text-center min-w-[300px]"
                autoFocus
                placeholder="Your Quiz Title"
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={handleSaveTitle}>
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Save</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelTitle}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="group relative inline-block">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
              <Button
                size="icon"
                variant="ghost"
                className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditTitle}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit title</span>
              </Button>
            </div>
          )}
        </div>

        <div className="relative">
          {editingSubtitle ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempSubtitle}
                onChange={(e) => setTempSubtitle(e.target.value)}
                className="text-lg text-center min-w-[300px]"
                autoFocus
                placeholder="The description of your quiz"
              />
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={handleSaveSubtitle}>
                  <Check className="h-4 w-4" />
                  <span className="sr-only">Save</span>
                </Button>
                <Button size="icon" variant="ghost" onClick={handleCancelSubtitle}>
                  <X className="h-4 w-4" />
                  <span className="sr-only">Cancel</span>
                </Button>
              </div>
            </div>
          ) : (
            <div className="group relative inline-block">
              <p className="max-w-[700px] text-lg text-muted-foreground">{subtitle}</p>
              <Button
                size="icon"
                variant="ghost"
                className="absolute -right-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleEditSubtitle}
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">Edit subtitle</span>
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <Button asChild size="lg">
            <Link href="/create">Create Questions</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/display">Display Questions</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12 w-full max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Create Questions</CardTitle>
              <CardDescription>Add your own "A or B" questions with two possible answers</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Create custom questions with two answer options. Perfect for icebreakers, team building, or just for fun
                at your next event.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Display Mode</CardTitle>
              <CardDescription>Show your questions in a presentation-friendly format</CardDescription>
            </CardHeader>
            <CardContent>
              <p>
                Display your questions in a clean, full-screen format that's perfect for sharing during events. Navigate
                through your questions with ease.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
