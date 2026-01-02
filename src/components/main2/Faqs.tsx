import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { EN_FAQS } from '@/content/en'
import { DynamicIcon, type IconName } from 'lucide-react/dynamic'
import AnimatedBackground from './AnimatedBackground'

export default function Faqs() {
    return (
        <section className="relative min-h-screen w-full flex items-center">
            <AnimatedBackground />
            <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 w-full">
                <div className="flex flex-col gap-10 md:flex-row md:gap-16">
                    <div className="md:w-1/3">
                        <div className="sticky top-20">
                            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl text-white">{EN_FAQS.title}</h2>
                            <div className="text-white/70 mt-4 space-y-2">
                                <p className="text-lg">heyy! contact us now :)</p>
                                <p className="text-lg">8369490053</p>
                                <p className="text-lg">7993276033</p>
                            </div>
                        </div>
                    </div>
                    <div className="md:w-2/3">
                        <Accordion
                            type="single"
                            collapsible
                            className="w-full space-y-2">
                            {EN_FAQS.faqItems.map((item) => (
                                <AccordionItem
                                    key={item.id}
                                    value={item.id}
                                    className="bg-background shadow-xs rounded-lg border px-4 last:border-b">
                                    <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                                        <div className="flex items-center gap-3">
                                            <div className="flex size-6">
                                                <DynamicIcon
                                                    name={item.icon as IconName}
                                                    className="m-auto size-4"
                                                />
                                            </div>
                                            <span className="text-base text-white">{item.question}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-5">
                                        <div className="px-9">
                                            <p className="text-base text-white/70">{item.answer}</p>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </div>
            </div>
        </section>
    )
}

