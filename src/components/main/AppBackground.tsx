export default function AppBackground({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full h-screen overflow-hidden bg-background text-foreground">
            <div className="fixed inset-0 bg-[radial-gradient(circle,var(--foreground)_1px,transparent_1px)] [background-size:2rem_2rem] opacity-10 animate-pulse" />
            {children}
        </div>
    )
}