import React, { useState, useEffect } from 'react';
import { GameHistoryItem, GameResult } from '../types';
import { ChevronLeft, ChevronRight, ListFilter } from 'lucide-react';

interface ScoreBoardProps {
  history: GameHistoryItem[];
}

interface BoardColumn {
  items: GameResult[];
}

type StatsRange = 10 | 50 | 100 | 'ALL';

const ScoreBoard: React.FC<ScoreBoardProps> = ({ history }) => {
  const [page, setPage] = useState(0);
  const [statsRange, setStatsRange] = useState<StatsRange>('ALL');

  // Requested to always be 25 columns
  const colsPerPage = 25;
  const ROWS = 6;

  // Process history into columns (Big Road style logic)
  const calculateColumns = () => {
    // Need to process from oldest to newest for the Grid
    const sortedHistory = [...history].sort((a, b) => a.id - b.id);
    
    const columns: BoardColumn[] = [];
    if (sortedHistory.length === 0) return [];

    let currentCol: GameResult[] = [];
    let lastResult: GameResult | null = null;

    sortedHistory.forEach((item) => {
        if (currentCol.length === 0) {
            currentCol.push(item.result);
            lastResult = item.result;
        } else {
            // Stack logic
            if (item.result === lastResult) {
                // Stack vertically
                if (currentCol.length < ROWS) {
                    currentCol.push(item.result);
                } else {
                    // Overflow vertical -> Move to next column
                    columns.push({ items: currentCol });
                    currentCol = [item.result];
                }
            } else {
                // Different winner -> New column
                columns.push({ items: currentCol });
                currentCol = [item.result];
                lastResult = item.result;
            }
        }
    });

    // Push the final column
    if (currentCol.length > 0) {
        columns.push({ items: currentCol });
    }

    return columns;
  };

  const allColumns = calculateColumns();
  const totalPages = Math.ceil(allColumns.length / colsPerPage) || 1;
  
  // Auto-switch to last page when history updates
  useEffect(() => {
    setPage(Math.max(0, totalPages - 1));
  }, [history.length, totalPages]);

  const displayColumns = allColumns.slice(page * colsPerPage, (page + 1) * colsPerPage);

  // Fill empty columns
  const filledColumns = [...displayColumns];
  while (filledColumns.length < colsPerPage) {
    filledColumns.push({ items: [] });
  }

  const getBgColor = (result: GameResult) => {
    switch (result) {
      case GameResult.PLAYER_WIN: return 'bg-blue-600 border-blue-400 shadow-[0_0_8px_rgba(37,99,235,0.8)]';
      case GameResult.BANKER_WIN: return 'bg-red-600 border-red-400 shadow-[0_0_8px_rgba(220,38,38,0.8)]';
      case GameResult.TIE: return 'bg-green-600 border-green-400 shadow-[0_0_8px_rgba(22,163,74,0.8)]';
      default: return 'bg-transparent';
    }
  };

  const getLabel = (result: GameResult) => {
    switch (result) {
      case GameResult.PLAYER_WIN: return 'P';
      case GameResult.BANKER_WIN: return 'B';
      case GameResult.TIE: return 'T';
      default: return '';
    }
  };

  // --- Stats Calculation Logic ---
  const toggleStatsRange = () => {
    if (statsRange === 'ALL') setStatsRange(10);
    else if (statsRange === 10) setStatsRange(50);
    else if (statsRange === 50) setStatsRange(100);
    else setStatsRange('ALL');
  };

  // Filter history for stats only (history is sorted Newest -> Oldest in App.tsx)
  const statsHistory = statsRange === 'ALL' 
    ? history 
    : history.slice(0, statsRange);

  const statsTotal = statsHistory.length;
  const stats = statsHistory.reduce((acc, curr) => {
    acc[curr.result]++;
    return acc;
  }, { [GameResult.PLAYER_WIN]: 0, [GameResult.BANKER_WIN]: 0, [GameResult.TIE]: 0 });

  const getRate = (count: number) => {
      if (statsTotal === 0) return 0;
      return Math.round((count / statsTotal) * 100);
  }

  return (
    <div className="h-full flex gap-1.5 sm:gap-4 items-center relative z-20 px-2 sm:px-4 w-full justify-between">
      
      {/* Grid Container */}
      <div className="flex-1 flex flex-col items-center min-w-0">
        <div className="w-full flex justify-between items-center bg-[#1a1a1a] px-1 py-0.5 rounded-t border-x border-t border-white/10 text-[10px] text-gray-400">
             <span>HISTORY ({page + 1}/{totalPages})</span>
             <div className="flex gap-1">
                 <button 
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="p-0.5 hover:text-white disabled:opacity-30"
                 >
                     <ChevronLeft size={14} />
                 </button>
                 <button 
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page === totalPages - 1}
                    className="p-0.5 hover:text-white disabled:opacity-30"
                 >
                     <ChevronRight size={14} />
                 </button>
             </div>
        </div>
        <div className="overflow-hidden flex justify-center w-full bg-[#1a1a1a] p-1 rounded-b border border-white/10 shadow-inner h-[85px] sm:h-[120px]">
            {/* Render Columns */}
            {filledColumns.map((col, colIndex) => (
                <div key={colIndex} className="flex flex-col gap-[1px] sm:gap-[2px] flex-1 max-w-[13px] sm:max-w-[18px]">
                    {Array.from({ length: ROWS }).map((_, rowIndex) => {
                        const item = col.items[rowIndex];
                        return (
                            <div 
                                key={rowIndex}
                                className={`aspect-square w-full rounded-full border flex items-center justify-center text-[7px] sm:text-[10px] font-bold text-white
                                    ${item ? getBgColor(item) : 'bg-[#222] border-[#333] opacity-30'}
                                `}
                            >
                                {item ? getLabel(item) : ''}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
      </div>

      {/* Mini Stats Panel */}
      <div className="flex flex-col justify-center gap-0.5 sm:gap-1 text-[9px] sm:text-xs font-mono w-[85px] sm:w-[110px] bg-white/5 p-1 sm:p-2 rounded border border-white/10 shrink-0">
          {/* Stats Range Toggle Button */}
          <button 
            onClick={toggleStatsRange}
            className="flex items-center justify-between text-[8px] sm:text-[10px] text-yellow-500 hover:text-yellow-300 border-b border-white/10 pb-1 mb-0.5 w-full transition-colors"
          >
            <span className="font-bold flex items-center gap-1">
                <ListFilter size={10} />
                {statsRange === 'ALL' ? 'ALL GAMES' : `LAST ${statsRange}`}
            </span>
          </button>

          <div className="flex justify-between items-center text-blue-300 border-b border-white/5 pb-0.5">
            <span className="font-bold">PLAYER</span> 
            <div className="flex gap-1">
                <span className="text-gray-400">{getRate(stats[GameResult.PLAYER_WIN])}%</span>
                <span className="bg-blue-900/50 px-1 rounded min-w-[18px] text-center">{stats[GameResult.PLAYER_WIN]}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-red-300 border-b border-white/5 pb-0.5 pt-0.5">
            <span className="font-bold">BANKER</span> 
            <div className="flex gap-1">
                <span className="text-gray-400">{getRate(stats[GameResult.BANKER_WIN])}%</span>
                <span className="bg-red-900/50 px-1 rounded min-w-[18px] text-center">{stats[GameResult.BANKER_WIN]}</span>
            </div>
          </div>
          <div className="flex justify-between items-center text-green-300 border-b border-white/5 pb-0.5 pt-0.5">
            <span className="font-bold">TIE</span> 
            <div className="flex gap-1">
                <span className="text-gray-400">{getRate(stats[GameResult.TIE])}%</span>
                <span className="bg-green-900/50 px-1 rounded min-w-[18px] text-center">{stats[GameResult.TIE]}</span>
            </div>
          </div>
          <div className="mt-0.5 pt-0.5 flex justify-between text-gray-400 font-bold">
            <span className="">TOTAL</span> 
            <span>{statsTotal}</span>
          </div>
      </div>
    </div>
  );
};

export default ScoreBoard;