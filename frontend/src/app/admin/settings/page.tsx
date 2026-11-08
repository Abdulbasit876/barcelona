'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { ApiClient } from '@/lib/api';
import {
  Sliders,
  DollarSign,
  Percent,
  Save,
  CheckCircle,
  Clock,
  Shield,
  ToggleLeft,
  ToggleRight,
  UserCheck,
  Zap,
  Car,
  AlertCircle,
} from 'lucide-react';

interface AutoAssignmentRule {
  category: string;
  driverId: string | null;
  driverIds?: string[];
  driverName?: string;
  autoAssignEnabled: boolean;
  fallbackDriverId?: string | null;
  fallbackDriverName?: string;
  updatedAt: string;
}

const RIDE_CLASSES = [
  { key: 'ECONOMY', label: 'Economy Transfer', desc: 'Toyota Corolla, Prius, standard hybrid sedans' },
  { key: 'STANDARD', label: 'Standard Sedan', desc: 'Toyota Camry, Lexus ES, Toyota RAV4' },
  { key: 'PREMIUM', label: 'Premium Executive Chauffeur', desc: 'Mercedes-Benz E 220, High-spec executive sedans' },
  { key: 'STANDARD_VAN', label: 'Standard Van', desc: 'Volkswagen Caddy Maxi, Mercedes Vito Tourer (up to 7 pax)' },
  { key: 'PREMIUM_VAN', label: 'Premium / Group Van', desc: 'Mercedes-Benz V-Class, luxury group transport (up to 8 pax)' },
  { key: 'ELECTRIC', label: 'Electric / Green Transfer', desc: 'Tesla Model 3, Model Y, Mercedes EQE' },
  { key: 'LARGE_GROUP', label: 'Large Group Transfers', desc: 'Minibuses, Midibuses, Sprinters for large charters' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [categoryDriverIds, setCategoryDriverIds] = useState<Record<string, string[]>>({});

  const [depositForm, setDepositForm] = useState({
    deposit_percentage: 20,
    allow_cash_balance: true,
    minimum_deposit_eur: 10,
    category_auto_assignments: {} as Record<string, AutoAssignmentRule>,
  });

  const [pricingForm, setPricingForm] = useState({
    city_base_fare: 20.0,
    city_base_threshold_km: 2.5,
    city_per_km_rate: 3.0,
    baby_seat_price: 9.0,
    baby_booster_price: 4.5,
    airport_metropolitan_km_rate: 3.0,
    company_trip_hourly_rate: 65.0,
    free_waiting_mins_standard: 15,
    free_waiting_mins_airport: 60,
  });

  const [dispatchForm, setDispatchForm] = useState({
    mode: 'HYBRID',
    auto_assign_enabled: true,
    max_active_rides_per_driver: 2,
    approval_required_transfer_types: ['CRUISE_PORT', 'SANTS_STATION', 'CUSTOM_QUOTE'] as string[],
    overtime_enabled: false,
    overtime_start_hour: 22,
    overtime_end_hour: 6,
    overtime_surcharge_percent: 20,
  });

  const fetchSettingsAndDrivers = async () => {
    setLoading(true);
    try {
      const [settingsData, driversData] = await Promise.all([
        ApiClient.getSettings(),
        ApiClient.listDrivers().catch(() => []),
      ]);

      setSettings(settingsData);
      setDrivers(driversData || []);

      // Load multi-driver category assignments
      const loadedCategoryDriverIds: Record<string, string[]> = {};
      await Promise.all(
        RIDE_CLASSES.map(async (cls) => {
          try {
            const res = await ApiClient.getCategoryDriverIds(cls.key);
            loadedCategoryDriverIds[cls.key] = res.driverIds || [];
          } catch {
            const fallbackIds = settingsData?.depositConfig?.category_auto_assignments?.[cls.key]?.driverIds;
            const singleId = settingsData?.depositConfig?.category_auto_assignments?.[cls.key]?.driverId;
            loadedCategoryDriverIds[cls.key] = fallbackIds || (singleId ? [singleId] : []);
          }
        }),
      );
      setCategoryDriverIds(loadedCategoryDriverIds);

      if (settingsData.depositConfig) {
        // Ensure default rules exist for all categories
        const existingRules = settingsData.depositConfig.category_auto_assignments || {};
        const mergedRules: Record<string, AutoAssignmentRule> = {};

        RIDE_CLASSES.forEach((cls) => {
          mergedRules[cls.key] = existingRules[cls.key] || {
            category: cls.key,
            driverId: null,
            driverIds: loadedCategoryDriverIds[cls.key] || [],
            autoAssignEnabled: false,
            fallbackDriverId: null,
            updatedAt: new Date().toISOString(),
          };
        });

        setDepositForm({
          ...settingsData.depositConfig,
          category_auto_assignments: mergedRules,
        });
      }

      if (settingsData.pricingRules) setPricingForm(settingsData.pricingRules);
      if (settingsData.dispatchConfig) setDispatchForm(settingsData.dispatchConfig);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsAndDrivers();
  }, []);

  const handleSave = async (section: string, data: any) => {
    setSaving(section);
    try {
      if (section === 'deposit') {
        // Prepare depositForm with driverIds attached to each category rule
        const updatedCategoryAssignments: Record<string, AutoAssignmentRule> = {
          ...(data.category_auto_assignments || {}),
        };
        RIDE_CLASSES.forEach((cls) => {
          const ids = categoryDriverIds[cls.key] || [];
          if (updatedCategoryAssignments[cls.key]) {
            updatedCategoryAssignments[cls.key].driverIds = ids;
            updatedCategoryAssignments[cls.key].driverId = ids[0] || null;
          }
        });

        await ApiClient.updateDepositConfig({
          ...data,
          category_auto_assignments: updatedCategoryAssignments,
        });

        // Persist multi-driver assignments per category
        await Promise.all(
          RIDE_CLASSES.map((cls) =>
            ApiClient.setCategoryDriverIds(cls.key, categoryDriverIds[cls.key] || []),
          ),
        );
      } else if (section === 'pricing') {
        await ApiClient.updatePricingRules(data);
      } else if (section === 'dispatch') {
        await ApiClient.updateDispatchConfig(data);
      }

      setSaved(section);
      setTimeout(() => setSaved(null), 2500);
    } catch (err: any) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  const handleAutoAssignRuleChange = (
    categoryKey: string,
    updates: Partial<AutoAssignmentRule>,
  ) => {
    const currentAssignments = { ...(depositForm.category_auto_assignments || {}) };
    const existing = currentAssignments[categoryKey] || {
      category: categoryKey,
      driverId: null,
      autoAssignEnabled: false,
      fallbackDriverId: null,
      updatedAt: new Date().toISOString(),
    };

    currentAssignments[categoryKey] = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    setDepositForm({
      ...depositForm,
      category_auto_assignments: currentAssignments,
    });
  };

  const DepositPreview = () => {
    const sampleFare = 65;
    const depAmt = ((sampleFare * depositForm.deposit_percentage) / 100).toFixed(2);
    const balAmt = (sampleFare - Number(depAmt)).toFixed(2);

    return (
      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
          <span className="flex items-center gap-1.5">📊 Live Deposit Preview (Example fare: €{sampleFare})</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center bg-white p-3 rounded-lg border border-amber-100 shadow-xs">
          <div>
            <div className="text-[10px] text-slate-400 font-bold uppercase">Total Fare</div>
            <div className="text-base font-extrabold text-slate-900">€{sampleFare}</div>
          </div>
          <div>
            <div className="text-[10px] text-emerald-600 font-bold uppercase">Online Deposit ({depositForm.deposit_percentage}%)</div>
            <div className="text-base font-extrabold text-emerald-700">€{depAmt}</div>
          </div>
          <div>
            <div className="text-[10px] text-amber-700 font-bold uppercase">Driver Collects</div>
            <div className="text-base font-extrabold text-amber-800">€{balAmt}</div>
          </div>
        </div>
      </div>
    );
  };

  const SaveButton = ({ section, data }: { section: string; data: any }) => (
    <button
      onClick={() => handleSave(section, data)}
      disabled={saving === section}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
        saved === section
          ? 'bg-emerald-600 text-white'
          : 'bg-navy-800 hover:bg-navy-900 text-white'
      } disabled:opacity-50`}
    >
      {saved === section ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4 text-gold-400" />}
      {saving === section ? 'Saving...' : saved === section ? 'Saved!' : 'Save Changes'}
    </button>
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <Header title="Deposit & Pricing Settings" subtitle="System configuration and dispatch rules" />
        <div className="p-12 text-center text-slate-400 text-sm font-semibold">
          Loading configuration...
        </div>
      </div>
    );
  }

  // Show all drivers (status field may be undefined if not set in DB)
  const activeDrivers = drivers.filter((d) => d.is_active !== false && d.status !== 'INACTIVE' && d.status !== 'SUSPENDED');

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto">
      <Header
        title="Deposit & Pricing Settings"
        subtitle="Configure online deposit %, fare calculations, vehicle rates, and automated ride assignment"
      />

      <div className="space-y-6">
        {/* Deposit Configuration */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Online Deposit Configuration</h3>
            </div>
            <SaveButton section="deposit" data={depositForm} />
          </div>

          <div className="p-5 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Online Deposit Percentage (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={5}
                  value={depositForm.deposit_percentage}
                  onChange={(e) =>
                    setDepositForm({ ...depositForm, deposit_percentage: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  % of total fare charged online at booking. Remainder paid to driver in cash.
                </p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Minimum Deposit Amount (€)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={depositForm.minimum_deposit_eur}
                  onChange={(e) =>
                    setDepositForm({ ...depositForm, minimum_deposit_eur: Number(e.target.value) })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                />
              </div>
              <div className="flex flex-col gap-2 pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={depositForm.allow_cash_balance}
                    onChange={(e) =>
                      setDepositForm({ ...depositForm, allow_cash_balance: e.target.checked })
                    }
                    className="w-4 h-4 accent-navy-800"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Allow cash balance payment to driver
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  If disabled, customers must pay 100% online.
                </p>
              </div>
            </div>

            <DepositPreview />

            {/* AUTOMATIC RIDE ASSIGNMENT FEATURE */}
            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <h4 className="text-sm font-extrabold text-slate-900">
                    Automatic Ride Assignment
                  </h4>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    Real-Time Dispatch
                  </span>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  {activeDrivers.length} Active Driver{activeDrivers.length === 1 ? '' : 's'} in Fleet
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Assign a dedicated driver to each ride category. When enabled, incoming bookings for
                that category will be instantly assigned to the driver without requiring manual dispatch.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {RIDE_CLASSES.map((cls) => {
                  const rule: AutoAssignmentRule =
                    depositForm.category_auto_assignments?.[cls.key] || {
                      category: cls.key,
                      driverId: null,
                      autoAssignEnabled: false,
                      fallbackDriverId: null,
                      updatedAt: new Date().toISOString(),
                    };

                  return (
                    <div
                      key={cls.key}
                      className={`p-4 rounded-xl border transition-all ${
                        rule.autoAssignEnabled
                          ? 'bg-amber-50/40 border-amber-300 shadow-xs'
                          : 'bg-slate-50/70 border-slate-200 opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Car
                            className={`w-4 h-4 ${
                              rule.autoAssignEnabled ? 'text-amber-600' : 'text-slate-400'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900">{cls.label}</span>
                        </div>

                        {/* ON/OFF TOGGLE */}
                        <button
                          type="button"
                          onClick={() =>
                            handleAutoAssignRuleChange(cls.key, {
                              autoAssignEnabled: !rule.autoAssignEnabled,
                            })
                          }
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold transition ${
                            rule.autoAssignEnabled
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {rule.autoAssignEnabled ? (
                            <>
                              <ToggleRight className="w-3.5 h-3.5" />
                              <span>Auto ON</span>
                            </>
                          ) : (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5" />
                              <span>Auto OFF</span>
                            </>
                          )}
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 mb-3">{cls.desc}</p>

                      {/* MULTIPLE DRIVER ASSIGNMENT */}
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-[10px] font-bold text-slate-700">
                              Assigned Drivers:
                            </label>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {(categoryDriverIds[cls.key] || []).length} assigned
                            </span>
                          </div>

                          {/* Scrollable Driver Dropdown / Multi-Select Box */}
                          <div className="max-h-44 overflow-y-auto space-y-1 bg-white border border-slate-300 rounded-xl p-2 shadow-xs">
                            {activeDrivers.length === 0 ? (
                              <div className="text-[10px] text-slate-400 text-center py-2">
                                No active drivers available
                              </div>
                            ) : (
                              activeDrivers.map((d) => {
                                const isAssigned = (categoryDriverIds[cls.key] || []).includes(d.id);
                                return (
                                  <label
                                    key={d.id}
                                    className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition text-xs ${
                                      isAssigned
                                        ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950 font-bold'
                                        : 'hover:bg-slate-50 text-slate-700 font-medium'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isAssigned}
                                      onChange={(e) => {
                                        const currentIds = categoryDriverIds[cls.key] || [];
                                        const newIds = e.target.checked
                                          ? [...currentIds, d.id]
                                          : currentIds.filter((id) => id !== d.id);
                                        setCategoryDriverIds({
                                          ...categoryDriverIds,
                                          [cls.key]: newIds,
                                        });
                                        handleAutoAssignRuleChange(cls.key, {
                                          driverIds: newIds,
                                          driverId: newIds[0] || null,
                                          autoAssignEnabled: newIds.length > 0 ? true : rule.autoAssignEnabled,
                                        });
                                      }}
                                      className="mt-0.5 w-3.5 h-3.5 accent-emerald-600 rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between">
                                        <span className="truncate">
                                          {isAssigned ? '✓ ' : ''}{d.name}
                                        </span>
                                        {d.rating && (
                                          <span className="text-[10px] text-amber-600 font-bold">
                                            ★ {d.rating}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-normal truncate">
                                        {d.vehicle_plate} • {d.vehicle_model || 'Standard'} {d.phone ? `• ${d.phone}` : ''}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })
                            )}
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">
                            Check all drivers who will receive ride offers for this category.
                          </p>
                        </div>

                        {/* STATUS & LAST UPDATED */}
                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                          <span>
                            {rule.autoAssignEnabled && (categoryDriverIds[cls.key] || []).length > 0 ? (
                              <strong className="text-emerald-700">✓ Multi-Driver Broadcast Active</strong>
                            ) : rule.autoAssignEnabled ? (
                              <strong className="text-amber-700">Auto ON (No drivers selected)</strong>
                            ) : (
                              <span>Manual Dispatch</span>
                            )}
                          </span>
                          <span>
                            {rule.updatedAt
                              ? new Date(rule.updatedAt).toLocaleDateString('en-GB', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Not configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Rules */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">Barcelona Pricing Rules</h3>
            </div>
            <SaveButton section="pricing" data={pricingForm} />
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                {
                  label: 'City Base Fare (€)',
                  key: 'city_base_fare',
                  note: 'Minimum fare for inside-city transfers ≤2.5km',
                },
                {
                  label: 'City Base Distance Threshold (km)',
                  key: 'city_base_threshold_km',
                  note: 'Distance included in base fare',
                },
                {
                  label: 'City Per-Kilometer Rate (€/km)',
                  key: 'city_per_km_rate',
                  note: 'Applied to km beyond base threshold',
                },
                {
                  label: 'Airport Metropolitan Rate (€/km)',
                  key: 'airport_metropolitan_km_rate',
                  note: 'Outside Barcelona city ring per km rate',
                },
                {
                  label: 'Hourly Chauffeur Service Rate (€/h)',
                  key: 'company_trip_hourly_rate',
                  note: 'City tour & hourly chauffeur base rate',
                },
                {
                  label: 'Baby Car Seat Price (€)',
                  key: 'baby_seat_price',
                  note: 'Extra fee per infant/toddler seat',
                },
                {
                  label: 'Child Booster Cushion (€)',
                  key: 'baby_booster_price',
                  note: 'Extra fee per booster cushion',
                },
                {
                  label: 'Standard Free Waiting Time (mins)',
                  key: 'free_waiting_mins_standard',
                  note: 'Complementary wait for city & port pickups',
                },
                {
                  label: 'Airport Free Waiting Time (mins)',
                  key: 'free_waiting_mins_airport',
                  note: 'Included waiting time after flight touchdown',
                },
              ].map((field) => (
                <div key={field.key}>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    {field.label}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={(pricingForm as any)[field.key]}
                    onChange={(e) =>
                      setPricingForm({ ...pricingForm, [field.key]: Number(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">{field.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dispatch Settings */}
        <div className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-extrabold text-slate-900">
                Dispatch Mode & Assignment Rules
              </h3>
            </div>
            <SaveButton section="dispatch" data={dispatchForm} />
          </div>

          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Dispatch Mode</label>
                <select
                  value={dispatchForm.mode}
                  onChange={(e) =>
                    setDispatchForm({ ...dispatchForm, mode: e.target.value as any })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                >
                  <option value="AUTO">AUTO (Full automated dispatch)</option>
                  <option value="HYBRID">HYBRID (Rules-based auto + manual fallback)</option>
                  <option value="MANUAL">MANUAL (Admin manually assigns all rides)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Controls default booking allocation workflow.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Max Active Rides per Driver
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={dispatchForm.max_active_rides_per_driver}
                  onChange={(e) =>
                    setDispatchForm({
                      ...dispatchForm,
                      max_active_rides_per_driver: Number(e.target.value),
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                />
                <p className="text-[11px] text-slate-500 mt-1 font-medium">
                  Prevents driver overload during peak hours.
                </p>
              </div>

              <div className="pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dispatchForm.auto_assign_enabled}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        auto_assign_enabled: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-navy-800"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Enable global auto-assignment engine
                  </span>
                </label>
              </div>
            </div>

            {/* Overtime Night Dispatch Settings */}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-600" />
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Driver Overtime & Night Hours
                  </h4>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dispatchForm.overtime_enabled}
                    onChange={(e) =>
                      setDispatchForm({ ...dispatchForm, overtime_enabled: e.target.checked })
                    }
                    className="w-4 h-4 accent-navy-800"
                  />
                  <span className="text-xs font-bold text-slate-800">Enable Overtime Tracking</span>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Overtime Start Hour (24h)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={dispatchForm.overtime_start_hour}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        overtime_start_hour: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Default: 22:00 (10 PM)</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Overtime End Hour (24h)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={23}
                    value={dispatchForm.overtime_end_hour}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        overtime_end_hour: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                  />
                  <p className="text-[11px] text-slate-500 mt-1 font-medium">Default: 06:00 (6 AM)</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Overtime Driver Bonus Rate (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={dispatchForm.overtime_surcharge_percent}
                    onChange={(e) =>
                      setDispatchForm({
                        ...dispatchForm,
                        overtime_surcharge_percent: Number(e.target.value),
                      })
                    }
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-navy-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
