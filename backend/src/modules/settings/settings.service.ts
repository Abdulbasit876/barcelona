import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';

export interface CategoryAutoAssignmentRule {
  category: string;
  driverId: string | null;
  driverIds?: string[];
  driverName?: string;
  autoAssignEnabled: boolean;
  fallbackDriverId?: string | null;
  fallbackDriverName?: string;
  updatedAt: string;
}

export interface DepositConfig {
  deposit_percentage: number;
  allow_cash_balance: boolean;
  minimum_deposit_eur: number;
  category_overrides?: Record<string, number>;
  category_auto_assignments?: Record<string, CategoryAutoAssignmentRule>;
}

export interface PricingRulesConfig {
  // 1. Airport Transfers (AMB Zone Reference)
  airport_metropolitan_km_rate: number;
  airport_outside_km_rate?: number;
  airport_minimum_fare?: number;
  free_waiting_mins_airport: number;

  // 2. City Point-to-Point Transfers
  city_base_fare: number;
  city_base_threshold_km: number;
  city_per_km_rate: number;
  free_waiting_mins_standard: number;

  // 3. Cruise Port Transfers
  cruise_port_sedan_base?: number;
  cruise_port_van_fixed?: number;
  free_waiting_mins_port?: number;

  // 4. Sants Train Station Transfers
  sants_station_sedan_base?: number;
  sants_station_van_fixed?: number;
  free_waiting_mins_sants?: number;

  // 5. Sightseeing Tours & Hourly Chauffeur
  city_tour_hourly_rate?: number;
  company_trip_hourly_rate: number;
  city_tour_min_hours?: number;
  free_waiting_mins_tour?: number;

  // 6. Vehicle Category Surcharges
  surcharge_economy?: number;
  surcharge_standard?: number;
  surcharge_premium?: number;
  surcharge_standard_van?: number;
  surcharge_premium_van?: number;
  surcharge_electric?: number;

  // 7. Child Safety Seats & Extras
  baby_seat_price: number;
  baby_booster_price: number;

  // 8. Payment & Online Deposit Rules
  deposit_percentage?: number;
  minimum_deposit_eur?: number;
  allow_cash_balance?: boolean;
  allow_full_online_payment?: boolean;

  // 9. Overtime & Night Hours
  overtime_enabled?: boolean;
  overtime_start_hour?: number;
  overtime_end_hour?: number;
  overtime_surcharge_percent?: number;
}

