import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CRAIverse - Social Impact Modules",
  description: "Social impact modules serving underserved communities.",
  alternates: {
    canonical: "https://craudiovizai.com/craiverse",
  },
};

const modules = [
  { name: "First Responders", slug: "first-responders", icon: "🚒" },
  { name: "Veterans Transition", slug: "veterans-transition", icon: "🎖️" },
  { name: "Faith Community", slug: "faith-community", icon: "⛪" },
  { name: "Animal Rescue", slug: "animal-rescue", icon: "🐾" },
];

export default function CRAIversePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-4 text-center">CRAIverse</h1>
        <p className="text-xl text-slate-300 text-center mb-12">Social impact modules for underserved communities</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => (
            <Link
              key={module.slug}
              href={`/craiverse/${module.slug}`}
              className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-cyan-500 transition-colors text-center"
            >
              <span className="text-4xl mb-4 block">{module.icon}</span>
              <h2 className="text-xl font-semibold text-white">{module.name}</h2>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

