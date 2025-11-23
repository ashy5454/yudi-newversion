import { ReactNode } from 'react'

type ModalProps = {
  children?: ReactNode
  onClose: () => void
}
export default function Modal({ children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="relative max-w-lg w-full mx-4 bg-card text-card-foreground rounded-lg shadow-lg border border-border">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
