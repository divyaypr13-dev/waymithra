import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, CheckCircle, Clock, Send, HeartHandshake } from 'lucide-react';
import { Stop, VehicleLiveState, HelpRequest, Language } from '../types';
import { getTranslation } from '../translations';
import { api } from '../services/api';

interface HelpRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stops: Stop[];
  vehicles: VehicleLiveState[];
  language: Language;
}

export const HelpRequestsModal: React.FC<HelpRequestsModalProps> = ({
  isOpen,
  onClose,
  stops,
  vehicles,
  language
}) => {
  const t = getTranslation(language);
  const [stopId, setStopId] = useState('BLR-STOP-01');
  const [vehicleId, setVehicleId] = useState('WM-V1');
  const [assistanceType, setAssistanceType] = useState('Wheelchair Ramp Required');
  const [passengerName, setPassengerName] = useState('');
  const [notes, setNotes] = useState('');
  const [createdRequest, setCreatedRequest] = useState<HelpRequest | null>(null);
  const [existingRequests, setExistingRequests] = useState<HelpRequest[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getHelpRequests().then(setExistingRequests);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const req = await api.submitHelpRequest({
      stop_id: stopId,
      vehicle_id: vehicleId,
      assistance_type: assistanceType,
      passenger_name: passengerName || 'Passenger',
      notes: notes
    });
    setCreatedRequest(req);
    setSubmitting(false);
    api.getHelpRequests().then(setExistingRequests);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#0D1B36] border border-[#1E3563] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E3563] bg-[#09142A]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {t.requestAssistance}
              </h3>
              <p className="text-xs text-slate-400">
                Priority Dispatch for Disabled, Elderly & Special Assistance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {createdRequest ? (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-white">Assistance Dispatched!</h4>
              <p className="text-xs text-slate-300">
                Your request has been broadcasted to the nearest bus conductor and station staff.
              </p>
              <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563] inline-block font-mono text-xs">
                <span className="text-slate-400">{t.receiptToken}: </span>
                <span className="text-amber-400 font-bold">{createdRequest.receipt_token}</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => setCreatedRequest(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white"
                >
                  Create Another Request
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.selectAssistanceType}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'Wheelchair Ramp Required', label: t.wheelchairRamp, icon: '♿' },
                    { id: 'Visual/Audio Boarding Guide', label: t.visualGuide, icon: '👁️' },
                    { id: 'Elderly/Mobility Support', label: t.elderlySupport, icon: '🚶' },
                    { id: 'General Assistance', label: t.emergencySOS, icon: '🚨' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setAssistanceType(opt.id)}
                      className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center gap-2.5 transition-all ${
                        assistanceType === opt.id
                          ? 'bg-rose-500/20 border-rose-500 text-white shadow-md'
                          : 'bg-[#081225] border-[#1E3563] text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Boarding Bus Stop
                  </label>
                  <select
                    value={stopId}
                    onChange={(e) => setStopId(e.target.value)}
                    className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                  >
                    {stops.map(s => (
                      <option key={s.id} value={s.id}>
                        {t.stops[s.id as keyof typeof t.stops] || s.short_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                    Target Bus (Optional)
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.display_name} ({v.vehicle_number})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.passengerName}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramesh Kumar"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.additionalNotes}
                </label>
                <textarea
                  placeholder="e.g. Waiting near Platform 2 elevator, manual wheelchair user."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3.5 py-2 text-xs text-white focus:outline-hidden"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : t.submitRequest}</span>
              </button>

            </form>
          )}

          {/* Active Help Requests Log */}
          {existingRequests.length > 0 && (
            <div className="pt-4 border-t border-[#1E3563]">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                {t.activeRequests}
              </h4>
              <div className="space-y-2">
                {existingRequests.slice(0, 3).map(r => (
                  <div key={r.receipt_token} className="p-2.5 rounded-xl bg-[#081225] border border-[#1E3563] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{r.assistance_type}</p>
                      <p className="text-[10px] text-slate-400">{r.stop_name} • Token: {r.receipt_token}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
