export default function NewsletterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">Stay Updated</h1>
        <p className="text-xl text-slate-300 mb-8">Get the latest news, features, and updates from CR AudioViz AI.</p>
        
        <div className="bg-slate-800/50 p-8 rounded-xl border border-slate-700">
          <form className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-cyan-500 focus:outline-none text-white placeholder-slate-400"
            />
            <button
              type="submit"
              className="w-full px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-lg font-semibold transition-colors"
            >
              Subscribe
            </button>
          </form>
          <p className="text-sm text-slate-400 mt-4">We respect your privacy. Unsubscribe anytime.</p>
        </div>
      </div>
    </div>
  );
}
