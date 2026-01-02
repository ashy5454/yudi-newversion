"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { ScrollArea } from "../ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { usePersona } from "@/hooks/usePersona"
import { useAuth } from "../AuthContext"
import useRoom from "@/hooks/useRoom"

const personaSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  category: z.string().min(1, { message: "Please select a category." }),
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
  userPrompt: z.string().min(10, { message: "User prompt must be at least 10 characters." }),
  tags: z.array(z.string()),
  bodyColor: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, { message: "Please enter a valid hex color code." }),
  gender: z.string().min(1, { message: "Please select a gender." }),
  language: z.string().min(1, { message: "Please select a language." }),
  age: z
    .number()
    .min(1, { message: "Age must be at least 1." })
    .max(120, { message: "Age must be less than 120." }),
  isPublic: z.boolean(),
  personality: z.string().optional(),
  avatarUrl: z.string().optional(),
})

type PersonaFormValues = z.infer<typeof personaSchema>

const categories = [
  "Therapist",
  "Friend",
  "Tutor",
  "Coach",
  "Mentor",
  "Companion",
  "Expert",
  "Assistant",
  "Entertainer",
  "Other",
]

const genders = ["male", "female"]

const languages = [
  { code: "en-IN", name: "English (India)" },
  { code: "hi-IN", name: "Hindi (India)" },
  { code: "te-IN", name: "Telugu (India)" },
  { code: "ta-IN", name: "Tamil (India)" },
  { code: "mr-IN", name: "Marathi (India)" },
  { code: "bn-IN", name: "Bengali (India)" },
  { code: "en-US", name: "English (US)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "es-US", name: "Spanish (US)" },
  { code: "de-DE", name: "German (Germany)" },
  { code: "ja-JP", name: "Japanese (Japan)" },
  { code: "ko-KR", name: "Korean (Korea)" },
  { code: "pt-BR", name: "Portuguese (Brazil)" },
]

const defaultColors = [
  "#4285f4",
  "#ea4335",
  "#fbbc04",
  "#34a853",
  "#fa7b17",
  "#f538a0",
  "#a142f4",
  "#24c1e0",
  "#ff6b81",
  "#ff8a65",
  "#ffb74d",
  "#81c784",
  "#64b5f6",
  "#9575cd",
]

export default function CreatePersona() {
  const [tagInput, setTagInput] = React.useState("")
  const [isEnhancing, setIsEnhancing] = React.useState(false)
  const [showEnhanced, setShowEnhanced] = React.useState(false)
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const router = useRouter()
  const { user } = useAuth()
  const { rooms, createRoom } = useRoom()
  const { createPersona, loading: personaLoading, error } = usePersona()

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(personaSchema),
    defaultValues: {
      name: "",
      category: "Friend",
      description: "",
      userPrompt: "",
      tags: [],
      bodyColor: defaultColors[0],
      gender: "",
      language: "",
      age: 25,
      isPublic: true,
      personality: "",
      avatarUrl: "",
    },
  })

  const addTag = () => {
    const currentTags = form.getValues("tags")
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      form.setValue("tags", [...currentTags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove),
    )
  }

  const handleEnhanceWithAI = async () => {
    const name = form.getValues("name")
    const description = form.getValues("description")

    if (!name || !description) {
      toast.error("Please enter name and description first")
      return
    }

    setIsEnhancing(true)
    try {
      const response = await fetch("/api/persona/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }))
        const errorMessage: string =
          errorData.error || `HTTP error! status: ${response.status}`

        // Only log in dev to avoid noisy console in prod
        if (process.env.NODE_ENV === "development") {
          console.warn("Enhance API error:", errorMessage)
        }

        // Special friendly message for invalid API key
        if (errorMessage.toLowerCase().includes("api key")) {
          toast.error(
            "AI enhancement is not configured correctly (invalid Gemini API key). Ask the admin / check GEMINI_API_KEY on the server.",
          )
          // Just stop here, don't throw -> no red stack trace
          return
        }

        toast.error(errorMessage)
        return
      }

      const enhanced = await response.json()

      if (enhanced.error) {
        toast.error(enhanced.error)
        return
      }

      // Only update empty/default fields
      if (!form.getValues("age") || form.getValues("age") === 25) {
        form.setValue("age", enhanced.age)
      }
      if (!form.getValues("gender")) {
        form.setValue("gender", enhanced.gender)
      }
      if (!form.getValues("category") || form.getValues("category") === "Friend") {
        form.setValue("category", enhanced.category)
      }
      if (!form.getValues("language")) {
        form.setValue("language", enhanced.language)
      }

      form.setValue("personality", enhanced.personality)
      form.setValue("userPrompt", enhanced.enhancedDescription)
      if (form.getValues("tags").length === 0) {
        form.setValue("tags", enhanced.tags)
      }

      setShowEnhanced(true)
      setIsAdvancedOpen(true) // Auto-expand to show AI-filled fields
      toast.success("✨ AI enhanced your persona!")
    } catch (error) {
      console.error("Error enhancing persona:", error)
      const errorMessage =
        error instanceof Error ? error.message : "Failed to enhance persona with AI"
      toast.error(errorMessage)
    } finally {
      setIsEnhancing(false)
    }
  }

  const findRoomForPersona = (personaId: string) => {
    if (!user) return null
    return rooms.find(
      (room) =>
        room.personaId === personaId &&
        room.userId === user.uid &&
        !room.isArchived,
    )
  }

  const handleNavigate = async (
    personaId: string,
    name: string,
    avatarUrl: string,
    bodyColor: string,
  ) => {
    if (!user) {
      toast.error("You must be logged in to start a conversation.")
      return
    }
    try {
      let room = findRoomForPersona(personaId)
      let roomId = room?.id ?? null
      if (!roomId) {
        roomId = await createRoom({
          userId: user.uid,
          personaId,
          title: name,
          avatarUrl,
          bodyColor,
        })
        if (!roomId) throw new Error("Failed to create room")
      }
      router.replace(`/m/${roomId}/call`)
    } catch (err: any) {
      toast.error(err?.message || "Failed to start conversation")
    }
  }

  const onSubmit = async (data: PersonaFormValues) => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const personaId = await createPersona(data)
      if (personaId) {
        toast.success("Persona created successfully!")
        await handleNavigate(personaId, data.name, data.avatarUrl ?? "", data.bodyColor)
      }
    } catch (err) {
      console.error("Create persona error:", err)
      toast.error("Failed to create persona")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Only block submit while *actually* submitting
  // (ignore personaLoading which might be used for list fetching)
  const submitDisabled = isSubmitting

  return (
    <ScrollArea className="h-[calc(100vh-96px)] md:h-full fixed left-0 md:left-14 w-full md:w-[calc(100vw-96px)]">
      <Card className="bg-background/60 rounded-none border-none mx-auto">
        <CardHeader className="px-4 md:px-0 pb-2 border-b-2 border-muted w-full md:w-4xl mx-auto">
          <CardTitle className="text-2xl font-semibold">Create New Persona</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Fill in the basic details. AI can help fill the rest!
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center p-6">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6 w-full max-w-2xl"
            >
              {/* Name & Description - Always Visible */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Dr. Sarah"
                        {...field}
                        className="border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the persona briefly..."
                        rows={3}
                        {...field}
                        className="border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* AI Enhancement Button */}
              {!showEnhanced && (
                <Button
                  type="button"
                  onClick={handleEnhanceWithAI}
                  disabled={isEnhancing}
                  variant="outline"
                  className="w-full bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border-primary/20"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI is enhancing...
                    </>
                  ) : (
                    <>✨ Generate Details with AI</>
                  )}
                </Button>
              )}

              {showEnhanced && (
                <div className="w-full p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <p className="text-sm text-primary flex items-center gap-2">
                    <span className="text-lg">✨</span>
                    <span className="font-medium">AI Enhanced!</span>
                    <span className="text-muted-foreground">Review below.</span>
                  </p>
                </div>
              )}

              {/* Advanced Options - Collapsible */}
              <Collapsible
                open={isAdvancedOpen}
                onOpenChange={setIsAdvancedOpen}
                className="w-full space-y-4"
              >
                <CollapsibleTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-between p-4 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <span className="font-medium">Advanced Options</span>
                    {isAdvancedOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>

                <CollapsibleContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              {...field}
                              onChange={(e) =>
                                field.onChange(parseInt(e.target.value) || 0)
                              }
                              className="border-none bg-black/5 dark:bg
white/5 hover:bg-black/10 dark:hover:bg-white/10"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-none bg-black/5 dark:bg-white/5">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {genders.map((g) => (
                                <SelectItem key={g} value={g}>
                                  {g.toUpperCase()}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-none bg-black/5 dark:bg-white/5">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((l) => (
                              <SelectItem key={l.code} value={l.code}>
                                {l.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="userPrompt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User Prompt (AI Enhanced)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            {...field}
                            className="border-none bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  addTag()
                                }
                              }}
                              className="border-none bg-black/5 dark:bg-white/5"
                            />
                            <Button type="button" variant="outline" onClick={addTag}>
                              Add
                            </Button>
                          </div>
                          {field.value.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {field.value.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="flex items-center gap-1"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-1 hover:text-destructive"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bodyColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Body Color</FormLabel>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-12 w-12 rounded-full"
                              style={{ backgroundColor: field.value }}
                            >
                              <input
                                type="color"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="w-full h-full rounded-full outline-0 border-none cursor-pointer"
                              />
                            </div>
                            <span className="text-sm">{field.value}</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {defaultColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-8 h-8 rounded-md border-2 ${field.value === color
                                    ? "border-primary"
                                    : "border-border"
                                  }`}
                                style={{ backgroundColor: color }}
                                onClick={() => field.onChange(color)}
                              />
                            ))}
                          </div>
                        </div>
                      </FormItem>
                    )}
                  />
                </CollapsibleContent>
              </Collapsible>

              {error && (
                <div className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitDisabled}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Persona"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </ScrollArea>
  )
}
