export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Accessibility Statement</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-lg text-slate-300 mb-6">CR AudioViz AI is committed to ensuring digital accessibility for people with disabilities.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Our Commitment</h2>
          <p className="text-slate-300 mb-4">We strive to meet WCAG 2.1 Level AA standards across our platform.</p>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Accessibility Features</h2>
          <ul className="list-disc pl-6 text-slate-300 space-y-2">
            <li>Keyboard navigation support</li>
            <li>Screen reader compatibility</li>
            <li>High contrast mode support</li>
            <li>Resizable text</li>
            <li>Alt text for images</li>
          </ul>
          
          <h2 className="text-2xl font-semibold mt-8 mb-4">Feedback</h2>
          <p className="text-slate-300">We welcome your feedback on accessibility. Contact us at accessibility@craudiovizai.com</p>
        </div>
      </div>
    </div>
  );
}