export interface DispatchConfig {
  mode: 'AUTO' | 'MANUAL' | 'HYBRID';
  auto_assign_enabled: boolean;
  max_active_rides_per_driver: number;
  approval_required_transfer_types: string[];
  overtime_enabled: boolean;
  overtime_start_hour: number;
  overtime_end_hour: number;
  overtime_surcharge_percent: number;
}

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  // In-memory persistent cache backed by Supabase audit_logs with TTL
  private settingsCache: Record<string, { value: any; expiresAt: number }> = {};

  private defaultDepositConfig: DepositConfig = {
    deposit_percentage: 20,
    allow_cash_balance: true,
    minimum_deposit_eur: 10,
    category_auto_assignments: {
      ECONOMY: {
        category: 'ECONOMY',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      STANDARD: {
        category: 'STANDARD',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      PREMIUM: {
        category: 'PREMIUM',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      STANDARD_VAN: {
        category: 'STANDARD_VAN',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      PREMIUM_VAN: {
        category: 'PREMIUM_VAN',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      ELECTRIC: {
        category: 'ELECTRIC',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
      LARGE_GROUP: {
        category: 'LARGE_GROUP',
        driverId: null,
        autoAssignEnabled: false,
        updatedAt: new Date().toISOString(),
      },
    },
  };

  private defaultPricingRules: PricingRulesConfig = {
    // Airport Transfers
    airport_metropolitan_km_rate: 3.0,
    airport_outside_km_rate: 2.5,
    airport_minimum_fare: 35.0,
    free_waiting_mins_airport: 60,

    // City Transfers
    city_base_fare: 25.0,
    city_base_threshold_km: 2.5,
    city_per_km_rate: 3.0,
    free_waiting_mins_standard: 15,

    // Cruise Port Transfers
    cruise_port_sedan_base: 42.0,
    cruise_port_van_fixed: 70.0,
    free_waiting_mins_port: 30,

    // Sants Train Station Transfers
    sants_station_sedan_base: 32.0,
    sants_station_van_fixed: 45.0,
    free_waiting_mins_sants: 15,

    // City Tour & Hourly Chauffeur
    city_tour_hourly_rate: 65.0,
    company_trip_hourly_rate: 65.0,
    city_tour_min_hours: 2,
    free_waiting_mins_tour: 15,

    // Vehicle Category Surcharges
    surcharge_economy: 0.0,
    surcharge_standard: 5.0,
    surcharge_premium: 10.0,
    surcharge_standard_van: 15.0,
    surcharge_premium_van: 22.5,
    surcharge_electric: 12.0,

    // Child Safety Seats
    baby_seat_price: 9.0,
    baby_booster_price: 4.5,

    // Payment & Online Deposit Rules
    deposit_percentage: 20,
    minimum_deposit_eur: 10,
    allow_cash_balance: true,
    allow_full_online_payment: true,

    // Overtime / Night Hours
    overtime_enabled: false,
    overtime_start_hour: 22,
    overtime_end_hour: 6,
    overtime_surcharge_percent: 20,
  };

  private defaultDispatchConfig: DispatchConfig = {
    mode: 'HYBRID',
    auto_assign_enabled: true,
    max_active_rides_per_driver: 2,
    approval_required_transfer_types: ['CRUISE_PORT', 'SANTS_STATION', 'CUSTOM_QUOTE'],
    overtime_enabled: false,
    overtime_start_hour: 22,
    overtime_end_hour: 6,
    overtime_surcharge_percent: 20,
  };

  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Helper to retrieve persistent settings from Supabase audit_logs JSONB storage
   */
  private async readPersistedSetting<T>(key: string, defaultValue: T, forceRefresh = false): Promise<T> {
    const cached = this.settingsCache[key];
    const now = Date.now();
    if (!forceRefresh && cached && now < cached.expiresAt) {
      return cached.value as T;
    }

    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('audit_logs')
        .select('metadata')
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', key)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.metadata?.value) {
        this.settingsCache[key] = { value: data.metadata.value, expiresAt: now + 5000 };
        return data.metadata.value as T;
      }
    } catch (err) {
      this.logger.warn(`Could not read persisted setting for ${key}: ${err}`);
    }

    this.settingsCache[key] = { value: defaultValue, expiresAt: now + 5000 };
    return defaultValue;
  }

  /**
   * Helper to persist setting permanently to Supabase audit_logs JSONB storage
   */
  private async writePersistedSetting<T>(key: string, value: T): Promise<T> {
    this.settingsCache[key] = { value, expiresAt: Date.now() + 60000 };

    try {
      // Clean previous row to keep database tidy
      await this.supabase
        .getClient()
        .from('audit_logs')
        .delete()
        .eq('action', 'SETTINGS_STORE')
        .eq('entity_id', key);

      // Insert new setting row
      await this.supabase
        .getClient()
        .from('audit_logs')
        .insert({
          actor_type: 'SYSTEM',
          action: 'SETTINGS_STORE',
          entity_type: 'system_settings',
          entity_id: key,
          metadata: {
            key,
            value,
            updated_at: new Date().toISOString(),
          },
        });
    } catch (err) {
      this.logger.error(`Failed to save persistent setting ${key} to Supabase: ${err}`);
    }

    return value;
  }

  async getAllSettings() {
    const depositConfig = await this.getDepositConfig();
    const pricingRules = await this.getPricingRules();
    const dispatchConfig = await this.getDispatchConfig();

    return {
      depositConfig,
      pricingRules,
      dispatchConfig,
    };
  }

  async getDepositConfig(forceRefresh = false): Promise<DepositConfig> {
    return this.readPersistedSetting<DepositConfig>('deposit_config', this.defaultDepositConfig, forceRefresh);
  }

  async updateDepositConfig(config: Partial<DepositConfig>) {
    const current = await this.getDepositConfig();
    const updated = {
      ...current,
      ...config,
      category_auto_assignments: {
        ...(current.category_auto_assignments || {}),
        ...(config.category_auto_assignments || {}),
      },
    };

    return this.writePersistedSetting<DepositConfig>('deposit_config', updated);
  }

  async getPricingRules(forceRefresh = false): Promise<PricingRulesConfig> {
    return this.readPersistedSetting<PricingRulesConfig>('pricing_rules', this.defaultPricingRules, forceRefresh);
  }

  getPricingRulesSync(): PricingRulesConfig {
    return this.settingsCache['pricing_rules']?.value || this.defaultPricingRules;
  }

  async updatePricingRules(rules: Partial<PricingRulesConfig>) {
    const current = await this.getPricingRules();
    const updated = { ...current, ...rules };
    return this.writePersistedSetting<PricingRulesConfig>('pricing_rules', updated);
  }

  async getDispatchConfig(): Promise<DispatchConfig> {
    return this.readPersistedSetting<DispatchConfig>('dispatch_config', this.defaultDispatchConfig);
  }

  async updateDispatchConfig(config: Partial<DispatchConfig>) {
    const current = await this.getDispatchConfig();
    const updated = { ...current, ...config };
    return this.writePersistedSetting<DispatchConfig>('dispatch_config', updated);
  }

  /**
   * Get multi-driver IDs assigned to a vehicle category
   */
  async getCategoryDriverIds(category: string): Promise<string[]> {
    const norm = category.toUpperCase().replace(/\s+/g, '_');
    // 1. Try from dedicated table
    try {
      const { data, error } = await this.supabase
        .getClient()
        .from('vehicle_category_drivers')
        .select('driver_id')
        .eq('category', norm);

      if (!error && data && data.length > 0) {
        return data.map((r: any) => r.driver_id);
      }
    } catch {}

    // 2. Fall back to persistent depositConfig storage
    const config = await this.getDepositConfig();
    const assignments = config.category_auto_assignments || {};
    const rule = assignments[norm] || assignments[category];
    if (rule?.driverIds && Array.isArray(rule.driverIds)) {
      return rule.driverIds;
    }
    if (rule?.driverId) {
      return [rule.driverId];
    }
    return [];
  }

  /**
   * Set multi-driver IDs assigned to a vehicle category
   */
  async setCategoryDriverIds(category: string, driverIds: string[]): Promise<{ success: boolean; driverIds: string[] }> {
    const norm = category.toUpperCase().replace(/\s+/g, '_');
    const validDriverIds = Array.from(new Set(driverIds.filter(Boolean)));

    // 1. Update in depositConfig persistent settings
    const currentConfig = await this.getDepositConfig();
    const currentAssignments = { ...(currentConfig.category_auto_assignments || {}) };
    const existingRule = currentAssignments[norm] || {
      category: norm,
      driverId: validDriverIds[0] || null,
      autoAssignEnabled: true,
      updatedAt: new Date().toISOString(),
    };

    currentAssignments[norm] = {
      ...existingRule,
      category: norm,
      driverId: validDriverIds[0] || null,
      driverIds: validDriverIds,
      updatedAt: new Date().toISOString(),
    };

    await this.updateDepositConfig({
      category_auto_assignments: currentAssignments,
    });

    // 2. Try updating dedicated vehicle_category_drivers table if available
    try {
      const client = this.supabase.getClient();
      await client.from('vehicle_category_drivers').delete().eq('category', norm);
      if (validDriverIds.length > 0) {
        const rows = validDriverIds.map((driver_id) => ({
          category: norm,
          driver_id,
        }));
        await client.from('vehicle_category_drivers').insert(rows);
      }
    } catch (tblErr) {
      this.logger.debug(`Dedicated vehicle_category_drivers table update skipped: ${tblErr}`);
    }

    return { success: true, driverIds: validDriverIds };
  }

  /**
   * Auto Assignment Rule Lookup for New Bookings
   */
  async getAutoAssignmentForCategory(category: string): Promise<CategoryAutoAssignmentRule | null> {
    const depositConfig = await this.getDepositConfig();
    const assignments = depositConfig.category_auto_assignments || {};
    const norm = category.toUpperCase().replace(/\s+/g, '_');

    // Check exact match or known alias
    const rule = assignments[norm] || assignments[category];
    if (rule && rule.autoAssignEnabled && (rule.driverId || (rule.driverIds && rule.driverIds.length > 0))) {
      return rule;
    }

    return null;
  }
}

