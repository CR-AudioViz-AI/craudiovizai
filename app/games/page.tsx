// app/games/page.tsx
// CR AudioViz AI — Games gateway
// Server-side redirect to games.craudiovizai.com
// Saturday, March 14, 2026

import { redirect } from 'next/navigation'

// Instantly redirect all /games traffic to the dedicated games platform
export default function GamesPage() {
  redirect('https://games.craudiovizai.com/games')
}

export const metadata = {
  title: 'Javari Games | CR AudioViz AI',
  description: 'Comprehensive games platform — part of the CR AudioViz AI ecosystem.',
}
