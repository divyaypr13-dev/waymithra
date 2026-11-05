import React, { useState, useEffect } from 'react';
import { Ticket as TicketIcon, Bus, Check, X, Printer, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { VehicleLiveState, Stop, Ticket, Language } from '../types';
import { getTranslation } from '../translations';
import { api } from '../services/api';

interface ConductorModeProps {
  stops: Stop[];
  vehicles: VehicleLiveState[];
  selectedVehicle: VehicleLiveState;
  language: Language;
}

export const ConductorMode: React.FC<ConductorModeProps> = ({
  stops,
  vehicles,
  selectedVehicle,
  language
}) => {
  const t = getTranslation(language);
  const [vehicleId, setVehicleId] = useState(selectedVehicle.id);
  const [fromStop, setFromStop] = useState('BLR-STOP-02'); // MG Road
  const [toStop, setToStop] = useState('BLR-STOP-01'); // Majestic
  const [passengerCount, setPassengerCount] = useState(1);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [issuedTicket, setIssuedTicket] = useState<Ticket | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute distance fare
  const farePerPerson = 20;
  const totalFare = passengerCount * farePerPerson;

  const loadTickets = async () => {
    const list = await api.getTickets(vehicleId);
    setTickets(list);
  };

  useEffect(() => {
    loadTickets();
  }, [vehicleId]);

  const handleIssueTicket = async () => {
    setIsSubmitting(true);
    const idempotencyKey = `POS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const ticket = await api.issueTicket({
      idempotency_key: idempotencyKey,
      vehicle_id: vehicleId,
      from_stop_id: fromStop,
      to_stop_id: toStop,
      passenger_count: passengerCount,
      fare_paid_inr: totalFare
    });
    setIssuedTicket(ticket);
    setIsSubmitting(false);
    loadTickets();
  };

  const handleCancel = async (ticketId: string) => {
    await api.cancelTicket(ticketId);
    loadTickets();
  };

  const currentBus = vehicles.find(v => v.id === vehicleId) || selectedVehicle;
  const activeTicketsCount = tickets
    .filter(t => t.status === 'ACTIVE')
    .reduce((sum, t) => sum + t.passenger_count, 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 pb-28">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#1E3563] gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <TicketIcon className="w-6 h-6 text-emerald-400" />
            <span>{t.conductorMode}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Electronic Ticketing POS & In-Cabin Occupancy Reconciliation
          </p>
        </div>

        {/* Bus Selector */}
        <div className="flex items-center gap-2 bg-[#0D1B36] border border-[#1E3563] p-1.5 rounded-xl text-xs">
          <Bus className="w-4 h-4 text-sky-400 ml-1.5" />
          <select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="bg-transparent text-white font-bold focus:outline-hidden pr-2 cursor-pointer"
          >
            {vehicles.map(v => (
              <option key={v.id} value={v.id} className="bg-[#081225] text-white">
                {v.display_name} ({v.vehicle_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
        
        {/* Ticket Issuance Form (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-6 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-5 flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>{t.issueTicket}</span>
          </h3>

          <div className="space-y-4">
            
            {/* Stops grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.fromStop}
                </label>
                <select
                  value={fromStop}
                  onChange={(e) => setFromStop(e.target.value)}
                  className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
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
                  {t.toStop}
                </label>
                <select
                  value={toStop}
                  onChange={(e) => setToStop(e.target.value)}
                  className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-hidden focus:border-sky-500"
                >
                  {stops.map(s => (
                    <option key={s.id} value={s.id}>
                      {t.stops[s.id as keyof typeof t.stops] || s.short_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Passenger Count & Fare */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.passengers}
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPassengerCount(Math.max(1, passengerCount - 1))}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white flex items-center justify-center transition-colors"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center py-2 bg-[#081225] border border-[#1E3563] rounded-xl text-base font-black text-white">
                    {passengerCount}
                  </span>
                  <button
                    onClick={() => setPassengerCount(passengerCount + 1)}
                    className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-lg font-bold text-white flex items-center justify-center transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  {t.fareInr}
                </label>
                <div className="w-full bg-[#081225] border border-[#1E3563] rounded-xl px-4 py-2 text-xl font-black text-amber-400 flex items-center justify-between">
                  <span>₹ {totalFare}.00</span>
                  <span className="text-[11px] font-normal text-slate-400">₹{farePerPerson} / seat</span>
                </div>
              </div>
            </div>

            {/* Issue Button */}
            <button
              onClick={handleIssueTicket}
              disabled={isSubmitting}
              className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
            >
              <Printer className="w-4 h-4" />
              <span>{isSubmitting ? 'Issuing...' : t.printTicket}</span>
            </button>

            {issuedTicket && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-in fade-in">
                <div className="flex items-center gap-2 text-xs text-emerald-300">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Ticket Issued: <b>{issuedTicket.ticket_id}</b> ({issuedTicket.passenger_count} Pax • ₹{issuedTicket.fare_paid_inr})</span>
                </div>
                <button
                  onClick={() => setIssuedTicket(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Dismiss
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Occupancy Cross-Verification & Stats (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          
          <div className="rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>{t.ticketVsCamera}</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563]">
                <p className="text-[11px] text-slate-400 mb-0.5">Tickets Active</p>
                <p className="text-2xl font-black text-emerald-400">{activeTicketsCount}</p>
                <p className="text-[10px] text-slate-500">Conductor transactions</p>
              </div>

              <div className="p-3 rounded-xl bg-[#081225] border border-[#1E3563]">
                <p className="text-[11px] text-slate-400 mb-0.5">Camera Observation</p>
                <p className="text-2xl font-black text-amber-400">{currentBus.crowd_count}</p>
                <p className="text-[10px] text-slate-500">Privacy sketch feed</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Ticket transactions and computer-vision observations are strictly segregated for passenger privacy and audit verification.
            </p>
          </div>

          {/* Recent Tickets List */}
          <div className="rounded-2xl bg-[#0D1B36] border border-[#1E3563] p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1E3563] mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {t.recentTickets}
              </h3>
              <button onClick={loadTickets} className="text-slate-400 hover:text-white">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {tickets.length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No active tickets for this bus.</p>
              ) : (
                tickets.slice(0, 5).map(tkt => (
                  <div key={tkt.ticket_id} className="p-2.5 rounded-xl bg-[#081225] border border-[#1E3563] flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-white">{tkt.ticket_id}</p>
                      <p className="text-[10px] text-slate-400">{tkt.passenger_count} Pax • ₹{tkt.fare_paid_inr}</p>
                    </div>
                    {tkt.status === 'ACTIVE' ? (
                      <button
                        onClick={() => handleCancel(tkt.ticket_id)}
                        className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-[10px] font-bold transition-colors"
                      >
                        Cancel
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-bold">CANCELLED</span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
