import { Card, Suit } from './types';

export const INITIAL_BALANCE = 10000;
export const MAX_HISTORY = 100;

// Standard Baccarat usually uses 8 decks.
export const DEFAULT_DECK_COUNT = 8; 

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export const createDeck = (numDecks: number = DEFAULT_DECK_COUNT): Card[] => {
  const deck: Card[] = [];
  const suits = [Suit.HEARTS, Suit.DIAMONDS, Suit.CLUBS, Suit.SPADES];

  // Create multiple decks combined
  for (let i = 0; i < numDecks; i++) {
    suits.forEach((suit) => {
      RANKS.forEach((rank) => {
        let value = parseInt(rank);
        if (rank === 'A') value = 1;
        if (['10', 'J', 'Q', 'K'].includes(rank)) value = 0;

        deck.push({
          suit,
          rank,
          value,
          // Ensure unique ID across multiple decks
          id: `${suit}-${rank}-${i}-${Math.random().toString(36).substr(2, 9)}`,
          isFaceUp: true
        });
      });
    });
  }

  // Fisher-Yates shuffle for the entire shoe
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
};

export const calculateHandValue = (hand: Card[]): number => {
  const sum = hand.reduce((acc, card) => acc + card.value, 0);
  return sum % 10;
};