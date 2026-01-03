export default function FeaturesPage() {
  const features = [
    { icon: "🎨", title: "Creative Tools", desc: "Professional design and content creation tools" },
    { icon: "🤖", title: "Javari AI", desc: "Intelligent AI assistant powered by multiple models" },
    { icon: "🎮", title: "Games Library", desc: "Extensive collection of entertainment options" },
    { icon: "💳", title: "Universal Credits", desc: "One credit system across all tools" },
    { icon: "🌍", title: "CRAIverse", desc: "Social impact modules serving communities" },
    { icon: "📊", title: "Analytics", desc: "Track your usage and progress" },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Platform Features</h1>
        <p className="text-xl text-slate-300 text-center mb-12">Your Story. Our Design.</p>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={i} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 hover:border-cyan-500 transition-colors">
              <div className="text-4xl mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-slate-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
