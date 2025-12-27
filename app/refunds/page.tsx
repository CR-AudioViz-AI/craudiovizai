import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refund Policy | CRAIverse',
  description: 'Refund Policy for CRAIverse - CR AudioViz AI LLC',
};

export default function RefundPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Refund Policy</h1>
      <p className="text-gray-500 mb-8">Last Updated: December 26, 2025</p>
      
      <div className="prose prose-lg max-w-none space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Credit Purchases</h2>
          <p>All credit purchases are <strong>final and non-refundable</strong> once completed. Credits are immediately available upon purchase.</p>
          <p className="mt-4">Exceptions may be made for:</p>
          <ul className="list-disc pl-6">
            <li>Duplicate charges due to technical errors</li>
            <li>Credits not delivered due to system failures</li>
            <li>Unauthorized transactions (subject to investigation)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Subscriptions</h2>
          <ul className="list-disc pl-6">
            <li>Cancel anytime through account settings</li>
            <li>Access continues until end of billing period</li>
            <li>No partial refunds for unused time</li>
            <li>First 48 hours: Full refund available</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How to Request a Refund</h2>
          <ol className="list-decimal pl-6">
            <li>Contact billing@craudiovizai.com within 7 days</li>
            <li>Provide transaction ID and receipt</li>
            <li>Describe the issue in detail</li>
            <li>Allow up to 10 business days for review</li>
          </ol>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Chargebacks</h2>
          <p className="text-red-600">Please contact us before filing a chargeback. Fraudulent chargebacks may result in account suspension and collection of owed amounts.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Contact</h2>
          <p>Billing: billing@craudiovizai.com</p>
          <p>Support: https://craudiovizai.com/support</p>
        </section>
      </div>
    </div>
  );
}
