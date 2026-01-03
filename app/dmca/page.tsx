export default function DMCAPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">DMCA Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-slate-300 mb-6">CR AudioViz AI respects intellectual property rights and expects users to do the same.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Reporting Copyright Infringement</h2>
          <p className="text-slate-300 mb-4">If you believe content on our platform infringes your copyright, please provide:</p>
          <ul className="list-disc pl-6 text-slate-300 space-y-2">
            <li>Identification of the copyrighted work</li>
            <li>Location of the infringing material</li>
            <li>Your contact information</li>
            <li>A statement of good faith belief</li>
            <li>A statement of accuracy under penalty of perjury</li>
            <li>Your physical or electronic signature</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Contact</h2>
          <p className="text-slate-300">Send DMCA notices to: dmca@craudiovizai.com</p>
          
          <p className="text-slate-400 mt-8 text-sm">CR AudioViz AI, LLC<br/>Fort Myers, FL</p>
        </div>
      </div>
    </div>
  );
}
