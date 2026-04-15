import { useAuthStore } from '../store/authStore';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6">
          <h1 className="text-3xl font-bold mb-6">My Profile</h1>
          
          <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="block text-sm text-gray-600">First Name</p>
                <p className="text-lg font-semibold">{user?.firstName}</p>
              </div>
              <div>
                <p className="block text-sm text-gray-600">Last Name</p>
                <p className="text-lg font-semibold">{user?.lastName}</p>
              </div>
              <div>
                <p className="block text-sm text-gray-600">Email</p>
                <p className="text-lg font-semibold">{user?.email}</p>
              </div>
              <div>
                <p className="block text-sm text-gray-600">Phone</p>
                <p className="text-lg font-semibold">{user?.phone}</p>
              </div>
              <div>
                <p className="block text-sm text-gray-600">Role</p>
                <p className="text-lg font-semibold capitalize">{user?.role.replace('_', ' ')}</p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t">
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                Edit Profile
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
