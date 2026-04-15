import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { AlertTriangle, Truck, Loader2, LocateFixed, MapPin, PhoneCall, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { emergencyAPI, type EmergencyRequestRecord } from '../services/api';
import { useAuthStore } from '../store/authStore';

type EmergencyType = 'accident' | 'heart-attack' | 'pregnancy' | 'other';
type PriorityLevel = 'normal' | 'critical';

const emergencyTypeOptions: Array<{ label: string; value: EmergencyType }> = [
  { label: 'Accident', value: 'accident' },
  { label: 'Heart Attack', value: 'heart-attack' },
  { label: 'Pregnancy', value: 'pregnancy' },
  { label: 'Other', value: 'other' },
];

const emergencyStatusLabel: Record<EmergencyRequestRecord['status'], string> = {
  'waiting-assignment': 'Waiting for ambulance assignment',
  'ambulance-dispatched': 'Ambulance Dispatched',
  'on-the-way': 'On the Way',
  arrived: 'Arrived',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export default function EmergencyAmbulanceWidget() {
  const user = useAuthStore((state) => state.user);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [requestId, setRequestId] = useState<string>('');
  const [tracking, setTracking] = useState<EmergencyRequestRecord | null>(null);
  const [emergencyPhone, setEmergencyPhone] = useState('+919999999999');

  const [form, setForm] = useState({
    patientName: user?.name || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || '',
    phoneNumber: user?.phone || '',
    emergencyType: 'accident' as EmergencyType,
    pickupAddress: '',
    pickupLatitude: '',
    pickupLongitude: '',
    dropAddress: '',
    dropLatitude: '',
    dropLongitude: '',
    priorityLevel: 'normal' as PriorityLevel,
  });

  const [availability, setAvailability] = useState<{
    availableCount: number;
    nearestEta?: number;
    nearestUnit?: string;
  } | null>(null);

  const pickupCoordsReady = useMemo(
    () => form.pickupLatitude.trim() !== '' && form.pickupLongitude.trim() !== '',
    [form.pickupLatitude, form.pickupLongitude]
  );

  const buildRequestPayload = () => {
    const pickupLatitude = Number(form.pickupLatitude);
    const pickupLongitude = Number(form.pickupLongitude);

    return {
      payload: {
        patientName: form.patientName.trim() || 'Unknown Patient',
        phoneNumber: form.phoneNumber.trim(),
        emergencyType: form.emergencyType,
        priorityLevel: form.priorityLevel,
        pickupLocation: {
          address: form.pickupAddress.trim() || 'Pickup location',
          latitude: pickupLatitude,
          longitude: pickupLongitude,
        },
        dropLocation: form.dropAddress.trim()
          ? {
              address: form.dropAddress.trim(),
              latitude: Number(form.dropLatitude) || pickupLatitude,
              longitude: Number(form.dropLongitude) || pickupLongitude,
            }
          : undefined,
      },
      pickupLatitude,
      pickupLongitude,
    };
  };

  useEffect(() => {
    if (!open || !requestId) {
      return;
    }

    const pollTracking = async () => {
      try {
        const { data } = await emergencyAPI.getTracking(requestId);
        setTracking(data.request);
      } catch {
        // Silent polling failure to avoid noisy UX.
      }
    };

    pollTracking();
    const timer = setInterval(pollTracking, 5000);
    return () => clearInterval(timer);
  }, [open, requestId]);

  const fetchAvailability = async () => {
    const latitude = Number(form.pickupLatitude);
    const longitude = Number(form.pickupLongitude);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      toast.error('Please provide valid pickup coordinates first.');
      return;
    }

    setLoadingAvailability(true);
    try {
      const { data } = await emergencyAPI.getAvailability(latitude, longitude);
      setAvailability({
        availableCount: data.availableCount,
        nearestEta: data.nearest?.etaMinutes,
        nearestUnit: data.nearest?.unitCode,
      });
      setEmergencyPhone(data.emergencyPhone || emergencyPhone);
    } catch {
      toast.error('Could not fetch ambulance availability right now.');
    } finally {
      setLoadingAvailability(false);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('GPS is not supported by this browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          pickupLatitude: position.coords.latitude.toFixed(6),
          pickupLongitude: position.coords.longitude.toFixed(6),
          pickupAddress: prev.pickupAddress || 'Current GPS location',
        }));
        toast.success('Pickup location captured from GPS.');
      },
      () => toast.error('Unable to read your current location.'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.phoneNumber.trim()) {
      toast.error('Phone number is required for emergency response.');
      return;
    }

    const { payload, pickupLatitude, pickupLongitude } = buildRequestPayload();

    if (Number.isNaN(pickupLatitude) || Number.isNaN(pickupLongitude)) {
      toast.error('Pickup latitude and longitude are required.');
      return;
    }

    setSubmitting(true);

    try {
      const { data } = await emergencyAPI.createRequest(payload);
      setEmergencyPhone(data.emergencyPhone || emergencyPhone);
      setRequestId(data.request.requestCode);
      setTracking(data.request);
      toast.success(data.message || 'Emergency request submitted successfully.');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Could not submit emergency request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-[70] flex items-center gap-2 rounded-full bg-red-600 px-5 py-3 font-bold text-white shadow-2xl ring-4 ring-red-200 transition hover:bg-red-700"
      >
        <AlertTriangle size={18} />
        Emergency Ambulance
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/55 p-3">
          <div className="relative max-h-[92vh] w-full max-w-3xl overflow-auto rounded-3xl border border-white/20 bg-white p-5 shadow-2xl sm:p-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close emergency modal"
            >
              <X size={18} />
            </button>

            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">Emergency Ambulance Booking</h2>
                <p className="text-sm font-medium text-slate-600">Fast dispatch for critical situations</p>
              </div>
              <a
                href={`tel:${emergencyPhone}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 font-semibold text-white shadow hover:bg-red-700"
              >
                <PhoneCall size={16} />
                Call Now
              </a>
            </div>

            <form className="space-y-4" onSubmit={onSubmit}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Patient Name</span>
                  <input
                    type="text"
                    value={form.patientName}
                    onChange={(event) => setForm((prev) => ({ ...prev, patientName: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                    placeholder="Patient name"
                  />
                </label>

                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Phone Number *</span>
                  <input
                    type="tel"
                    required
                    value={form.phoneNumber}
                    onChange={(event) => setForm((prev) => ({ ...prev, phoneNumber: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                    placeholder="+91..."
                  />
                </label>

                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Emergency Type</span>
                  <select
                    value={form.emergencyType}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, emergencyType: event.target.value as EmergencyType }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  >
                    {emergencyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Priority Level</span>
                  <select
                    value={form.priorityLevel}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, priorityLevel: event.target.value as PriorityLevel }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="critical">Critical</option>
                  </select>
                </label>
              </div>

              <label className="space-y-1 text-sm font-semibold text-slate-700">
                <span>Pickup Location Address</span>
                <input
                  type="text"
                  value={form.pickupAddress}
                  onChange={(event) => setForm((prev) => ({ ...prev, pickupAddress: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  placeholder="Street, landmark, area"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Pickup Latitude *</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.pickupLatitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, pickupLatitude: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Pickup Longitude *</span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={form.pickupLongitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, pickupLongitude: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={useCurrentLocation}
                  className="inline-flex items-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-100"
                >
                  <LocateFixed size={16} />
                  Use Current GPS
                </button>
                <button
                  type="button"
                  onClick={fetchAvailability}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Truck size={16} />
                  Check Nearest Availability
                </button>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${form.pickupLatitude},${form.pickupLongitude}`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
                    pickupCoordsReady
                      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      : 'pointer-events-none border-slate-200 bg-slate-100 text-slate-400'
                  }`}
                >
                  <MapPin size={16} />
                  Open Map
                </a>
              </div>

              {loadingAvailability ? (
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700">
                  <Loader2 className="animate-spin" size={16} />
                  Checking nearest ambulances...
                </div>
              ) : null}

              {availability ? (
                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/80 p-4 text-sm text-slate-800">
                  <p className="font-semibold">Nearest Ambulance Availability</p>
                  <p className="mt-1">Available units: {availability.availableCount}</p>
                  <p>Nearest unit: {availability.nearestUnit || 'Not available'}</p>
                  <p>Estimated arrival time (ETA): {availability.nearestEta ? `${availability.nearestEta} min` : 'N/A'}</p>
                </div>
              ) : null}

              <label className="space-y-1 text-sm font-semibold text-slate-700">
                <span>Drop Location (Optional)</span>
                <input
                  type="text"
                  value={form.dropAddress}
                  onChange={(event) => setForm((prev) => ({ ...prev, dropAddress: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  placeholder="Destination hospital or address"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Drop Latitude</span>
                  <input
                    type="number"
                    step="any"
                    value={form.dropLatitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, dropLatitude: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  />
                </label>
                <label className="space-y-1 text-sm font-semibold text-slate-700">
                  <span>Drop Longitude</span>
                  <input
                    type="number"
                    step="any"
                    value={form.dropLongitude}
                    onChange={(event) => setForm((prev) => ({ ...prev, dropLongitude: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none transition focus:border-cyan-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {submitting ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                {submitting ? 'Submitting Emergency Request...' : 'Request Emergency Ambulance'}
              </button>
            </form>

            {tracking ? (
              <div className="animate-float-up mt-5 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-950">
                <p className="text-base font-extrabold">Request Confirmed: {tracking.requestCode}</p>
                <p className="mt-1 font-semibold">Status: {emergencyStatusLabel[tracking.status]}</p>
                <p>ETA: {tracking.estimatedArrivalMinutes ?? 'N/A'} min</p>
                <p>Assigned Ambulance: {tracking.assignedAmbulance?.unitCode || 'Awaiting assignment'}</p>
                <p>Driver: {tracking.assignedAmbulance?.driverName || 'Will be updated shortly'}</p>
                <p className="mt-2 text-xs font-semibold text-emerald-700">
                  Live tracking updates every 5 seconds while this modal is open.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
