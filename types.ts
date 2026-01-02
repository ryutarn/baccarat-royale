export enum Suit {
  HEARTS = '♥',
  DIAMONDS = '♦',
  CLUBS = '♣',
  SPADES = '♠'
}

export interface Card {
  suit: Suit;
  rank: string;
  value: number; // 0 for 10, J, Q, K
  id: string; // Unique ID for React keys
  isFaceUp: boolean;
}

export enum BetType {
  PLAYER = 'PLAYER',
  BANKER = 'BANKER',
  TIE = 'TIE',
  NONE = 'NONE'
}

export enum GameResult {
  PLAYER_WIN = 'PLAYER_WIN',
  BANKER_WIN = 'BANKER_WIN',
  TIE = 'TIE'
}

export interface GameHistoryItem {
  id: number;
  result: GameResult;
  playerScore: number;
  bankerScore: number;
  pair?: boolean;
  betAmount: number;
  betType: BetType;
  profit: number;
}

export enum GamePhase {
  BETTING = 'BETTING',
  DEALING = 'DEALING',
  RESULT = 'RESULT'
}