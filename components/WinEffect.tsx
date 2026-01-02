import React, { useEffect, useState } from 'react';

interface WinEffectProps {
  amount: number;
  onComplete: () => void;
}

const WinEffect: React.FC<WinEffectProps> = ({ amount, onComplete }) => {
  const [particles, setParticles] = useState<Array<{id: number, left: number, delay: number, size: number}>>([]);

  useEffect(() => {
    // Generate particles
    const newParticles = Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      size: Math.random() * 20 + 10
    }));
    setParticles(newParticles);

    // Auto close after animation
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center overflow-hidden">
      {/* Dark overlay flash */}
      <div className="absolute inset-0 bg-black/40 animate-pulse"></div>

      {/* Center Message */}
      <div className="relative z-10 flex flex-col items-center animate-zoom-in">
        <h1 className="text-6xl sm:text-8xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] filter">
          YOU WIN!
        </h1>
        <div className="text-3xl sm:text-5xl font-mono font-bold text-white mt-4 drop-shadow-md">
          +${amount.toLocaleString()}
        </div>
      </div>

      {/* Floating Gold Particles (Pseudo-coins/sparkles) */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 text-yellow-400"
          style={{
            left: `${p.left}%`,
            fontSize: `${p.size}px`,
            animation: `float-particle 2.5s ease-out forwards`,
            animationDelay: `${p.delay}s`
          }}
        >
          {['✨', '💰', '🪙'][Math.floor(Math.random() * 3)]}
        </div>
      ))}
    </div>
  );
};

export default WinEffect;