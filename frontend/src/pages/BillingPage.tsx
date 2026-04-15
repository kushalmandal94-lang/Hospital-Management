import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function BillingPage() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <h1 className="text-3xl font-bold mb-6">Billing & Payments</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Billing management interface coming soon...</p>
          </div>
        </main>
      </div>
    </div>
  );
}
