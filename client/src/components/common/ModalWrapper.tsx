import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

interface ModalWrapperProps {
  title: string;
  malayalamTitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: string;
}

export const ModalWrapper: React.FC<ModalWrapperProps> = ({
  title,
  malayalamTitle,
  icon,
  children,
  maxWidth = 'max-w-xl',
}) => {
  const { closeModal } = useGameStore();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [closeModal]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        className={`relative w-full ${maxWidth} kerala-panel rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Kerala temple banner style */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-950/80 via-stone-900/90 to-amber-950/80">
          <div className="flex items-center gap-3">
            {icon && <div className="text-amber-400 text-2xl">{icon}</div>}
            <div>
              <h2 className="text-xl font-bold tracking-wide text-amber-100 flex items-center gap-2">
                {title}
                {malayalamTitle && (
                  <span className="text-xs font-normal text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                    {malayalamTitle}
                  </span>
                )}
              </h2>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800/80 transition-colors"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
