import { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
  emergencyAPI,
  type EmergencyAmbulanceUnit,
  type EmergencyRequestRecord,
} from '../services/api';

const statusOptions: EmergencyRequestRecord['status'][] = [
  'waiting-assignment',
  'ambulance-dispatched',
  'on-the-way',
  'arrived',
  'completed',
  'cancelled',
];

const emergencyTypeLabel: Record<EmergencyRequestRecord['emergencyType'], string> = {
  accident: 'Accident',
  'heart-attack': 'Heart Attack',
  pregnancy: 'Pregnancy',
  other: 'Other',
};

export default function EmergencyAdminPage() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<EmergencyRequestRecord[]>([]);
  const [ambulances, setAmbulances] = useState<EmergencyAmbulanceUnit[]>([]);
  const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);
  const topRequestRef = useRef<string | undefined>(undefined);

  const availableAmbulances = useMemo(
    () => ambulances.filter((ambulance) => ambulance.status === 'available'),
    [ambulances]
  );

  const loadEmergencyData = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      const [requestRes, ambulanceRes] = await Promise.all([
        emergencyAPI.getAdminRequests(),
        emergencyAPI.getAdminAmbulances(),
      ]);

      setRequests(requestRes.data.requests || []);
      setAmbulances(ambulanceRes.data.ambulances || []);
    } catch {
      toast.error('Unable to load emergency admin data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmergencyData(true);
  }, []);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const response = await emergencyAPI.getAdminRequests();
        const nextRequests = response.data.requests || [];
        const previousTopRequestId = topRequestRef.current;

        if (nextRequests[0]?._id && previousTopRequestId && nextRequests[0]._id !== previousTopRequestId) {
          toast.success('New emergency request received.');
        }

        topRequestRef.current = nextRequests[0]?._id;
        setRequests(nextRequests);
      } catch {
        // Ignore polling failures to keep panel usable.
      }
    }, 8000);

    return () => clearInterval(poll);
  }, []);

  const handleSeedAmbulances = async () => {
    try {
      const { data } = await emergencyAPI.seedAmbulances();
      toast.success(data?.message || 'Sample ambulances seeded.');
      await loadEmergencyData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not seed ambulances.');
    }
  };

  const updateStatus = async (requestId: string, status: EmergencyRequestRecord['status']) => {
    setUpdatingRequestId(requestId);
    try {
      await emergencyAPI.updateRequestStatus(requestId, status, 'Updated from admin panel');
      toast.success('Emergency status updated.');
      await loadEmergencyData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not update request status.');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  const reassignAmbulance = async (requestId: string, ambulanceId: string) => {
    if (!ambulanceId) {
      return;
    }

    setUpdatingRequestId(requestId);
    try {
      await emergencyAPI.reassignAmbulance(requestId, ambulanceId);
      toast.success('Ambulance reassigned.');
      await loadEmergencyData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not reassign ambulance.');
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900">Emergency Admin Panel</h1>
              <p className="text-sm font-medium text-slate-600">Monitor emergency bookings and ambulance dispatch status</p>
            </div>
            <button
              type="button"
              onClick={handleSeedAmbulances}
              className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700"
            >
              Seed Sample Ambulances
            </button>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-5 shadow">
              <p className="text-sm font-semibold text-slate-600">Total Requests</p>
              <p className="text-3xl font-extrabold text-slate-900">{requests.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow">
              <p className="text-sm font-semibold text-slate-600">Available Ambulances</p>
              <p className="text-3xl font-extrabold text-emerald-700">{availableAmbulances.length}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow">
              <p className="text-sm font-semibold text-slate-600">Busy Ambulances</p>
              <p className="text-3xl font-extrabold text-amber-700">
                {ambulances.filter((ambulance) => ambulance.status === 'busy').length}
              </p>
            </div>
          </div>

          <section className="mb-6 rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Emergency Requests</h2>
            {loading ? <p className="font-semibold text-slate-600">Loading emergency requests...</p> : null}

            {!loading && requests.length === 0 ? (
              <p className="font-medium text-slate-600">No emergency requests found.</p>
            ) : null}

            {!loading && requests.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="p-2 font-semibold">Request</th>
                      <th className="p-2 font-semibold">Patient</th>
                      <th className="p-2 font-semibold">Emergency</th>
                      <th className="p-2 font-semibold">Status</th>
                      <th className="p-2 font-semibold">ETA</th>
                      <th className="p-2 font-semibold">Ambulance</th>
                      <th className="p-2 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((request) => (
                      <tr key={request._id} className="border-b border-slate-100 align-top">
                        <td className="p-2 font-semibold text-slate-900">{request.requestCode}</td>
                        <td className="p-2">
                          <p className="font-semibold text-slate-900">{request.patientName}</p>
                          <p className="text-slate-600">{request.phoneNumber}</p>
                        </td>
                        <td className="p-2">
                          <p className="font-semibold text-slate-800">{emergencyTypeLabel[request.emergencyType]}</p>
                          <p className="capitalize text-slate-600">Priority: {request.priorityLevel}</p>
                        </td>
                        <td className="p-2">
                          <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-800">
                            {request.status}
                          </span>
                        </td>
                        <td className="p-2 font-semibold text-slate-700">
                          {request.estimatedArrivalMinutes ?? 'N/A'} min
                        </td>
                        <td className="p-2 font-semibold text-slate-700">
                          {request.assignedAmbulance?.unitCode || 'Not assigned'}
                        </td>
                        <td className="p-2">
                          <div className="flex min-w-[250px] flex-col gap-2">
                            <select
                              aria-label="Update emergency request status"
                              title="Update emergency request status"
                              value={request.status}
                              onChange={(event) =>
                                updateStatus(request._id, event.target.value as EmergencyRequestRecord['status'])
                              }
                              disabled={updatingRequestId === request._id}
                              className="rounded-lg border border-slate-200 px-2 py-1.5"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>

                            <select
                              aria-label="Reassign ambulance"
                              title="Reassign ambulance"
                              defaultValue=""
                              onChange={(event) => reassignAmbulance(request._id, event.target.value)}
                              disabled={updatingRequestId === request._id}
                              className="rounded-lg border border-slate-200 px-2 py-1.5"
                            >
                              <option value="">Reassign ambulance...</option>
                              {availableAmbulances.map((ambulance) => (
                                <option key={ambulance._id} value={ambulance._id}>
                                  {ambulance.unitCode} ({ambulance.vehicleNumber})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow">
            <h2 className="mb-3 text-xl font-bold text-slate-900">Ambulance Fleet Status</h2>
            {ambulances.length === 0 ? (
              <p className="font-medium text-slate-600">No ambulances available. Seed sample data to begin.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {ambulances.map((ambulance) => (
                  <div key={ambulance._id} className="rounded-xl border border-slate-200 p-4">
                    <p className="text-lg font-extrabold text-slate-900">{ambulance.unitCode}</p>
                    <p className="text-sm font-semibold text-slate-700">{ambulance.vehicleNumber}</p>
                    <p className="text-sm text-slate-600">Driver: {ambulance.driverName}</p>
                    <p className="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-bold uppercase tracking-wide text-slate-700">
                      {ambulance.status}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
