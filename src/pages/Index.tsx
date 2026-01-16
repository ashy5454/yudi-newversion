import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ArrowDown, Star, Users, Globe, Shield, MessageCircle, Check } from "lucide-react";

// Extend the Window interface to include Tally
declare global {
  interface Window {
    Tally?: any;
  }
}

const Index = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://tally.so/widgets/embed.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleEarlyAccess = () => {
    // 🎉 Confetti
    const confetti = document.createElement("div");
    confetti.innerHTML = "🎉";
    confetti.style.position = "fixed";
    confetti.style.fontSize = "2rem";
    confetti.style.zIndex = "9999";
    confetti.style.pointerEvents = "none";
    confetti.style.left = "50%";
    confetti.style.top = "50%";
    confetti.style.transform = "translate(-50%, -50%)";
    confetti.style.animation = "confetti 2s ease-out forwards";
    document.body.appendChild(confetti);
    setTimeout(() => document.body.removeChild(confetti), 2000);

    // Open Tally popup
    if (window.Tally) {
      window.Tally.openPopup("nrQAB2", {
        layout: "modal",
        width: 500,
        overlay: true,
        emoji: {
          text: "🚀",
          animation: "tada",
        },
        autoClose: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white font-sans antialiased">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Hero Content */}
            <div className="text-center lg:text-left space-y-12">
              <div className="space-y-8">
                <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-full">
                  <Star className="w-4 h-4 text-yellow-400 mr-2" />
                  <span className="text-sm font-medium text-blue-200">Trusted by 10,000+ users across India</span>
                </div>

                <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-white leading-[0.9] tracking-tight">
                  Speak your heart —{" "}
                  <span className="bg-gradient-to-r from-[#428DFF] via-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Yudi understands
                  </span>
                </h1>

                <p className="font-heading text-xl md:text-2xl lg:text-3xl text-slate-300 max-w-2xl font-normal leading-relaxed">
                  Your AI companion that speaks <span className="text-white font-semibold">English and multiple Indian languages</span> —
                  switch languages as naturally as you think.
                </p>
              </div>

              {/* Language Badges */}
              <div className="flex justify-center lg:justify-start gap-3 flex-wrap">
                {[
                  { lang: "English", text: "Hello", flag: "🇺🇸", accent: "from-blue-500 to-blue-600" },
                  { lang: "Hindi", text: "नमस्ते", flag: "🇮🇳", accent: "from-purple-500 to-pink-500" },
                  { lang: "Telugu", text: "నమస్తే", flag: "🇮🇳", accent: "from-orange-500 to-red-500" },
                  { lang: "Tamil", text: "வணக்கம்", flag: "🇮🇳", accent: "from-green-500 to-teal-500" },
                  { lang: "+ More", text: "और भी", flag: "🇮🇳", accent: "from-indigo-500 to-purple-500" }
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group bg-slate-800/60 backdrop-blur-xl rounded-xl px-5 py-3 shadow-lg border border-slate-700/50 hover:scale-105 transition-all duration-300 hover:shadow-2xl hover:border-slate-600 hover:bg-slate-800/80 cursor-default"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl group-hover:scale-110 transition-transform duration-300">{item.flag}</span>
                      <div>
                        <span className="font-heading font-semibold text-white text-base block">{item.text}</span>
                        <span className="text-xs text-slate-400 font-medium">{item.lang}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-6">
                <Button
                  size="lg"
                  onClick={handleEarlyAccess}
                  className="bg-gradient-to-r from-[#428DFF] via-blue-500 to-purple-500 hover:from-[#3b7ce6] hover:via-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg font-heading font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] border-0 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Check className="w-5 h-5" />
                    Join Yudi
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Button>
                <Button
                  size="lg"
                  onClick={() => {
                    // Load Tally script if not already loaded
                    if (typeof window !== 'undefined' && !window.Tally) {
                      const script = document.createElement("script");
                      script.src = "https://tally.so/widgets/embed.js";
                      script.async = true;
                      document.body.appendChild(script);
                      // Wait a bit for script to load
                      setTimeout(() => {
                        if (window.Tally) {
                          window.Tally.openPopup("nrQAB2", {
                            layout: "modal",
                            width: 500,
                            overlay: true,
                            emoji: {
                              text: "🚀",
                              animation: "tada",
                            },
                            autoClose: false,
                          });
                        } else {
                          // Fallback: open in new tab
                          window.open("https://tally.so/r/nrQAB2", "_blank");
                        }
                      }, 500);
                    } else if (window.Tally) {
                      window.Tally.openPopup("nrQAB2", {
                        layout: "modal",
                        width: 500,
                        overlay: true,
                        emoji: {
                          text: "🚀",
                          animation: "tada",
                        },
                        autoClose: false,
                      });
                    } else {
                      // Fallback: open in new tab
                      window.open("https://tally.so/r/nrQAB2", "_blank");
                    }
                  }}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 text-white px-8 py-6 text-lg font-heading font-semibold rounded-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-[1.02] border-0 relative overflow-hidden group"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    Join the Waitlist!
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="border-2 border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 px-8 py-6 text-lg font-heading font-semibold rounded-xl bg-transparent transition-all duration-300 hover:shadow-xl backdrop-blur-sm"
                >
                  Watch Demo
                </Button>
              </div>
            </div>

            {/* Hero Visual */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-transparent rounded-3xl p-12 aspect-square flex items-center justify-center border border-slate-700/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl"></div>
                <div className="grid grid-cols-2 gap-6 w-full max-w-sm relative z-10">
                  {[
                    { text: "Hello", person: "👨‍💻", bg: "from-blue-500/20 to-blue-600/20" },
                    { text: "नमस्ते", person: "👩‍💼", bg: "from-purple-500/20 to-pink-500/20" },
                    { text: "నమస్తే", person: "👩‍🎓", bg: "from-orange-500/20 to-red-500/20" },
                    { text: "வணக்கம்", person: "👨‍🎨", bg: "from-green-500/20 to-teal-500/20" }
                  ].map((item, index) => (
                    <div
                      key={index}
                      className={`bg-gradient-to-br ${item.bg} backdrop-blur-sm rounded-2xl p-6 shadow-xl text-center animate-fade-in border border-white/10 hover:scale-105 transition-all duration-300`}
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className="text-3xl mb-3">{item.person}</div>
                      <div className="font-heading text-lg font-semibold text-white">{item.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <ArrowDown className="h-6 w-6 text-slate-400" />
        </div>
      </section>

      {/* Why Multiple Indian Languages Matter */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-6">
              <Globe className="w-4 h-4 text-blue-400 mr-2" />
              <span className="text-sm font-medium text-blue-200">Multilingual Intelligence for India</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Why Multiple Indian Languages Matter
            </h2>
            <p className="font-heading text-xl text-slate-400 max-w-3xl mx-auto font-normal leading-relaxed">
              India speaks over 700 languages — we're building AI that honors this diversity and connects you in your mother tongue
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "💝",
                iconComponent: <Users className="w-8 h-8 text-blue-400" />,
                title: "Connect Deeper",
                description: "Build meaningful friendships",
                detail: "Express emotions and thoughts with the cultural nuance only your native language can capture"
              },
              {
                icon: "🗣️",
                iconComponent: <MessageCircle className="w-8 h-8 text-green-400" />,
                title: "Express Freely",
                description: "Zero translation barriers",
                detail: "Switch languages mid-conversation as naturally as you think and feel"
              },
              {
                icon: "🤗",
                iconComponent: <Shield className="w-8 h-8 text-purple-400" />,
                title: "Feel Understood",
                description: "Culture-aware responses",
                detail: "Yudi understands cultural context and responds with appropriate empathy and wisdom"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-slate-800/40 backdrop-blur-sm hover:scale-[1.02] rounded-2xl group overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-600">
                      {feature.iconComponent}
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="font-heading text-lg text-blue-300 font-medium mb-4">{feature.description}</p>
                    <p className="font-sans text-slate-300 mb-6 text-base leading-relaxed">{feature.detail}</p>

                    <div className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 space-y-3 border border-slate-600/50">
                      <div className="font-heading text-xs text-slate-400 font-medium uppercase tracking-wide">Supported Languages</div>
                      <div className="flex justify-center gap-2 flex-wrap">
                        <span className="bg-blue-500 text-white px-2 py-1 rounded-md font-heading font-medium text-xs">EN</span>
                        <span className="bg-purple-500 text-white px-2 py-1 rounded-md font-heading font-medium text-xs">HI</span>
                        <span className="bg-orange-500 text-white px-2 py-1 rounded-md font-heading font-medium text-xs">TE</span>
                        <span className="bg-green-500 text-white px-2 py-1 rounded-md font-heading font-medium text-xs">TA</span>
                        <span className="bg-indigo-500 text-white px-2 py-1 rounded-md font-heading font-medium text-xs">+More</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-flex items-center px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
              <Star className="w-4 h-4 text-purple-400 mr-2" />
              <span className="text-sm font-medium text-purple-200">Advanced Features</span>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Core Features
            </h2>
            <p className="font-heading text-xl text-slate-400 font-normal">
              Designed for seamless multilingual connections across India
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Connections",
                description: "Discover AI companions that match your communication style and interests",
                icon: <Users className="w-10 h-10 text-blue-400" />,
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                title: "Private & Secure",
                description: "Safe, judgment-free space for personal growth and meaningful conversations",
                icon: <Shield className="w-10 h-10 text-green-400" />,
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                title: "Intelligent Nudges",
                description: "Gentle reminders and thoughtful check-ins from your AI companion",
                icon: <MessageCircle className="w-10 h-10 text-purple-400" />,
                gradient: "from-purple-500/20 to-pink-500/20"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-slate-700/50 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-[1.02] bg-slate-800/40 backdrop-blur-sm rounded-2xl group overflow-hidden">
                <CardContent className="p-8 text-center relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <div className="relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-slate-600">
                      {feature.icon}
                    </div>
                    <h3 className="font-heading text-2xl font-bold text-white mb-4">{feature.title}</h3>
                    <p className="font-sans text-slate-300 mb-6 text-base leading-relaxed">{feature.description}</p>
                    <div className="bg-gradient-to-r from-slate-700 to-slate-600 text-white px-4 py-2 rounded-full font-heading font-medium text-sm border border-slate-500">
                      Works in Multiple Indian Languages
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              How It Works
            </h2>
            <p className="font-heading text-xl text-slate-400 font-normal">
              Get started in under 2 minutes
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Create Profile",
                description: "Set up your account with basic preferences in 60 seconds",
                time: "60s"
              },
              {
                step: "02",
                title: "Choose Language",
                description: "Select or auto-detect your preferred language for conversation",
                time: "Auto"
              },
              {
                step: "03",
                title: "Start Connecting",
                description: "Get personalized guidance and meaningful AI friendships",
                time: "∞"
              }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-24 h-24 bg-gradient-to-r from-[#428DFF] via-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-display text-xl font-bold mx-auto shadow-2xl group-hover:scale-110 transition-transform duration-300 border border-blue-400/20">
                    {step.step}
                  </div>
                  <div className="absolute -top-2 -right-2 bg-green-500 text-white font-heading font-bold text-xs px-2 py-1 rounded-full shadow-lg">
                    {step.time}
                  </div>
                </div>
                <h3 className="font-heading text-2xl font-bold text-white mb-4">{step.title}</h3>
                <p className="font-sans text-slate-300 text-base leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Real Stories Carousel */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Real Stories
            </h2>
            <p className="font-heading text-xl text-slate-400 font-normal">
              Hear from early users across multiple Indian languages
            </p>
          </div>

          <Carousel className="w-full">
            <CarouselContent>
              {[
                {
                  original: "Yudi made me feel heard when I needed it most.",
                  translation: "Yudi made me feel heard when I needed it most.",
                  name: "Sarah, 22",
                  lang: "English",
                  rating: 5
                },
                {
                  original: "यूडी से बात करके मुझे बहुत अच्छा लगा",
                  translation: "I felt really good talking to Yudi",
                  name: "Arjun, 20",
                  lang: "Hindi",
                  rating: 5
                },
                {
                  original: "యుడి నాకు చాలా మంచి స్నేహితుడిగా అనిపించింది",
                  translation: "Yudi felt like a really good friend to me",
                  name: "Ravi, 19",
                  lang: "Telugu",
                  rating: 5
                },
                {
                  original: "யுடி என் மனதை புரிந்து கொண்டது",
                  translation: "Yudi understood my heart",
                  name: "Priya, 21",
                  lang: "Tamil",
                  rating: 5
                }
              ].map((story, index) => (
                <CarouselItem key={index}>
                  <Card className="border-slate-700/50 shadow-2xl bg-slate-800/40 backdrop-blur-sm rounded-2xl">
                    <CardContent className="p-10 text-center">
                      <div className="flex justify-center mb-6">
                        {[...Array(story.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <div className="mb-8">
                        <blockquote className="font-heading text-xl md:text-2xl font-medium text-white mb-4 leading-relaxed">
                          "{story.original}"
                        </blockquote>
                        {story.original !== story.translation && (
                          <p className="font-sans text-lg text-slate-400 italic leading-relaxed">
                            "{story.translation}"
                          </p>
                        )}
                      </div>
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-[#428DFF] to-purple-500 rounded-full flex items-center justify-center text-white font-display font-bold text-lg">
                          {story.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="font-heading font-semibold text-white text-lg">{story.name}</div>
                          <div className="font-sans text-slate-400 text-sm">{story.lang}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700" />
            <CarouselNext className="text-white border-slate-700 bg-slate-800 hover:bg-slate-700" />
          </Carousel>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6 bg-slate-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            {[
              {
                question: "Which Indian languages does Yudi support?",
                answer: "Yudi currently supports English, Hindi, Telugu, and Tamil, with more Indian languages being added regularly. You can switch between any supported languages seamlessly during conversations, and Yudi will maintain context across all interactions."
              },
              {
                question: "Can I switch languages on the fly?",
                answer: "Absolutely! You can switch between any of our supported Indian languages at any point during your conversation. Yudi will seamlessly adapt to your language choice and maintain context across all interactions."
              },
              {
                question: "Is Yudi free to use?",
                answer: "Yudi offers a generous free tier with core features. Premium features like extended conversations, advanced AI insights, and priority support are available with our subscription plans starting at $9.99/month."
              },
              {
                question: "How does Yudi understand cultural context?",
                answer: "Yudi is trained on culturally diverse datasets and understands the nuances, expressions, idioms, and cultural references specific to each Indian language and region. Our AI considers cultural context in every response."
              },
              {
                question: "Is my data secure and private?",
                answer: "Yes, we prioritize your privacy above all. All conversations are end-to-end encrypted, we never share your personal data with third parties, and you have full control over your data at all times."
              },
              {
                question: "When will the app be available?",
                answer: "We're currently in beta testing with select users! Join our early access program to be among the first to experience Yudi when we launch publicly in Q2 2025."
              }
            ].map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-slate-700/50 rounded-xl px-6 bg-slate-800/40 backdrop-blur-sm">
                <AccordionTrigger className="text-left font-heading text-lg font-semibold text-white hover:text-blue-300 py-6 hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-sans text-slate-300 pb-6 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#428DFF] via-blue-500 to-purple-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Ready for a friend who speaks your language?
          </h2>
          <p className="font-heading text-xl text-blue-100 mb-12 font-normal leading-relaxed max-w-3xl mx-auto">
            Join thousands of users who've found meaningful connections and personal growth with Yudi
          </p>
          <Button
            size="lg"
            onClick={handleEarlyAccess}
            className="bg-gradient-to-r from-[#428DFF] via-blue-500 to-purple-500 hover:from-[#3b7ce6] hover:via-blue-600 hover:to-purple-600 text-white px-8 py-6 text-lg font-heading font-semibold rounded-xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform hover:scale-[1.02] border-0 relative overflow-hidden group"
          >
            <span className="relative z-10 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Join Yudi
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-black border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <h3 className="font-display text-3xl font-bold text-[#428DFF] mb-4">Yudi</h3>
              <p className="font-heading text-slate-400 text-lg mb-6 max-w-md">Your AI companion that speaks your language and understands your heart.</p>
              <div className="flex space-x-4">
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-xl">📧</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-xl">📱</a>
                <a href="#" className="text-slate-400 hover:text-white transition-colors text-xl">🌐</a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white font-semibold text-lg mb-4">Product</h4>
              <div className="space-y-3">
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Features</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Pricing</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Download</a>
              </div>
            </div>

            <div>
              <h4 className="font-heading text-white font-semibold text-lg mb-4">Support</h4>
              <div className="space-y-3">
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Privacy</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Terms</a>
                <a href="#" className="block text-slate-400 hover:text-white transition-colors font-medium">Contact</a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p className="font-sans text-base">&copy; 2025 Yudi. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(0deg);
            opacity: 1;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.5) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(0.5) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};

export default Index;