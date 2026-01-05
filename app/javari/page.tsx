// =============================================================================
// JAVARI AI PAGE - Complete with Upload, Chat, Citations
// P0 Launch Blocker - Must include:
// 1. Drag/drop + multi-file upload
// 2. Immediate ingestion
// 3. Doc-aware chat Q&A
// 4. Citations in answers
// 5. Full provider selector
// =============================================================================

import { Metadata } from "next"
import { JavariInterface } from "@/components/javari/JavariInterface"

export const metadata: Metadata = {
  title: "Javari AI - Your Intelligent Assistant | CR AudioViz AI",
  description: "Chat with Javari, your AI-powered assistant. Upload documents, ask questions, get answers with citations."
}

export default function JavariPage() {
  return <JavariInterface />
}
