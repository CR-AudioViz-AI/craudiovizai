// /app/games/page.tsx
// Games Hub - CR AudioViz AI / Javari
// Extensive library of casual games - free to play!

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Game {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  plays: number;
  rating: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
}

interface Category {
  id: string;
  name: string;
  icon: string;
}

const CATEGORIES: Category[] = [
  { id: 'all', name: 'All Games', icon: '🎮' },
  { id: 'puzzle', name: 'Puzzle', icon: '🧩' },
  { id: 'arcade', name: 'Arcade', icon: '👾' },
  { id: 'action', name: 'Action', icon: '⚔️' },
  { id: 'strategy', name: 'Strategy', icon: '🧠' },
  { id: 'card', name: 'Card Games', icon: '🃏' },
  { id: 'word', name: 'Word Games', icon: '📝' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'racing', name: 'Racing', icon: '🏎️' },
  { id: 'casual', name: 'Casual', icon: '🎈' },
  { id: 'multiplayer', name: 'Multiplayer', icon: '👥' }
];

const GAMES: Game[] = [
  { id: '1', title: '2048', description: 'Slide and combine tiles to reach 2048', thumbnail: '🔢', category: 'puzzle', plays: 125000, rating: 4.8, isFeatured: true },
  { id: '2', title: 'Sudoku Master', description: 'Classic number puzzle with daily challenges', thumbnail: '9️⃣', category: 'puzzle', plays: 89000, rating: 4.7 },
  { id: '3', title: 'Block Blast', description: 'Clear blocks and score combos', thumbnail: '🟦', category: 'puzzle', plays: 67000, rating: 4.5 },
  { id: '4', title: 'Match 3 Mania', description: 'Match colorful gems in this addictive puzzler', thumbnail: '💎', category: 'puzzle', plays: 156000, rating: 4.6, isHot: true },
  { id: '5', title: 'Space Invaders', description: 'Classic alien shooter action', thumbnail: '👽', category: 'arcade', plays: 234000, rating: 4.9, isFeatured: true },
  { id: '6', title: 'Pac Runner', description: 'Eat dots and avoid ghosts', thumbnail: '😮', category: 'arcade', plays: 178000, rating: 4.7 },
  { id: '7', title: 'Brick Breaker', description: 'Break all the bricks with your paddle', thumbnail: '🧱', category: 'arcade', plays: 98000, rating: 4.4 },
  { id: '8', title: 'Flappy Clone', description: 'Navigate through pipes - how far can you go?', thumbnail: '🐦', category: 'arcade', plays: 445000, rating: 4.3, isHot: true },
  { id: '9', title: 'Ninja Slash', description: 'Slice through enemies with precision', thumbnail: '🥷', category: 'action', plays: 67000, rating: 4.5 },
  { id: '10', title: 'Tank Battle', description: 'Destroy enemy tanks in this classic', thumbnail: '🎯', category: 'action', plays: 54000, rating: 4.4, isNew: true },
  { id: '11', title: 'Chess Master', description: 'Play against AI or friends', thumbnail: '♟️', category: 'strategy', plays: 189000, rating: 4.9, isFeatured: true },
  { id: '12', title: 'Checkers', description: 'Classic board game strategy', thumbnail: '⚫', category: 'strategy', plays: 78000, rating: 4.5 },
  { id: '13', title: 'Tower Defense', description: 'Build towers and stop the invasion', thumbnail: '🏰', category: 'strategy', plays: 123000, rating: 4.7 },
  { id: '14', title: 'Solitaire', description: 'The classic card game', thumbnail: '🂡', category: 'card', plays: 567000, rating: 4.8, isFeatured: true },
  { id: '15', title: 'Blackjack', description: 'Try to beat the dealer at 21', thumbnail: '🃑', category: 'card', plays: 234000, rating: 4.6 },
  { id: '16', title: 'Poker Hold\'em', description: 'Play poker against AI opponents', thumbnail: '🎰', category: 'card', plays: 156000, rating: 4.7 },
  { id: '17', title: 'Uno Online', description: 'Match colors and numbers', thumbnail: '🔴', category: 'card', plays: 289000, rating: 4.5, isHot: true },
  { id: '18', title: 'Word Search', description: 'Find hidden words in the grid', thumbnail: '🔍', category: 'word', plays: 145000, rating: 4.6 },
  { id: '19', title: 'Hangman', description: 'Guess the word before time runs out', thumbnail: '📿', category: 'word', plays: 89000, rating: 4.4 },
  { id: '20', title: 'Crossword Daily', description: 'New crossword puzzle every day', thumbnail: '✏️', category: 'word', plays: 234000, rating: 4.8, isFeatured: true },
  { id: '21', title: 'Wordle Clone', description: 'Guess the 5-letter word in 6 tries', thumbnail: '🟩', category: 'word', plays: 678000, rating: 4.9, isHot: true },
  { id: '22', title: 'Basketball Shots', description: 'Shoot hoops and beat your high score', thumbnail: '🏀', category: 'sports', plays: 98000, rating: 4.5 },
  { id: '23', title: 'Soccer Penalty', description: 'Score goals in penalty shootout', thumbnail: '⚽', category: 'sports', plays: 156000, rating: 4.6, isNew: true },
  { id: '24', title: 'Golf Solitaire', description: 'Clear all cards in this golf-themed game', thumbnail: '⛳', category: 'sports', plays: 67000, rating: 4.3 },
  { id: '25', title: 'Endless Driver', description: 'Drive as far as you can', thumbnail: '🚗', category: 'racing', plays: 234000, rating: 4.7 },
  { id: '26', title: 'Bike Racing', description: 'Race your bike through obstacles', thumbnail: '🏍️', category: 'racing', plays: 145000, rating: 4.5, isNew: true },
  { id: '27', title: 'Cookie Clicker', description: 'Click cookies, upgrade, repeat', thumbnail: '🍪', category: 'casual', plays: 456000, rating: 4.4, isHot: true },
  { id: '28', title: 'Piano Tiles', description: 'Tap the black tiles to the music', thumbnail: '🎹', category: 'casual', plays: 345000, rating: 4.7 },
  { id: '29', title: 'Bubble Shooter', description: 'Pop bubbles and clear the board', thumbnail: '🫧', category: 'casual', plays: 567000, rating: 4.6, isFeatured: true },
  { id: '30', title: 'Fruit Ninja', description: 'Slice fruit, avoid bombs', thumbnail: '🍉', category: 'casual', plays: 389000, rating: 4.8 },
  { id: '31', title: 'Tic Tac Toe', description: 'Classic X and O - play with friends', thumbnail: '⭕', category: 'multiplayer', plays: 234000, rating: 4.5 },
  { id: '32', title: 'Connect Four', description: 'Get four in a row to win', thumbnail: '🔵', category: 'multiplayer', plays: 156000, rating: 4.6 }
];

