import React from 'react';
import { Card, Suit } from '../types';

interface PlayingCardProps {
  card: Card;
  className?: string;
}

const PlayingCard: React.FC<PlayingCardProps> = ({ card, className = '' }) => {
  const isRed = card.suit === Suit.HEARTS || card.suit === Suit.DIAMONDS;
  // Standard card colors
  const mainColor = isRed ? '#dc2626' : '#111827'; // Red-600 or Gray-900
  const secondaryColor = '#f59e0b'; // Gold
  const accentColor = '#1e3a8a'; // Blue
  const skinColor = '#ffe4c4'; // Bisque/Flesh
  
  // --- Card Back ---
  const CardBack = () => (
    <div className="w-full h-full bg-blue-900 rounded-lg border-2 border-white overflow-hidden relative shadow-inner">
       <div className="absolute inset-0 opacity-20" 
            style={{ 
                backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, #ffffff 10px, #ffffff 12px)' 
            }}>
       </div>
       <div className="absolute inset-2 border border-blue-400/50 rounded-sm"></div>
       <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 sm:w-12 sm:h-12 border-2 border-white/20 rotate-45 bg-white/10"></div>
       </div>
    </div>
  );

  const containerClass = `relative w-20 h-28 sm:w-24 sm:h-36 md:w-28 md:h-40 rounded-lg select-none transition-transform hover:scale-105 duration-200 bg-white shadow-xl border border-gray-300 ${className}`;

  if (!card.isFaceUp) {
    return (
      <div className={containerClass}>
        <CardBack />
      </div>
    );
  }

  // Check if it's a face card (J, Q, K) to use external image
  const isFaceCard = ['J', 'Q', 'K'].includes(card.rank);

  // --- External Image for Face Cards ---
  const getCardImageUrl = () => {
    let suitCode = '';
    switch (card.suit) {
        case Suit.HEARTS: suitCode = 'H'; break;
        case Suit.DIAMONDS: suitCode = 'D'; break;
        case Suit.CLUBS: suitCode = 'C'; break;
        case Suit.SPADES: suitCode = 'S'; break;
    }
    
    // Deck of Cards API uses 0 for 10, but we only use this for J, Q, K here usually.
    // However, if logic were extended: 10 -> 0.
    // rank is J, Q, K.
    const rankCode = card.rank;
    
    return `https://deckofcardsapi.com/static/img/${rankCode}${suitCode}.png`;
  };

  if (isFaceCard) {
      return (
          <div className={`${containerClass} overflow-hidden`}>
              <img 
                src={getCardImageUrl()} 
                alt={`${card.rank} of ${card.suit}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
          </div>
      );
  }

  // --- SVG Face Graphics (For non-image fallback or other ranks if needed) ---
  // (Currently JQK uses images, so this is unused for them, but kept for reference or if we switch back)
  const FaceGraphic = ({ rank }: { rank: string }) => {
     return null; 
  };

  // --- Pip Component for 2-10 ---
  const Pip: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
    <div className={`absolute flex items-center justify-center ${isRed ? 'text-red-600' : 'text-slate-900'}`} style={{ width: '20px', height: '20px', ...style }}>
       <span className="text-lg sm:text-2xl md:text-3xl leading-none font-serif">{card.suit}</span>
    </div>
  );

  // Determine Pip Positions (Standard standard layouts)
  const getPips = () => {
    const rank = card.rank;
    const colLeft = '22%';
    const colRight = '78%';
    const colMid = '50%';
    
    // Rows percentages - Adjusted to be further from edges (20% vs 14%) to avoid index overlap
    const rowTop = '20%'; 
    const rowQtr = '35%'; 
    const rowMid = '50%';
    const rowQtrLow = '65%';
    const rowBot = '80%'; 
    
    // For 9 and 10 specific spacing
    const row10_2 = '40%';
    const row10_4 = '60%';

    const row9_2 = '40%';
    const row9_3 = '60%';

    // Helper to generate CSS
    const pos = (top: string, left: string, rotate: boolean = false) => ({
        top, left, transform: `translate(-50%, -50%) ${rotate ? 'rotate(180deg)' : ''}`
    });

    switch (rank) {
        case 'A': return [pos('50%', '50%', false)];
        case '2': return [pos(rowTop, colMid), pos(rowBot, colMid, true)];
        case '3': return [pos(rowTop, colMid), pos(rowMid, colMid), pos(rowBot, colMid, true)];
        case '4': return [pos(rowTop, colLeft), pos(rowTop, colRight), pos(rowBot, colLeft, true), pos(rowBot, colRight, true)];
        case '5': return [pos(rowTop, colLeft), pos(rowTop, colRight), pos(rowMid, colMid), pos(rowBot, colLeft, true), pos(rowBot, colRight, true)];
        case '6': return [
            pos(rowTop, colLeft), pos(rowTop, colRight), 
            pos(rowMid, colLeft), pos(rowMid, colRight), 
            pos(rowBot, colLeft, true), pos(rowBot, colRight, true)
        ];
        case '7': return [ 
            pos(rowTop, colLeft), pos(rowTop, colRight), 
            pos(rowMid, colLeft), pos(rowMid, colRight),
            pos(rowBot, colLeft, true), pos(rowBot, colRight, true),
            pos(rowQtr, colMid) 
        ];
        case '8': return [ 
            pos(rowTop, colLeft), pos(rowTop, colRight),
            pos(rowMid, colLeft), pos(rowMid, colRight),
            pos(rowBot, colLeft, true), pos(rowBot, colRight, true),
            pos(rowQtr, colMid),
            pos(rowQtrLow, colMid, true)
        ];
        case '9': return [
            pos(rowTop, colLeft), pos(rowTop, colRight),
            pos(row9_2, colLeft), pos(row9_2, colRight),
            pos(row9_3, colLeft, true), pos(row9_3, colRight, true),
            pos(rowBot, colLeft, true), pos(rowBot, colRight, true),
            pos(rowMid, colMid)
        ];
        case '10': return [
            pos(rowTop, colLeft), pos(rowTop, colRight),
            pos(row10_2, colLeft), pos(row10_2, colRight),
            pos(row10_4, colLeft, true), pos(row10_4, colRight, true),
            pos(rowBot, colLeft, true), pos(rowBot, colRight, true),
            pos('30%', colMid), // Upper mid
            pos('70%', colMid, true) // Lower mid
        ];
        default: return [];
    }
  };

  const renderContent = () => {
      // Note: J, Q, K are handled by the image return above.
      
      // Ace
      if (card.rank === 'A') {
          return (
             <div className="absolute inset-0 flex items-center justify-center">
                 <span className={`text-6xl sm:text-7xl ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</span>
             </div>
          );
      }

      // Number Cards
      return (
          <div className="absolute inset-0">
               {getPips().map((style, i) => <Pip key={i} style={style} />)}
          </div>
      );
  };

  return (
    <div className={containerClass}>
        
        {/* Top Left Corner */}
        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 flex flex-col items-center leading-none">
            <span className={`text-sm sm:text-xl font-bold font-sans tracking-tighter ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
            <span className={`text-[10px] sm:text-base ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</span>
        </div>

        {/* Bottom Right Corner */}
        <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 flex flex-col items-center leading-none rotate-180">
            <span className={`text-sm sm:text-xl font-bold font-sans tracking-tighter ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.rank}</span>
            <span className={`text-[10px] sm:text-base ${isRed ? 'text-red-600' : 'text-slate-900'}`}>{card.suit}</span>
        </div>

        {/* Center Content */}
        {renderContent()}
    </div>
  );
};

export default PlayingCard;