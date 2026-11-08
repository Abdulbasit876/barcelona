'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import { Compass, RefreshCw, Zap, UserCheck, Car, AlertTriangle, MapPin, Clock } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  CONFIRMED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  PENDING_APPROVAL: 'bg-amber-50 text-amber-800 border-amber-200',
  ASSIGNED: 'bg-sky-50 text-sky-800 border-sky-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-800 border-blue-200',
  COMPLETED: 'bg-slate-100 text-slate-700 border-slate-200',
};

export default function DispatchPage() {
  const [board, setBoard] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [selectedDrivers, setSelectedDrivers] = useState<Record<string, string>>({});
  const [ruleForm, setRuleForm] = useState({ category: 'ECONOMY', driverId: '', priority: 1, isActive: true });
  const [activeTab, setActiveTab] = useState<'board' | 'rules'>('board');
  const [autoAssigning, setAutoAssigning] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [boardData, driversData, rulesData] = await Promise.all([
        ApiClient.getDispatchBoard(),
        ApiClient.listDrivers(),
        ApiClient.getDispatchRules(),
      ]);
      setBoard(boardData);
      setDrivers(driversData || []);
      setRules(rulesData || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleAssign = async (bookingId: string) => {
    const driverId = selectedDrivers[bookingId];
    if (!driverId) return alert('Please select a driver first');
    setAssigning(bookingId);
    try {
      const res = await ApiClient.assignDriver(bookingId, driverId);
      if (res.hasScheduleConflict) {
        alert(`⚠️ Warning: Driver has ${res.conflictCount} other ride(s) near this pickup time within 90 minutes. Assignment completed — please review schedule.`);
      }
      fetchAll();
    } catch (err: any) {
      alert('Assignment failed: ' + err.message);
    } finally {
      setAssigning(null);
    }
  };

  const handleAutoAssign = async (bookingId: string) => {
    setAutoAssigning(bookingId);
    try {
      const res = await ApiClient.autoAssign(bookingId);
      if (res.success) {
        alert(`✅ Auto-assigned: ${res.assignedDriver?.name} (${res.assignedDriver?.vehicle_plate})`);
        fetchAll();
      } else {
        alert('Auto-assign failed: ' + res.message);
      }
    } catch (err: any) {
      alert('Auto-assign error: ' + err.message);
    } finally {
      setAutoAssigning(null);
    }
  };

  const handleUnassign = async (bookingId: string) => {
    if (!confirm('Remove driver assignment from this booking?')) return;
    try {
      await ApiClient.unassignDriver(bookingId, 'Manually unassigned by dispatcher');
      fetchAll();
    } catch (err: any) {
      alert('Unassign failed: ' + err.message);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ApiClient.createDispatchRule(ruleForm);
      fetchAll();
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const BoardSection = ({ title, rides, icon: Icon, color }: any) => (
    <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color}`} />
          <h3 className="text-xs font-bold text-slate-900">{title}</h3>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 ${color}`}>
          {rides.length}
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {rides.length === 0 ? (
          <div className="px-5 py-6 text-xs text-slate-400 font-medium">No rides in this category</div>
        ) : (
          rides.map((ride: any) => (
            <div key={ride.id} className="px-5 py-4 hover:bg-slate-50/50 transition">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono font-bold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                      {ride.booking_reference}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[ride.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {ride.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">{ride.vehicle_category}</span>
                  </div>
                  <div className="text-xs font-bold text-slate-900">{ride.customer_name}</div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 mt-1 font-medium">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {new Date(ride.pickup_datetime).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-start gap-1 text-[11px] text-slate-600 mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span className="truncate">{ride.pickup_address}</span>
                  </div>
                  {ride.driver && (
                    <div className="text-[11px] text-navy-800 font-bold mt-1.5 flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-navy-800" />
                      {ride.driver.name} — {ride.driver.vehicle_plate}
                    </div>
                  )}
                </div>
                <div className="text-sm font-black text-slate-900 whitespace-nowrap">
                  €{Number(ride.total_fare || 0).toFixed(2)}
                </div>
              </div>

              {/* Assign Controls for unassigned */}
              {!ride.driver_id && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <select
                      value={selectedDrivers[ride.id] || ''}
                      onChange={(e) => setSelectedDrivers({ ...selectedDrivers, [ride.id]: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
                    >
                      <option value="">— Select driver manually —</option>
                      {drivers.filter((d) => d.is_active).map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} — {d.vehicle_plate} {d.current_status === 'AVAILABLE' ? '🟢' : d.current_status === 'ON_TRIP' ? '🔴' : '🟡'} ({d.current_status || 'UNKNOWN'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleAssign(ride.id)}
                      disabled={assigning === ride.id || !selectedDrivers[ride.id]}
                      className="px-3 py-1.5 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-xl transition disabled:opacity-40 shadow-sm"
                    >
                      {assigning === ride.id ? '...' : 'Assign'}
                    </button>
                    <button
                      onClick={() => handleAutoAssign(ride.id)}
                      disabled={autoAssigning === ride.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 rounded-xl transition disabled:opacity-50"
                      title="Auto-assign using category rules"
                    >
                      <Zap className="w-3 h-3 text-amber-600" />
                      Auto
                    </button>
                  </div>
                </div>
              )}

              {/* Unassign option for assigned rides */}
              {ride.driver_id && ride.status !== 'IN_PROGRESS' && ride.status !== 'COMPLETED' && (
                <div className="mt-2">
                  <button
                    onClick={() => handleUnassign(ride.id)}
                    className="text-[11px] text-rose-600 hover:text-rose-800 transition font-bold"
                  >
                    × Remove assignment
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <>
      <Header
        title="Live Dispatch Board"
        subtitle="Real-time ride assignment, auto-dispatch, and driver schedule management"
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {/* Summary Strip */}
        {board && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { label: 'Unassigned', count: board.unassignedCount, color: 'text-amber-800 bg-amber-50 border-amber-200' },
              { label: 'Assigned / Ready', count: board.assignedCount, color: 'text-sky-800 bg-sky-50 border-sky-200' },
              { label: 'In Progress', count: board.inProgressCount, color: 'text-blue-800 bg-blue-50 border-blue-200' },
              { label: 'Completed Today', count: board.completedCount, color: 'text-emerald-800 bg-emerald-50 border-emerald-200' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`flex flex-col items-center justify-center py-4 rounded-2xl border ${color} shadow-sm`}>
                <div className="text-3xl font-black">{count}</div>
                <div className="text-[11px] font-bold mt-1 uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-2xl w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('board')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'board' ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Live Board
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${activeTab === 'rules' ? 'bg-navy-800 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Assignment Rules
          </button>
          <button
            onClick={fetchAll}
            className="ml-2 p-2 text-slate-500 hover:text-slate-900 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {activeTab === 'board' && board && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            <BoardSection
              title="🚨 Unassigned (Needs Attention)"
              rides={board.pending}
              icon={AlertTriangle}
              color="text-amber-600"
            />
            <BoardSection
              title="✅ Assigned & Confirmed"
              rides={board.assigned}
              icon={UserCheck}
              color="text-sky-600"
            />
            <BoardSection
              title="🚖 In Progress"
              rides={board.inProgress}
              icon={Car}
              color="text-blue-600"
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Create Rule */}
            <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Compass className="w-4 h-4 text-amber-600" />
                Create Auto-Assignment Rule
              </h3>
              <p className="text-xs text-slate-500 mb-4 font-medium">
                Rules define which driver to auto-assign for each vehicle category.
                Priority 1 = highest priority driver for that category.
              </p>
              <form onSubmit={handleCreateRule} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Category</label>
                    <select value={ruleForm.category} onChange={(e) => setRuleForm({ ...ruleForm, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-navy-800">
                      {['ECONOMY', 'STANDARD', 'PREMIUM', 'STANDARD_VAN', 'PREMIUM_VAN', 'ELECTRIC', 'LARGE_GROUP'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Priority (1 = highest)</label>
                    <input type="number" min={1} value={ruleForm.priority}
                      onChange={(e) => setRuleForm({ ...ruleForm, priority: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-navy-800" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assign Driver</label>
                  <select required value={ruleForm.driverId} onChange={(e) => setRuleForm({ ...ruleForm, driverId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-navy-800">
                    <option value="">Select a driver…</option>
                    {drivers.filter((d) => d.is_active).map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} — {d.vehicle_plate} ({d.vehicle_model})
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit"
                  className="w-full py-2.5 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-xl transition shadow-md">
                  Create Rule
                </button>
              </form>
            </div>

            {/* Rules Table */}
            <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-extrabold text-slate-900">Active Assignment Rules</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  System uses these when "Auto-Assign" is triggered
                </p>
              </div>
              <div className="divide-y divide-slate-100">
                {rules.length === 0 ? (
                  <div className="px-5 py-8 text-xs text-slate-400 font-medium">
                    No rules yet. Create your first rule to enable auto-dispatch.
                  </div>
                ) : (
                  rules.map((rule) => (
                    <div key={rule.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-slate-50/50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-xs">{rule.category}</span>
                          <span className="text-[10px] text-slate-600 font-bold bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                            P{rule.priority}
                          </span>
                          {!rule.is_active && (
                            <span className="text-[10px] text-rose-600 font-bold">INACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-700 font-semibold mt-0.5">
                          {rule.driver?.name}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">{rule.driver?.vehicle_plate}</div>
                      </div>
                      <button
                        onClick={async () => {
                          if (confirm('Delete this assignment rule?')) {
                            await ApiClient.deleteDispatchRule(rule.id);
                            fetchAll();
                          }
                        }}
                        className="text-[11px] text-rose-600 hover:text-rose-800 font-bold transition"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
