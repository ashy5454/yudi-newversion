"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { motion } from "framer-motion"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Loader2, ChevronDown, ChevronUp, Sparkles, Wand2 } from "lucide-react"
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
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#6366F1",
  "#14B8A6",
  "#F97316",
  "#84CC16",
  "#A855F7",
  "#3B82F6",
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

        if (process.env.NODE_ENV === "development") {
          console.warn("Enhance API error:", errorMessage)
        }

        if (errorMessage.toLowerCase().includes("api key")) {
          toast.error(
            "AI enhancement is not configured correctly (invalid Gemini API key). Ask the admin / check GEMINI_API_KEY on the server.",
          )
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
      setIsAdvancedOpen(true)
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
      router.replace(`/m/${roomId}/chat`)
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

  const submitDisabled = isSubmitting

  return (
    <ScrollArea className="h-[calc(100vh-96px)] md:h-full fixed left-0 md:left-14 w-full md:w-[calc(100vw-96px)]">
      <div className="min-h-full bg-gradient-to-b from-background to-background/80 py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.6 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4 shadow-lg shadow-purple-500/30"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 
              className="text-3xl md:text-4xl font-bold text-foreground mb-2"
              style={{ fontFamily: "'Clash Display', 'Outfit', sans-serif" }}
            >
              Create Your Companion
            </h1>
            <p className="text-muted-foreground text-lg">
              Design your perfect AI bestie ✨
            </p>
          </div>

          {/* Form Card */}
          <Card className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-3xl shadow-2xl overflow-hidden">
            <CardContent className="p-6 md:p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Name your companion
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Arjun Bhai, Priya Didi..."
                            {...field}
                            className="h-12 text-base rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Description Field */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base font-semibold">
                          Describe their personality
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Chill bestie who speaks Hinglish, loves bollywood, always up for late night chats..."
                            rows={4}
                            {...field}
                            className="text-base rounded-xl border-border/50 bg-background/50 focus:bg-background transition-colors resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* AI Enhancement Button */}
                  {!showEnhanced && (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Button
                        type="button"
                        onClick={handleEnhanceWithAI}
                        disabled={isEnhancing}
                        variant="outline"
                        className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border-purple-500/30 hover:border-purple-500/50 transition-all"
                      >
                        {isEnhancing ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            AI is working its magic...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-5 w-5 text-purple-500" />
                            Generate with AI ✨
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  {/* Enhanced Success Message */}
                  {showEnhanced && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl"
                    >
                      <p className="text-sm text-purple-300 flex items-center gap-2 font-medium">
                        <Sparkles className="w-5 h-5" />
                        AI Enhanced! Check the details below 🎉
                      </p>
                    </motion.div>
                  )}

                  {/* Advanced Options */}
                  <Collapsible
                    open={isAdvancedOpen}
                    onOpenChange={setIsAdvancedOpen}
                    className="w-full space-y-4"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        className="w-full justify-between p-4 h-auto hover:bg-muted/50 rounded-xl"
                      >
                        <span className="font-semibold">Advanced Options</span>
                        {isAdvancedOpen ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </CollapsibleTrigger>

                    <CollapsibleContent className="space-y-6">
                      {/* Age & Gender Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="font-semibold">Age</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max="120"
                                  {...field}
                                  onChange={(e) =>
                                    field.onChange(parseInt(e.target.value) || 0)
                                  }
                                  className="h-12 rounded-xl border-border/50 bg-background/50"
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
                              <FormLabel className="font-semibold">Gender</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 rounded-xl border-border/50 bg-background/50">
                                    <SelectValue placeholder="Select" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {genders.map((g) => (
                                    <SelectItem key={g} value={g}>
                                      {g.charAt(0).toUpperCase() + g.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Language Field */}
                      <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Language</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-12 rounded-xl border-border/50 bg-background/50">
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

                      {/* User Prompt Field */}
                      <FormField
                        control={form.control}
                        name="userPrompt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">
                              AI Personality Prompt
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                rows={4}
                                {...field}
                                className="rounded-xl border-border/50 bg-background/50 resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Tags Field */}
                      <FormField
                        control={form.control}
                        name="tags"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Tags</FormLabel>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add a tag..."
                                  value={tagInput}
                                  onChange={(e) => setTagInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault()
                                      addTag()
                                    }
                                  }}
                                  className="h-12 rounded-xl border-border/50 bg-background/50"
                                />
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={addTag}
                                  className="h-12 px-6 rounded-xl"
                                >
                                  Add
                                </Button>
                              </div>
                              {field.value.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {field.value.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="secondary"
                                      className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-500/20 text-purple-300 border-purple-500/30"
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

                      {/* Color Picker */}
                      <FormField
                        control={form.control}
                        name="bodyColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="font-semibold">Avatar Color</FormLabel>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <div
                                  className="h-14 w-14 rounded-2xl shadow-lg"
                                  style={{ 
                                    backgroundColor: field.value,
                                    boxShadow: `0 8px 24px ${field.value}40`
                                  }}
                                >
                                  <input
                                    type="color"
                                    value={field.value}
                                    onChange={(e) => field.onChange(e.target.value)}
                                    className="w-full h-full rounded-2xl opacity-0 cursor-pointer"
                                  />
                                </div>
                                <span className="text-sm font-mono text-muted-foreground">
                                  {field.value}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {defaultColors.map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`w-10 h-10 rounded-xl transition-all ${
                                      field.value === color
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                                        : "hover:scale-105"
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

                  {/* Error Display */}
                  {error && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                    <Button 
                      type="submit" 
                      className="w-full h-14 text-lg font-semibold rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/30" 
                      disabled={submitDisabled}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating your bestie...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-5 w-5" />
                          Create Persona
                        </>
                      )}
                    </Button>
                  </motion.div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </ScrollArea>
  )
}
