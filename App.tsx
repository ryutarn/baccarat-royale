import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw, Coins, Repeat, Eye, BookOpen, X, BarChart3, TrendingUp, HelpCircle, FastForward, Play } from 'lucide-react';
import PlayingCard from './components/PlayingCard';
import ScoreBoard from './components/ScoreBoard';
import Rules from './components/Rules';
import WinEffect from './components/WinEffect';
import { Card, BetType, GamePhase, GameResult, GameHistoryItem } from './types';
import { createDeck, calculateHandValue, INITIAL_BALANCE, DEFAULT_DECK_COUNT } from './constants';

const App: React.FC = () => {
  // Game State
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [currentBet, setCurrentBet] = useState(0);
  const [selectedBetType, setSelectedBetType] = useState<BetType>(BetType.NONE);
  
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [bankerHand, setBankerHand] = useState<Card[]>([]);
  
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [phase, setPhase] = useState<GamePhase>(GamePhase.BETTING);
  const [message, setMessage] = useState("ベットしてDEALボタンで開始");

  // UI State
  const [showRules, setShowRules] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showWinAnim, setShowWinAnim] = useState(false);
  const [lastWinAmount, setLastWinAmount] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  // Stats State
  const [stats, setStats] = useState({
    rounds: 0,
    totalBet: 0,
    totalReturn: 0,
    playerWins: 0,
    bankerWins: 0,
    ties: 0
  });

  // Rebet State
  const [lastBet, setLastBet] = useState<{amount: number, type: BetType} | null>(null);

  const deckRef = useRef<Card[]>([]);

  // Initialize deck on load
  useEffect(() => {
    resetDeck();
  }, []);

  const resetDeck = () => {
    // Create an 8-deck shoe (Standard Casino Style)
    const newDeck = createDeck(DEFAULT_DECK_COUNT);
    setDeck(newDeck);
    deckRef.current = newDeck;
    // Optional: Log to console to verify realism
    console.log(`New Shoe Created: ${DEFAULT_DECK_COUNT} decks, ${newDeck.length} cards.`);
  };

  const handleBet = (amount: number) => {
    if (phase !== GamePhase.BETTING || isAutoPlaying) return;
    
    if (selectedBetType === BetType.NONE) {
        setMessage("エリアを選択してください");
        return;
    }

    if (balance >= amount) {
      setBalance(prev => prev - amount);
      setCurrentBet(prev => prev + amount);
      setMessage(`ベット: $${(currentBet + amount).toLocaleString()}`);
    }
  };

  const clearBet = () => {
    if (phase !== GamePhase.BETTING || isAutoPlaying) return;
    setBalance(prev => prev + currentBet);
    setCurrentBet(0);
    setMessage("ベットしてDEALボタンで開始");
  };

  const handleRepeatBet = () => {
    if (phase !== GamePhase.BETTING || !lastBet || lastBet.amount === 0 || isAutoPlaying) return;
    if (currentBet > 0) {
        setMessage("既にベット済");
        return;
    }
    if (balance < lastBet.amount) {
        setMessage("残高不足");
        return;
    }

    setBalance(prev => prev - lastBet.amount);
    setCurrentBet(lastBet.amount);
    setSelectedBetType(lastBet.type);
    setMessage(`リピート: $${lastBet.amount.toLocaleString()}`);
  };

  const selectBetType = (type: BetType) => {
    if (phase !== GamePhase.BETTING || isAutoPlaying) return;
    if (currentBet > 0 && selectedBetType !== type && selectedBetType !== BetType.NONE) {
        setMessage("クリアしてください");
        return;
    }
    setSelectedBetType(type);
  };

  // --- Core Game Logic (No Animations) ---
  const executeSingleRound = (betAmount: number, betType: BetType): { result: GameResult, profit: number, pVal: number, bVal: number, pHand: Card[], bHand: Card[] } | null => {
      // Check for Reshuffle
      if (deckRef.current.length < 60) {
          resetDeck();
      }

      const currentDeck = [...deckRef.current];
      const pHand: Card[] = [];
      const bHand: Card[] = [];

      const draw = (target: 'P' | 'B') => {
          const card = currentDeck.pop();
          if (!card) return null;
          const newCard = { ...card, isFaceUp: true };
          if (target === 'P') pHand.push(newCard);
          else bHand.push(newCard);
          return newCard;
      };

      // Deal Initial
      draw('P'); draw('B'); draw('P'); draw('B');

      let pVal = calculateHandValue(pHand);
      let bVal = calculateHandValue(bHand);
      let pThirdCardValue = -1;

      // Natural Check
      if (pVal < 8 && bVal < 8) {
          // Player Draw Rules
          if (pVal <= 5) {
              const c = draw('P');
              if (c) {
                  pVal = calculateHandValue(pHand);
                  pThirdCardValue = c.value;
              }
          }

          // Banker Draw Rules
          let bankerDraws = false;
          if (pHand.length === 2) {
              if (bVal <= 5) bankerDraws = true;
          } else {
              if (bVal <= 2) bankerDraws = true;
              else if (bVal === 3 && pThirdCardValue !== 8) bankerDraws = true;
              else if (bVal === 4 && [2,3,4,5,6,7].includes(pThirdCardValue)) bankerDraws = true;
              else if (bVal === 5 && [4,5,6,7].includes(pThirdCardValue)) bankerDraws = true;
              else if (bVal === 6 && [6,7].includes(pThirdCardValue)) bankerDraws = true;
          }

          if (bankerDraws) {
              draw('B');
              bVal = calculateHandValue(bHand);
          }
      }

      let result = GameResult.TIE;
      if (pVal > bVal) result = GameResult.PLAYER_WIN;
      else if (bVal > pVal) result = GameResult.BANKER_WIN;

      deckRef.current = currentDeck;
      
      // Calculate Payout
      let payout = 0;
      if (result === GameResult.PLAYER_WIN) {
          if (betType === BetType.PLAYER) payout = betAmount * 2; 
      } else if (result === GameResult.BANKER_WIN) {
          if (betType === BetType.BANKER) payout = betAmount * 2;
      } else {
          if (betType === BetType.TIE) {
              payout = betAmount + (betAmount * 8);
          } else {
              payout = betAmount; // Push
      }
      }

      return { result, profit: payout - betAmount, pVal, bVal, pHand, bHand };
  };

  const handleAutoPlay10 = async () => {
      if (phase !== GamePhase.BETTING) return;

      setIsAutoPlaying(true);
      setPhase(GamePhase.DEALING);
      
      const betAmount = currentBet;
      const betType = selectedBetType;
      
      if (betAmount > 0) {
        setLastBet({ amount: betAmount, type: betType });
      }

      let localBalance = balance; 
      let gamesPlayed = 0;

      for (let i = 0; i < 10; i++) {
          setMessage(`AUTO PLAY: ${i + 1}/10`);
          
          if (i > 0 && betAmount > 0) {
              if (localBalance < betAmount) {
                  setMessage("残高不足のため終了");
                  await new Promise(r => setTimeout(r, 1000));
                  break;
              }
              localBalance -= betAmount;
              setBalance(prev => prev - betAmount); 
          }

          const round = executeSingleRound(betAmount, betType);
          if (!round) break;

          if (betAmount > 0) {
             localBalance += (round.profit + betAmount);
          }
          
          setDeck([...deckRef.current]); 
          setPlayerHand(round.pHand);
          setBankerHand(round.bHand);
          
          if (betAmount > 0) {
             setBalance(prev => prev + (round.profit + betAmount));
          }
          
          setStats(prev => ({
            rounds: prev.rounds + 1,
            totalBet: prev.totalBet + betAmount,
            totalReturn: prev.totalReturn + (round.profit + betAmount),
            playerWins: prev.playerWins + (round.result === GameResult.PLAYER_WIN ? 1 : 0),
            bankerWins: prev.bankerWins + (round.result === GameResult.BANKER_WIN ? 1 : 0),
            ties: prev.ties + (round.result === GameResult.TIE ? 1 : 0)
          }));

          const newItem: GameHistoryItem = {
              id: 0, 
              result: round.result,
              playerScore: round.pVal,
              bankerScore: round.bVal,
              betAmount: betAmount,
              betType: betType,
              profit: round.profit
          };

          setHistory(prev => {
              const id = prev.length + 1;
              return [{...newItem, id}, ...prev].slice(0, 1000);
          });

          gamesPlayed++;
          await new Promise(r => setTimeout(r, 50)); 
      }

      setPhase(GamePhase.RESULT);
      setIsAutoPlaying(false);
      setMessage(`${gamesPlayed}ゲーム完了`);
  };

  const dealGame = async () => {
    if (currentBet === 0 && balance < 0) {
        setMessage("ベットしてください");
        return;
    }
    
    setPhase(GamePhase.DEALING);
    setMessage("カードを配っています...");
    setPlayerHand([]);
    setBankerHand([]);

    // Check deck size
    // In an 8-deck shoe, the "Cut Card" is usually placed about 1 deck (52 cards) from the end.
    // If we drop below ~60 cards, we reshuffle the shoe.
    if (deckRef.current.length < 60) {
      setMessage("シュー交換 (シャッフル中)...");
      await new Promise(r => setTimeout(r, 1500));
      resetDeck();
      setMessage("新しいシューで開始します");
      await new Promise(r => setTimeout(r, 1000));
    }

    const currentDeck = [...deckRef.current];
    const pHand: Card[] = [];
    const bHand: Card[] = [];

    // Helper to draw
    const drawCard = (target: 'P' | 'B', isFaceUp: boolean = true) => {
      const card = currentDeck.pop();
      if (!card) return null;
      const newCard = { ...card, isFaceUp }; 
      if (target === 'P') {
        pHand.push(newCard);
        setPlayerHand([...pHand]);
      } else {
        bHand.push(newCard);
        setBankerHand([...bHand]);
      }
      return newCard;
    };

    // --- Dealing Animation ---
    await new Promise(r => setTimeout(r, 300));
    drawCard('P', false);
    await new Promise(r => setTimeout(r, 300));
    drawCard('B', false);
    await new Promise(r => setTimeout(r, 300));
    drawCard('P', false);
    await new Promise(r => setTimeout(r, 300));
    drawCard('B', false);

    setMessage("カードオープン...");
    await new Promise(r => setTimeout(r, 600));

    // Reveal Initial Cards
    setPlayerHand(prev => prev.map(c => ({ ...c, isFaceUp: true })));
    pHand.forEach(c => c.isFaceUp = true);
    setBankerHand(prev => prev.map(c => ({ ...c, isFaceUp: true })));
    bHand.forEach(c => c.isFaceUp = true);

    await new Promise(r => setTimeout(r, 800));

    let pVal = calculateHandValue(pHand);
    let bVal = calculateHandValue(bHand);
    let pThirdCardValue = -1;

    // Natural Win Check
    let isFinished = false;
    if (pVal >= 8 || bVal >= 8) {
      isFinished = true;
      setMessage(pVal >= 8 && bVal >= 8 ? "ナチュラル！ (引き分け)" : pVal >= 8 ? "ナチュラル！ (プレイヤー)" : "ナチュラル！ (バンカー)");
      await new Promise(r => setTimeout(r, 1500));
    }

    // Third Card Rules
    if (!isFinished) {
      // Player Rule
      if (pVal <= 5) {
        setMessage("プレイヤー: 3枚目");
        await new Promise(r => setTimeout(r, 1000));
        const c = drawCard('P', true); 
        if (c) {
            pVal = calculateHandValue(pHand);
            pThirdCardValue = c.value;
        }
        await new Promise(r => setTimeout(r, 800));
      } else {
         setMessage("プレイヤー: スタンド");
         await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Banker Rule
      let bankerDraws = false;
      if (pHand.length === 2) {
        if (bVal <= 5) bankerDraws = true;
      } else {
        if (bVal <= 2) bankerDraws = true;
        else if (bVal === 3 && pThirdCardValue !== 8) bankerDraws = true;
        else if (bVal === 4 && [2,3,4,5,6,7].includes(pThirdCardValue)) bankerDraws = true;
        else if (bVal === 5 && [4,5,6,7].includes(pThirdCardValue)) bankerDraws = true;
        else if (bVal === 6 && [6,7].includes(pThirdCardValue)) bankerDraws = true;
      }

      if (bankerDraws) {
        setMessage("バンカー: 3枚目");
        await new Promise(r => setTimeout(r, 1000));
        drawCard('B', true);
        bVal = calculateHandValue(bHand);
        await new Promise(r => setTimeout(r, 800));
      } else {
         setMessage("バンカー: スタンド");
         await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Determine Result
    let result = GameResult.TIE;
    if (pVal > bVal) result = GameResult.PLAYER_WIN;
    else if (bVal > pVal) result = GameResult.BANKER_WIN;

    deckRef.current = currentDeck;
    setDeck(currentDeck);
    finishGame(result, pVal, bVal);
  };

  const finishGame = (result: GameResult, pScore: number, bScore: number) => {
    setPhase(GamePhase.RESULT);
    
    if (currentBet > 0) {
        setLastBet({ amount: currentBet, type: selectedBetType });
    }

    let payout = 0;
    
    if (currentBet > 0) {
        if (result === GameResult.PLAYER_WIN) {
            if (selectedBetType === BetType.PLAYER) payout = currentBet * 2; 
        } else if (result === GameResult.BANKER_WIN) {
            if (selectedBetType === BetType.BANKER) payout = currentBet * 2;
        } else {
            if (selectedBetType === BetType.TIE) {
                // TIE pays 8:1 (Total return = bet + 8*bet)
                payout = currentBet + (currentBet * 8);
            } else {
                payout = currentBet; // Push
            }
        }
        setBalance(prev => prev + payout);
    }
    
    const profit = payout - currentBet;
    
    // Win Animation Trigger
    if (profit > 0) {
        setLastWinAmount(profit);
        setShowWinAnim(true);
        setMessage("勝利！");
    } else if (currentBet > 0 && profit === 0) {
        setMessage("引き分け (返金)");
    } else if (currentBet > 0) {
        setMessage("ハズレ...");
    } else {
        setMessage(result === GameResult.PLAYER_WIN ? "プレイヤーの勝利" : result === GameResult.BANKER_WIN ? "バンカーの勝利" : "引き分け (TIE)");
    }
    
    setStats(prev => ({
        rounds: prev.rounds + 1,
        totalBet: prev.totalBet + currentBet,
        totalReturn: prev.totalReturn + payout,
        playerWins: prev.playerWins + (result === GameResult.PLAYER_WIN ? 1 : 0),
        bankerWins: prev.bankerWins + (result === GameResult.BANKER_WIN ? 1 : 0),
        ties: prev.ties + (result === GameResult.TIE ? 1 : 0)
    }));

    const newHistoryItem: GameHistoryItem = {
      id: history.length + 1,
      result,
      playerScore: pScore,
      bankerScore: bScore,
      betAmount: currentBet,
      betType: selectedBetType,
      profit: profit
    };

    setHistory(prev => [newHistoryItem, ...prev].slice(0, 1000)); 
  };

  const resetGame = () => {
    setPlayerHand([]);
    setBankerHand([]);
    setCurrentBet(0);
    setMessage("ベットしてDEALボタンで開始");
    setPhase(GamePhase.BETTING);
    setShowWinAnim(false);
  };

  const getScoreDisplay = (hand: Card[], label: string) => {
    const allFaceUp = hand.every(c => c.isFaceUp);
    const val = calculateHandValue(hand);
    
    return (
      <div className="flex flex-col items-center z-20">
        <div className={`rounded-full px-3 py-0.5 text-xl sm:text-2xl font-bold border-2 shadow-lg min-w-[50px] text-center transition-all duration-300 backdrop-blur-sm
             ${allFaceUp 
                ? (label === 'PLAYER' ? 'bg-blue-900/80 border-blue-400 text-white shadow-blue-500/30' : 'bg-red-900/80 border-red-400 text-white shadow-red-500/30')
                : 'bg-black/40 border-white/10 text-transparent'}
        `}>
            {allFaceUp && hand.length > 0 ? val : '?'}
        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] w-full bg-[#1a3c2f] text-white font-sans overflow-hidden flex flex-col">
      
      {/* --- Win Animation Overlay --- */}
      {showWinAnim && (
        <WinEffect 
            amount={lastWinAmount} 
            onComplete={() => setShowWinAnim(false)} 
        />
      )}

      {/* --- Header --- */}
      <header className="bg-[#111] border-b border-[#ffd700]/30 px-3 py-1 flex justify-between items-center shrink-0 h-12 z-30 shadow-2xl relative">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <h1 className="text-sm font-serif font-bold text-[#ffd700] tracking-widest leading-none drop-shadow-sm">BACCARAT</h1>
            <span className="text-[9px] text-gray-400 tracking-[0.3em] uppercase">Royale Casino</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-gray-900 to-black px-3 py-1 rounded border border-[#ffd700]/30 shadow-inner">
                <span className="text-[10px] text-gray-500 font-bold mr-1">BALANCE</span>
                <span className="font-mono text-base font-bold text-[#ffd700] tracking-wide text-shadow-gold">${balance.toLocaleString()}</span>
            </div>
            
            <button 
                onClick={() => setShowStats(true)}
                className="p-1.5 text-gray-400 hover:text-white transition"
            >
                <BarChart3 size={18} />
            </button>

            <button 
                onClick={() => setShowRules(true)}
                className="lg:hidden p-1.5 text-gray-400 hover:text-white transition"
            >
                <HelpCircle size={18} />
            </button>
        </div>
      </header>

      {/* --- Main Game Table --- */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Top: Scoreboard */}
        <div className="shrink-0 z-20 w-full bg-[#111] border-b border-[#ffd700]/20 shadow-md">
           <div className="w-full flex justify-center py-1">
              <ScoreBoard history={history} />
           </div>
        </div>

        {/* Center: The Felt (Game Area) */}
        <div className="flex-1 relative flex flex-col items-center w-full casino-felt overflow-hidden">
            
            {/* Table Graphics (SVG Overlay) */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                 {/* Center Line / Arc */}
                 <svg className="w-full h-full" viewBox="0 0 400 600" preserveAspectRatio="none">
                    <path d="M -50 300 Q 200 350 450 300" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="5,5" opacity="0.5" />
                 </svg>
            </div>

            {/* --- CARDS LAYOUT --- */}
            <div className="flex-1 w-full max-w-4xl flex flex-col relative z-10 py-2 sm:py-6 px-2 gap-1 sm:gap-2 justify-center">
                
                {/* Banker Section (Top) */}
                <div className="flex-1 w-full flex flex-col items-center justify-center relative rounded-2xl border border-red-500/20 bg-gradient-to-b from-red-950/40 to-transparent shadow-[inset_0_0_20px_rgba(153,27,27,0.1)] min-h-0">
                    <div className="absolute top-2 left-4 text-xs font-serif text-red-400/50 tracking-widest font-bold">BANKER</div>
                    <div className="flex flex-col items-center gap-1 sm:gap-4 w-full">
                        {getScoreDisplay(bankerHand, 'BANKER')}
                        <div className="flex justify-center -space-x-6 sm:-space-x-10 h-28 sm:h-36 perspective-1000">
                             {bankerHand.length === 0 ? (
                                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 border-dashed border-red-500/10 flex items-center justify-center bg-red-900/5">
                                    <span className="text-red-300/10 text-xs font-serif">BANKER</span>
                                </div>
                             ) : (
                                bankerHand.map(card => <PlayingCard key={card.id} card={card} />)
                             )}
                        </div>
                    </div>
                </div>

                {/* Dealer Message / Status (Center) */}
                <div className="w-full flex justify-center z-30 shrink-0 py-1">
                     <div className={`
                        px-6 py-1 sm:py-1.5 rounded-full border backdrop-blur-md shadow-2xl transition-all duration-300 font-serif tracking-widest text-xs sm:text-sm
                        ${message.includes('勝利') || message.includes('ナチュラル') ? 'bg-[#ffd700] text-black border-white animate-pulse font-bold' : 'bg-black/60 text-[#ffd700] border-[#ffd700]/30'}
                     `}>
                        {message}
                     </div>
                </div>

                {/* Player Section (Bottom) */}
                <div className="flex-1 w-full flex flex-col items-center justify-center relative rounded-2xl border border-blue-500/20 bg-gradient-to-t from-blue-950/40 to-transparent shadow-[inset_0_0_20px_rgba(30,58,138,0.1)] min-h-0">
                    <div className="absolute bottom-2 left-4 text-xs font-serif text-blue-400/50 tracking-widest font-bold">PLAYER</div>
                    <div className="flex flex-col items-center gap-1 sm:gap-4 w-full">
                        <div className="flex justify-center -space-x-6 sm:-space-x-10 h-28 sm:h-36 perspective-1000 order-2">
                            {playerHand.length === 0 ? (
                                <div className="w-20 h-28 sm:w-24 sm:h-36 rounded-lg border-2 border-dashed border-blue-500/10 flex items-center justify-center bg-blue-900/5">
                                    <span className="text-blue-300/10 text-xs font-serif">PLAYER</span>
                                </div>
                             ) : (
                                playerHand.map(card => <PlayingCard key={card.id} card={card} />)
                             )}
                        </div>
                        <div className="order-1">
                             {getScoreDisplay(playerHand, 'PLAYER')}
                        </div>
                    </div>
                </div>
            </div>

        </div>

        {/* --- Betting & Controls (Bottom) --- */}
        <div className="shrink-0 w-full flex flex-col leather-texture border-t-4 border-[#1a1a1a] shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-40">
            
            {/* Betting Zones - Styled as printed felt */}
            <div className="w-full bg-[#224433] px-2 pt-2 pb-1 flex justify-center relative shadow-inner">
                 {/* Felt Texture overlay for this strip */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/felt.png')]"></div>
                 
                 <div className="w-full max-w-2xl h-16 sm:h-24 flex gap-2 relative z-10">
                    
                    {/* PLAYER BET */}
                    <button
                        disabled={phase !== GamePhase.BETTING || isAutoPlaying}
                        onClick={() => selectBetType(BetType.PLAYER)}
                        className={`flex-1 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group
                            ${selectedBetType === BetType.PLAYER 
                                ? 'bg-blue-900/40 border-[#ffd700] shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]' 
                                : 'bg-transparent border-blue-400/20 hover:bg-white/5 hover:border-blue-400/40'
                            }
                        `}
                    >
                         <div className="font-serif text-blue-200 font-bold tracking-widest text-sm sm:text-xl drop-shadow-md">PLAYER</div>
                         <div className="text-[10px] text-blue-300/60 font-mono mt-0.5">1:1</div>
                         {selectedBetType === BetType.PLAYER && currentBet > 0 && (
                            <div className="absolute bottom-1 sm:bottom-2">
                                <div className="bg-yellow-500 text-black font-bold text-[10px] rounded-full px-2 shadow-lg border border-white">
                                    ${currentBet}
                                </div>
                            </div>
                         )}
                    </button>

                    {/* TIE BET */}
                    <button
                        disabled={phase !== GamePhase.BETTING || isAutoPlaying}
                        onClick={() => selectBetType(BetType.TIE)}
                        className={`w-1/4 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group
                            ${selectedBetType === BetType.TIE 
                                ? 'bg-green-900/40 border-[#ffd700] shadow-[inset_0_0_20px_rgba(34,197,94,0.3)]' 
                                : 'bg-transparent border-green-400/20 hover:bg-white/5 hover:border-green-400/40'
                            }
                        `}
                    >
                         <div className="font-serif text-green-200 font-bold tracking-widest text-xs sm:text-lg drop-shadow-md">TIE</div>
                         <div className="text-[10px] text-green-300/60 font-mono mt-0.5">8:1</div>
                         {selectedBetType === BetType.TIE && currentBet > 0 && (
                            <div className="absolute bottom-1 sm:bottom-2">
                                <div className="bg-yellow-500 text-black font-bold text-[10px] rounded-full px-2 shadow-lg border border-white">
                                    ${currentBet}
                                </div>
                            </div>
                         )}
                    </button>

                    {/* BANKER BET */}
                    <button
                        disabled={phase !== GamePhase.BETTING || isAutoPlaying}
                        onClick={() => selectBetType(BetType.BANKER)}
                        className={`flex-1 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative overflow-hidden group
                            ${selectedBetType === BetType.BANKER 
                                ? 'bg-red-900/40 border-[#ffd700] shadow-[inset_0_0_20px_rgba(239,68,68,0.3)]' 
                                : 'bg-transparent border-red-400/20 hover:bg-white/5 hover:border-red-400/40'
                            }
                        `}
                    >
                         <div className="font-serif text-red-200 font-bold tracking-widest text-sm sm:text-xl drop-shadow-md">BANKER</div>
                         <div className="text-[10px] text-red-300/60 font-mono mt-0.5">1:1</div>
                         {selectedBetType === BetType.BANKER && currentBet > 0 && (
                            <div className="absolute bottom-1 sm:bottom-2">
                                <div className="bg-yellow-500 text-black font-bold text-[10px] rounded-full px-2 shadow-lg border border-white">
                                    ${currentBet}
                                </div>
                            </div>
                         )}
                    </button>
                 </div>
            </div>

            {/* Chips & Actions */}
            <div className="p-3 sm:p-4 flex items-center justify-center gap-4">
                 
                 {/* Left Controls */}
                 <div className="flex gap-2">
                     <button onClick={clearBet} disabled={phase !== GamePhase.BETTING || currentBet === 0 || isAutoPlaying} className="w-10 h-10 rounded-full border border-gray-600 bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 disabled:opacity-30">
                        <X size={16} />
                     </button>
                     <button onClick={handleRepeatBet} disabled={phase !== GamePhase.BETTING || !lastBet || currentBet > 0 || isAutoPlaying} className="w-10 h-10 rounded-full border border-gray-600 bg-gray-800 text-gray-400 flex items-center justify-center hover:bg-gray-700 disabled:opacity-30">
                        <Repeat size={16} />
                     </button>
                 </div>

                 {/* Chips */}
                 <div className="flex bg-black/40 rounded-full p-1 border border-white/10 gap-1 sm:gap-3 px-3 overflow-x-auto scrollbar-hide">
                    {[50, 100, 250, 500].map(amt => (
                        <button
                            key={amt}
                            onClick={() => handleBet(amt)}
                            disabled={phase !== GamePhase.BETTING || balance < amt || isAutoPlaying}
                            className={`w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-full border-4 shadow-lg flex items-center justify-center text-[10px] font-bold transition-transform hover:-translate-y-1 active:scale-95 chip-shadow
                                ${amt === 50 ? 'bg-blue-600 border-blue-400 border-dashed text-white' : 
                                  amt === 100 ? 'bg-red-600 border-red-400 border-dashed text-white' :
                                  amt === 250 ? 'bg-green-600 border-green-400 border-dashed text-white' :
                                  'bg-black border-[#ffd700] text-[#ffd700]'}
                                ${balance < amt ? 'opacity-40 grayscale' : ''}
                            `}
                        >
                            {amt}
                        </button>
                    ))}
                 </div>

                 {/* Main Action Button */}
                 <div className="flex-1 max-w-[150px] flex gap-2">
                    {phase === GamePhase.RESULT ? (
                        <button onClick={resetGame} className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg shadow-[0_0_15px_rgba(234,179,8,0.5)] border-b-4 border-yellow-700 active:border-b-0 active:translate-y-1 transition-all flex items-center justify-center gap-2">
                            <RotateCcw size={18} /> NEXT
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={dealGame} 
                                disabled={phase !== GamePhase.BETTING || isAutoPlaying}
                                className={`${currentBet === 0 ? 'w-12 shrink-0 px-0' : 'flex-1 min-w-[80px]'} h-12 font-bold rounded-lg border-b-4 transition-all flex items-center justify-center gap-1
                                    ${phase === GamePhase.BETTING && !isAutoPlaying
                                        ? 'bg-green-600 hover:bg-green-500 text-white border-green-800 shadow-[0_0_15px_rgba(22,163,74,0.5)] active:border-b-0 active:translate-y-1' 
                                        : 'bg-gray-700 text-gray-500 border-gray-900 cursor-not-allowed'}
                                `}
                            >
                                {phase === GamePhase.DEALING && !isAutoPlaying ? '...' : (currentBet === 0 ? <Play size={24} fill="currentColor" /> : 'DEAL')}
                            </button>
                            
                            {/* Auto 10x Button - Only show when no bet (Watch mode) */}
                            {currentBet === 0 && (
                                <button 
                                    onClick={handleAutoPlay10}
                                    disabled={phase !== GamePhase.BETTING || isAutoPlaying}
                                    className={`w-12 h-12 shrink-0 font-bold rounded-lg border-b-4 transition-all flex flex-col items-center justify-center
                                        ${phase === GamePhase.BETTING && !isAutoPlaying
                                            ? 'bg-purple-600 hover:bg-purple-500 text-white border-purple-800 shadow-[0_0_15px_rgba(147,51,234,0.5)] active:border-b-0 active:translate-y-1' 
                                            : 'bg-gray-700 text-gray-500 border-gray-900 cursor-not-allowed'}
                                    `}
                                    title="Auto Play 10 Rounds"
                                >
                                    <FastForward size={18} />
                                    <span className="text-[9px]">x10</span>
                                </button>
                            )}
                        </>
                    )}
                 </div>

            </div>
        </div>

      </main>

      {/* Rules Modal (Mobile/Desktop shared for cleanliness in this layout) */}
      {(showRules || showStats) && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
             <div className="bg-[#1a1a1a] w-full max-w-lg max-h-[80vh] rounded-xl border border-[#ffd700]/20 shadow-2xl flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#111]">
                    <h2 className="text-[#ffd700] font-serif font-bold tracking-widest">
                        {showRules ? 'GAME RULES' : 'STATISTICS'}
                    </h2>
                    <button 
                        onClick={() => { setShowRules(false); setShowStats(false); }}
                        className="text-gray-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {showRules ? <Rules /> : (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded text-center">
                                    <div className="text-xs text-gray-400 uppercase mb-1">Total Bet</div>
                                    <div className="text-xl font-mono text-white">${stats.totalBet.toLocaleString()}</div>
                                </div>
                                <div className="bg-white/5 p-4 rounded text-center">
                                    <div className="text-xs text-gray-400 uppercase mb-1">Win/Loss</div>
                                    <div className={`text-xl font-mono font-bold ${stats.totalReturn - stats.totalBet >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                        {stats.totalReturn - stats.totalBet >= 0 ? '+' : ''}${(stats.totalReturn - stats.totalBet).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded">
                                <h3 className="text-gray-400 text-xs uppercase mb-2">Round History</h3>
                                <div className="h-40 overflow-y-auto text-xs space-y-1">
                                    {history.map(h => (
                                        <div key={h.id} className="flex justify-between border-b border-white/5 pb-1">
                                            <span className="text-gray-500">#{h.id}</span>
                                            <span className={h.result === GameResult.PLAYER_WIN ? 'text-blue-400' : h.result === GameResult.BANKER_WIN ? 'text-red-400' : 'text-green-400'}>{h.result}</span>
                                            <span className="font-mono text-white">{h.profit > 0 ? '+' : ''}{h.profit}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
             </div>
        </div>
      )}
    </div>
  );
};

export default App;