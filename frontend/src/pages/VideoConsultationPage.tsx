import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VideoConsultationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const room = searchParams.get('room') || '';
  const appointmentId = searchParams.get('appointmentId') || '';

  const jitsiUrl = useMemo(() => {
    if (!room) return '';
    return `https://meet.jit.si/${encodeURIComponent(room)}#config.prejoinPageEnabled=true`;
  }, [room]);

  if (!room) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-xl shadow p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Video Consultation</h1>
          <p className="text-slate-600 mb-4">No room was provided for this consultation.</p>
          <button
            type="button"
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Back to Appointments
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Kushal Hospitals Video Consultation</h1>
          <p className="text-xs text-slate-300">Appointment: {appointmentId || 'N/A'} | Room: {room}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/appointments')}
          className="px-3 py-1 rounded-md bg-slate-800 hover:bg-slate-700"
        >
          Exit
        </button>
      </header>

      <main className="h-[calc(100vh-65px)]">
        <iframe
          title="Video consultation room"
          src={jitsiUrl}
          className="w-full h-full border-0"
          allow="camera; microphone; fullscreen; display-capture"
        />
      </main>
    </div>
  );
}
