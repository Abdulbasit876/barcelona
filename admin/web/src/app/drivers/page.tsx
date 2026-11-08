'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import {
  Car,
  UserPlus,
  Edit3,
  Power,
  Trash2,
  Star,
  Activity,
  Phone,
  Mail,
  X,
} from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  AVAILABLE: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  ON_TRIP: 'bg-sky-50 text-sky-800 border-sky-200',
  BREAK: 'bg-amber-50 text-amber-800 border-amber-200',
  OFFLINE: 'bg-slate-100 text-slate-700 border-slate-200',
};

const CATEGORIES = ['ECONOMY', 'STANDARD', 'PREMIUM', 'STANDARD_VAN', 'PREMIUM_VAN', 'ELECTRIC', 'LARGE_GROUP'];

interface DriverModalProps {
  title: string;
  form: any;
  setForm: (val: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
  saving: boolean;
}

function DriverModal({ title, form, setForm, onSubmit, onClose, saving }: DriverModalProps) {
  const toggleCat = (cat: string) => {
    const existing = form.assignedCategories || [];
    if (existing.includes(cat)) {
      setForm({ ...form, assignedCategories: existing.filter((c: string) => c !== cat) });
    } else {
      setForm({ ...form, assignedCategories: [...existing, cat] });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-navy-800 text-white flex items-center justify-center">
              <Car className="w-4 h-4 text-gold-400" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 overflow-y-auto max-h-[75vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Phone / WhatsApp *</label>
              <input
                required
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+34 632 41 50 48"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email *</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Plate *</label>
              <input
                required
                type="text"
                value={form.vehiclePlate}
                onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                placeholder="e.g. 1234-XYZ"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:border-navy-800"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Vehicle Model *</label>
              <input
                required
                type="text"
                value={form.vehicleModel}
                onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
                placeholder="e.g. Mercedes-Benz E 220"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-700 block mb-1">License Number</label>
              <input
                type="text"
                value={form.licenseNumber}
                onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                placeholder="e.g. B-12345678"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-navy-800"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">Allowed Vehicle Categories</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition ${
                    (form.assignedCategories || []).includes(cat)
                      ? 'bg-navy-800 text-white border-navy-800 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-slate-400'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 accent-navy-800"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700">Active (visible for dispatch)</label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-xs font-bold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2 text-xs font-bold bg-navy-800 hover:bg-navy-900 text-white rounded-xl transition disabled:opacity-50 shadow-md"
            >
              {saving ? 'Saving...' : 'Save Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [form, setForm] = useState<any>({
    name: '', phone: '', email: '', vehiclePlate: '', vehicleModel: '',
    assignedCategories: ['ECONOMY', 'STANDARD', 'PREMIUM'],
    licenseNumber: '', isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.listDrivers();
      setDrivers(data || []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await ApiClient.createDriver(form);
      setCreateModal(false);
      setForm({ name: '', phone: '', email: '', vehiclePlate: '', vehicleModel: '', assignedCategories: ['ECONOMY', 'STANDARD', 'PREMIUM'], licenseNumber: '', isActive: true });
      fetchDrivers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setSaving(true);
    try {
      await ApiClient.updateDriver(editModal.id, form);
      setEditModal(null);
      fetchDrivers();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (driver: any) => {
    setForm({
      name: driver.name,
      phone: driver.phone,
      email: driver.email,
      vehiclePlate: driver.vehicle_plate,
      vehicleModel: driver.vehicle_model,
      assignedCategories: driver.assigned_categories || ['ECONOMY', 'STANDARD', 'PREMIUM'],
      licenseNumber: driver.license_number || '',
      isActive: driver.is_active,
    });
    setEditModal(driver);
  };

  return (
    <>
      <Header
        title="Drivers Fleet"
        subtitle={`${drivers.length} registered drivers · Manage profiles, vehicles & category assignments`}
      />

      <div className="p-4 sm:p-6">
        {/* Fleet KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Drivers</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{drivers.length}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
              <Car className="w-5 h-5 text-navy-800" />
            </div>
          </div>
          <div className="bg-white border border-emerald-100 rounded-2xl p-4 shadow-sm flex items-center justify-between bg-emerald-50/20">
            <div>
              <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Completed Today</div>
              <div className="text-2xl font-black text-emerald-800 mt-0.5">
                {drivers.reduce((acc, d) => acc + (d.completedToday || 0), 0)}
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg">Day</span>
          </div>
          <div className="bg-white border border-indigo-100 rounded-2xl p-4 shadow-sm flex items-center justify-between bg-indigo-50/20">
            <div>
              <div className="text-[11px] font-bold text-indigo-700 uppercase tracking-wider">Completed Month</div>
              <div className="text-2xl font-black text-indigo-800 mt-0.5">
                {drivers.reduce((acc, d) => acc + (d.completedThisMonth || 0), 0)}
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-800 rounded-lg">Month</span>
          </div>
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Rides Completed</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">
                {drivers.reduce((acc, d) => acc + (d.totalCompleted || d.total_trips || 0), 0)}
              </div>
            </div>
            <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded-lg">All Time</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-5">
          <div className="text-xs font-bold text-slate-500">
            Driver Performance & Fleet Availability
          </div>
          <button
            onClick={() => { setCreateModal(true); setForm({ name: '', phone: '', email: '', vehiclePlate: '', vehicleModel: '', assignedCategories: ['ECONOMY', 'STANDARD', 'PREMIUM'], licenseNumber: '', isActive: true }); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-900 text-white font-bold text-xs shadow-md shadow-navy-800/10 transition"
          >
            <UserPlus className="w-4 h-4 text-gold-400" />
            Add Driver
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-slate-400">Loading fleet…</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {drivers.map((driver) => (
              <div key={driver.id} className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                {/* Status Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-navy-800 text-white flex items-center justify-center font-black text-sm">
                      {driver.name[0]?.toUpperCase() || 'D'}
                    </div>
                    <div>
                      <div className="font-extrabold text-sm text-slate-900">{driver.name}</div>
                      <div className="text-[11px] text-slate-500 font-medium">{driver.vehicle_model}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${STATUS_COLOR[driver.current_status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                    {driver.current_status || 'AVAILABLE'}
                  </span>
                </div>

                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Car className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-mono font-bold text-slate-900">{driver.vehicle_plate}</span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-600 font-medium">{driver.vehicle_model}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <a href={`tel:${driver.phone}`} className="hover:text-navy-800 font-semibold transition">{driver.phone}</a>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate font-medium">{driver.email}</span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {(driver.assigned_categories || []).map((cat: string) => (
                      <span key={cat} className="px-2 py-0.5 text-[10px] font-bold bg-slate-100 border border-slate-200 rounded-lg text-slate-700">
                        {cat}
                      </span>
                    ))}
                  </div>

                  {/* Completed Rides Metrics (Day, Month, Total) */}
                  <div className="grid grid-cols-3 gap-2 py-2 px-3 bg-slate-50 border border-slate-200/90 rounded-xl text-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Today</div>
                      <div className="text-sm font-black text-emerald-700">{driver.completedToday || 0}</div>
                      <div className="text-[9px] text-slate-400 font-medium">in a day</div>
                    </div>
                    <div className="border-x border-slate-200">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Month</div>
                      <div className="text-sm font-black text-indigo-700">{driver.completedThisMonth || 0}</div>
                      <div className="text-[9px] text-slate-400 font-medium">in a month</div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total</div>
                      <div className="text-sm font-black text-slate-900">{driver.totalCompleted || driver.total_trips || 0}</div>
                      <div className="text-[9px] text-slate-400 font-medium">all rides</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        {Number(driver.rating || 5.0).toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500 font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        {driver.activeRidesCount || 0} active
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(driver)}
                        title="Edit Driver"
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg border border-slate-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          const action = driver.is_active ? 'deactivate' : 'activate';
                          if (confirm(`${driver.name} is currently ${driver.is_active ? 'Active' : 'Inactive'}. Do you wish to ${action} this driver?`)) {
                            await ApiClient.updateDriver(driver.id, { isActive: !driver.is_active });
                            fetchDrivers();
                          }
                        }}
                        title={driver.is_active ? 'Deactivate Driver' : 'Activate Driver'}
                        className={`p-1.5 rounded-lg border transition ${
                          driver.is_active
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                            : 'text-slate-400 bg-slate-100 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm(`⚠️ PERMANENT DELETE: Are you sure you want to permanently delete driver "${driver.name}" (${driver.vehicle_plate}) from the fleet? This cannot be undone.`)) {
                            try {
                              await ApiClient.deleteDriver(driver.id);
                              alert(`Driver ${driver.name} successfully deleted.`);
                              fetchDrivers();
                            } catch (err: any) {
                              alert('Failed to delete driver: ' + err.message);
                            }
                          }
                        }}
                        title="Delete Driver"
                        className="p-1.5 text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {createModal && (
        <DriverModal
          title="Add New Driver to Fleet"
          form={form}
          setForm={setForm}
          onSubmit={handleCreate}
          onClose={() => setCreateModal(false)}
          saving={saving}
        />
      )}
      {editModal && (
        <DriverModal
          title={`Edit Driver — ${editModal.name}`}
          form={form}
          setForm={setForm}
          onSubmit={handleUpdate}
          onClose={() => setEditModal(null)}
          saving={saving}
        />
      )}
    </>
  );
}