function GameCard({ game }: { game: Game }) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all cursor-pointer"
    >
      <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center relative">
        <span className="text-6xl">{game.thumbnail}</span>
        <div className="absolute top-2 left-2 flex gap-1">
          {game.isFeatured && (
            <span className="px-2 py-0.5 bg-yellow-500 text-white text-xs font-bold rounded-full">⭐</span>
          )}
          {game.isNew && (
            <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-bold rounded-full">New</span>
          )}
          {game.isHot && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">🔥</span>
          )}
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-gray-900 dark:text-white mb-1 line-clamp-1">{game.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{game.description}</p>
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>⭐ {game.rating}</span>
          <span>🎮 {(game.plays / 1000).toFixed(0)}K</span>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Link
          href={`/games/play/${game.id}`}
          className="block w-full py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-center rounded-lg font-medium hover:from-green-600 hover:to-emerald-600"
        >
          ▶ Play Now
        </Link>
      </div>
    </motion.div>
  );
}

export default function GamesHubPage() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');

  const filteredGames = GAMES.filter(game => {
    const matchesCategory = selectedCategory === 'all' || game.category === selectedCategory;
    const matchesSearch = searchQuery === '' ||
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'popular': return b.plays - a.plays;
      case 'rating': return b.rating - a.rating;
      case 'newest': return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      case 'name': return a.title.localeCompare(b.title);
      default: return 0;
    }
  });

  const featuredGames = GAMES.filter(g => g.isFeatured);
  const hotGames = GAMES.filter(g => g.isHot);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <header className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <span className="text-white text-xl">🎮</span>
                </div>
              </Link>
              <div>
                <h1 className="font-bold text-white text-xl">Games Hub</h1>
                <p className="text-xs text-gray-400">Free games to play anytime</p>
              </div>
            </div>
            <div className="flex-1 max-w-md mx-8">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search games..."
                className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white placeholder-gray-400"
              />
            </div>
            <div className="flex items-center gap-4">
              <Link href="/hub" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                More Tools
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="bg-black/20 border-b border-white/10 overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                <span className="mr-1.5">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {selectedCategory === 'all' && searchQuery === '' && (
          <>
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">⭐ Featured Games</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {featuredGames.slice(0, 4).map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-white mb-6">🔥 Hot Right Now</h2>
              <div className="grid md:grid-cols-4 gap-6">
                {hotGames.slice(0, 4).map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          </>
        )}

        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-400">{sortedGames.length} games found</p>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-white/20 rounded-lg bg-white/10 text-white"
          >
            <option value="popular">Most Popular</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest</option>
            <option value="name">A-Z</option>
          </select>
        </div>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">
            {selectedCategory === 'all' ? 'All Games' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
          </h2>
          <div className="grid md:grid-cols-4 lg:grid-cols-5 gap-6">
            {sortedGames.map(game => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>

        {sortedGames.length === 0 && (
          <div className="text-center py-16">
            <span className="text-6xl mb-4 block">🎮</span>
            <h3 className="text-xl font-bold text-white mb-2">No games found</h3>
            <p className="text-gray-400">Try adjusting your search or category filter</p>
          </div>
        )}

        <section className="mt-16 bg-black/30 rounded-2xl p-8">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-green-400">{GAMES.length}+</div>
              <div className="text-gray-400">Games</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-blue-400">{CATEGORIES.length - 1}</div>
              <div className="text-gray-400">Categories</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400">Free</div>
              <div className="text-gray-400">To Play</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-yellow-400">∞</div>
              <div className="text-gray-400">Fun</div>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Need a Break? 🎮</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Games are free and don't use credits. Take a break, have fun!
          </p>
          <Link
            href="/hub"
            className="inline-block px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-purple-600"
          >
            Explore More Tools →
          </Link>
        </section>
      </main>

      <footer className="bg-black/30 text-gray-400 py-8 px-4 mt-16 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <p>© 2025 CR AudioViz AI, LLC. All rights reserved.</p>
          <p className="text-sm mt-2">Games are free forever! 🎮</p>
        </div>
      </footer>
    </div>
  );
}
