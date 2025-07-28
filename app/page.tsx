"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Loader2, Download, ChevronDown, ChevronUp } from "lucide-react"
import { generateWordSearch } from "@/lib/word-search-generator"
import { generatePDF } from "@/lib/pdf-generator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components

interface Puzzle {
  id: number
  words: string[]
  grid: string[][]
  solution: boolean[][]
}

export default function WordSearchGenerator() {
  const [theme, setTheme] = useState("")
  const [numPuzzles, setNumPuzzles] = useState(5)
  const [wordsPerPuzzle, setWordsPerPuzzle] = useState(9)
  const [puzzles, setPuzzles] = useState<Puzzle[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [expandedPuzzles, setExpandedPuzzles] = useState<Set<number>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState("Theme 1 (Checkboxes)") // New state for template selection

  const togglePuzzleExpansion = (puzzleId: number) => {
    const newExpanded = new Set(expandedPuzzles)
    if (newExpanded.has(puzzleId)) {
      newExpanded.delete(puzzleId)
    } else {
      newExpanded.add(puzzleId)
    }
    setExpandedPuzzles(newExpanded)
  }

  const generatePuzzles = async () => {
    if (!theme.trim()) return

    setIsGenerating(true)
    setPuzzles([])

    try {
      const totalWordsNeeded = numPuzzles * wordsPerPuzzle
      console.log(`Client: Requesting ${totalWordsNeeded} words for theme "${theme}"`)

      const response = await fetch("/api/generate-words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme,
          totalWordCount: totalWordsNeeded,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        alert(`API Error: ${errorData.error || "Something went wrong on the server."}`)
        setIsGenerating(false)
        return
      }

      const { words: allGeneratedWords, warning: apiWarning, error: apiError } = await response.json()

      if (apiError) {
        alert(`Error from AI: ${apiError}`)
        setIsGenerating(false)
        return
      }

      if (apiWarning) {
        alert(`Warning: ${apiWarning}`)
      }

      if (allGeneratedWords.length === 0) {
        alert("No words were generated. Please try a different theme or adjust settings.")
        setIsGenerating(false)
        return
      }

      const generatedPuzzles: Puzzle[] = []
      for (let i = 0; i < numPuzzles; i++) {
        // Slice words for each puzzle. If not enough words, it will slice an empty array.
        const wordsForThisPuzzle = allGeneratedWords.slice(i * wordsPerPuzzle, (i + 1) * wordsPerPuzzle)

        // If wordsForThisPuzzle is empty, generate a placeholder word to ensure the puzzle grid is created
        // and the word list isn't empty, preventing potential issues with the generator.
        const finalWordsForPuzzle = wordsForThisPuzzle.length > 0 ? wordsForThisPuzzle : ["puzzle"] // Use a default word if no words are available

        const puzzleData = generateWordSearch(finalWordsForPuzzle)

        generatedPuzzles.push({
          id: i + 1,
          words: finalWordsForPuzzle, // Use the words actually placed in this puzzle
          grid: puzzleData.grid,
          solution: puzzleData.solution,
        })
      }

      setPuzzles(generatedPuzzles)
    } catch (error: any) {
      console.error("Error generating puzzles:", error.message)
      alert(`Failed to generate puzzles: ${error.message}. Please try again.`)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadPDF = async () => {
    if (puzzles.length === 0) return

    try {
      console.log("Selected Template :",selectedTemplate);
      await generatePDF(puzzles, theme, selectedTemplate) // Pass selectedTemplate to generatePDF
    } catch (error) {
      console.error("Error generating PDF:", error)
      alert("Failed to generate PDF. Please try again.")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">AI Word Search Puzzle Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Enter a theme, number of puzzles, and number of words per puzzle. Generate and download a PDF with puzzles
            and their answers.
          </p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Generate Puzzles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="theme">Theme</Label>
              <Input
                id="theme"
                type="text"
                placeholder="e.g., Animals, Sports, Food, Science, Space, Ocean"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="mt-1"
              />
              <p className="text-sm text-gray-500 mt-1">
                Try themes like: Animals, Sports, Food, Science, Nature, Colors, School, Transportation, Space, Ocean
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numPuzzles">Number of puzzles</Label>
                <Input
                  id="numPuzzles"
                  type="number"
                  min="1"
                  max="200"
                  value={numPuzzles}
                  onChange={(e) => setNumPuzzles(Number.parseInt(e.target.value) || 5)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="wordsPerPuzzle">Number of words per puzzle</Label>
                <Input
                  id="wordsPerPuzzle"
                  type="number"
                  min="5"
                  max="20"
                  value={wordsPerPuzzle}
                  onChange={(e) => setWordsPerPuzzle(Number.parseInt(e.target.value) || 9)}
                  className="mt-1"
                />
              </div>
            </div>

            {/* New: PDF Template Selection */}
            <div>
              <Label htmlFor="pdfTemplate">PDF Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select a PDF template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Theme 1 (Checkboxes)">Theme 1 (Checkboxes)</SelectItem>
                  <SelectItem value="Theme 2 (Dashed)">Theme 2 (Dashed)</SelectItem>
                  <SelectItem value="Theme 3 (Table)">Theme 3 (Table)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">Choose a visual style for your downloadable PDF puzzles.</p>
            </div>

            <div className="bg-gray-100 p-4 rounded-lg border border-gray-300">
              <h4 className="font-semibold text-gray-800 mb-2">🤖 AI-Powered Word Generation</h4>
              <p className="text-sm text-gray-700">
                This app uses Open AI to generate themed words for your puzzles. Each puzzle will
                have unique, contextually relevant words based on your chosen theme.
              </p>
            </div>

            <Button onClick={generatePuzzles} disabled={isGenerating || !theme.trim()} className="w-full">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating AI-Powered Puzzles...
                </>
              ) : (
                "Generate Puzzles with AI"
              )}
            </Button>
          </CardContent>
        </Card>

        {puzzles.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Generated Puzzles</h2>
              <Button onClick={downloadPDF} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </div>

            <div className="space-y-8">
              {puzzles.map((puzzle) => (
                <Card key={puzzle.id} className="puzzle-card bg-white shadow-lg">
                  <CardHeader className="text-center border-b border-gray-200 pb-4">
                    <CardTitle className="text-2xl font-bold text-gray-900">Word Search Puzzle #{puzzle.id}</CardTitle>
                    <p className="text-gray-600 capitalize">Theme: {theme}</p>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    {/* Puzzle Grid */}
                    <div className="puzzle-grid mb-6 flex justify-center overflow-x-auto">
                      <div className="inline-block border-2 border-gray-800 bg-white">
                        <div className="grid grid-cols-20 gap-0">
                          {puzzle.grid.map((row, rowIndex) =>
                            row.map((cell, colIndex) => (
                              <div
                                key={`${rowIndex}-${colIndex}`}
                                className="w-7 h-7 lg:w-8 lg:h-8 border border-gray-400 flex items-center justify-center text-base lg:text-lg font-bold font-mono bg-white hover:bg-gray-100 transition-colors cursor-pointer"
                                style={{
                                  borderRight: colIndex === 19 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                  borderBottom: rowIndex === 19 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                  borderTop: rowIndex === 0 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                  borderLeft: colIndex === 0 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                }}
                              >
                                {cell}
                              </div>
                            )),
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Instructions */}
                    <div className="text-center mb-6">
                      <p className="text-lg font-semibold text-gray-700">
                        Find and circle the {puzzle.words.length} hidden words in the grid above.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Words can be found horizontally, vertically, or diagonally in any direction.
                      </p>
                    </div>

                    {/* Word List */}
                    <div className="puzzle-words bg-gray-50 p-5 rounded-lg border border-gray-200">
                      <h4 className="font-bold text-lg mb-4 text-center text-gray-800">Words to Find:</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2">
                        {puzzle.words.map((word, index) => (
                          <div key={index} className="text-center">
                            <div className="bg-white px-3 py-2 rounded border border-gray-300 font-mono text-sm font-semibold tracking-wider">
                              {word.toUpperCase()}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Answer Key Toggle */}
                    <div className="mt-6 text-center">
                      <Collapsible>
                        <CollapsibleTrigger
                          onClick={() => togglePuzzleExpansion(puzzle.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                        >
                          {expandedPuzzles.has(puzzle.id) ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              Hide Answer Key
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              Show Answer Key
                            </>
                          )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-4">
                          <div className="puzzle-solution bg-gray-100 p-5 rounded-lg border border-gray-300">
                            <h4 className="font-bold text-lg mb-4 text-center text-gray-800">Answer Key</h4>
                            <div className="flex justify-center overflow-x-auto">
                              <div className="inline-block border-2 border-gray-600">
                                <div className="grid grid-cols-20 gap-0">
                                  {puzzle.grid.map((row, rowIndex) =>
                                    row.map((cell, colIndex) => (
                                      <div
                                        key={`solution-${rowIndex}-${colIndex}`}
                                        className={`w-7 h-7 lg:w-8 lg:h-8 border border-gray-400 flex items-center justify-center text-base lg:text-lg font-bold font-mono transition-colors ${
                                          puzzle.solution[rowIndex][colIndex]
                                            ? "bg-gray-300 text-gray-900"
                                            : "bg-white text-gray-400"
                                        }`}
                                        style={{
                                          borderRight: colIndex === 19 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                          borderBottom: rowIndex === 19 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                          borderTop: rowIndex === 0 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                          borderLeft: colIndex === 0 ? "2px solid #1f2937" : "1px solid #9ca3af",
                                        }}
                                      >
                                        {cell}
                                      </div>
                                    )),
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
