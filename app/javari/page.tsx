// app/javari/page.tsx
// CR AudioViz AI — Javari OS embed.
// Renders the real Javari OS from javariai.com in a fullscreen iframe.
// Auth passthrough deferred — users authenticate directly on javariai.com.
// Updated: March 22, 2026
'use client'

export default function JavariPage() {
  return (
    <div className="w-full h-[calc(100vh-80px)] bg-black">
      <iframe
        src="https://javariai.com/javari"
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; microphone; camera"
        title="Javari AI"
      />
    </div>
  )
}
