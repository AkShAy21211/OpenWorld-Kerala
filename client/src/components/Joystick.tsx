import React, { useRef, useState, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';

export const Joystick: React.FC = () => {
  const { setJoystickVector, activeModal } = useGameStore();
  const baseRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(false);
  const [knobPos, setKnobPos] = useState({ x: 0, y: 0 });

  const maxRadius = 38;

  const handleTouchStart = (e: React.TouchEvent) => {
    setActive(true);
    handleTouchMove(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!baseRef.current) return;
    const touch = e.touches[0];
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = touch.clientX - centerX;
    const dy = touch.clientY - centerY;
    const dist = Math.hypot(dx, dy);

    if (dist <= maxRadius) {
      setKnobPos({ x: dx, y: dy });
      setJoystickVector({ x: dx / maxRadius, y: dy / maxRadius });
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * maxRadius;
      const clampedY = Math.sin(angle) * maxRadius;
      setKnobPos({ x: clampedX, y: clampedY });
      setJoystickVector({ x: Math.cos(angle), y: Math.sin(angle) });
    }
  };

  const handleTouchEnd = () => {
    setActive(false);
    setKnobPos({ x: 0, y: 0 });
    setJoystickVector(null);
  };

  // Hide on desktop or when modals are open
  if (activeModal !== null) return null;

  return (
    <div
      ref={baseRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="md:hidden fixed bottom-6 right-6 z-40 w-24 h-24 rounded-full bg-stone-950/60 backdrop-blur-md border-2 border-amber-500/40 flex items-center justify-center select-none touch-none shadow-2xl"
    >
      <div
        className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 border-2 border-white shadow-lg pointer-events-none transition-transform duration-75"
        style={{
          transform: `translate(${knobPos.x}px, ${knobPos.y}px)`,
        }}
      />
    </div>
  );
};
