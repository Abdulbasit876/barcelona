import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../../common/services/supabase.service';
import { CreateDriverDto, ResetDriverPasswordDto, UpdateDriverDto } from './drivers.dto';

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(private readonly supabase: SupabaseService) {}

  async listDrivers() {
    const { data: drivers, error } = await this.supabase
      .getClient()
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new BadRequestException(error.message);

    // Fetch all bookings for these drivers to calculate active and completed metrics
    const driverIds = (drivers || []).map((d) => d.id);
    const { data: driverBookings } = await this.supabase
      .getClient()
      .from('bookings')
      .select('id, driver_id, status, updated_at, pickup_datetime')
      .in('driver_id', driverIds);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

    const activeMap = new Map<string, number>();
    const todayCompletedMap = new Map<string, number>();
    const monthCompletedMap = new Map<string, number>();
    const totalCompletedMap = new Map<string, number>();

    (driverBookings || []).forEach((b) => {
      const dId = b.driver_id;
      if (b.status === 'ASSIGNED' || b.status === 'IN_PROGRESS' || b.status === 'ACCEPTED') {
        activeMap.set(dId, (activeMap.get(dId) || 0) + 1);
      } else if (b.status === 'COMPLETED') {
        totalCompletedMap.set(dId, (totalCompletedMap.get(dId) || 0) + 1);
        const completionDate = new Date(b.updated_at || b.pickup_datetime);
        if (completionDate >= startOfMonth) {
          monthCompletedMap.set(dId, (monthCompletedMap.get(dId) || 0) + 1);
        }
        if (completionDate >= startOfToday) {
          todayCompletedMap.set(dId, (todayCompletedMap.get(dId) || 0) + 1);
        }
      }
    });

    return (drivers || []).map((driver) => ({
      ...driver,
      activeRidesCount: activeMap.get(driver.id) || 0,
      completedToday: todayCompletedMap.get(driver.id) || 0,
      completedThisMonth: monthCompletedMap.get(driver.id) || 0,
      totalCompleted: totalCompletedMap.get(driver.id) || (driver.total_trips || 0),
    }));
  }

  async getDriverById(id: string) {
    const { data: driver, error } = await this.supabase
      .getClient()
      .from('drivers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !driver) throw new NotFoundException('Driver not found');

    // Get recent trips
    const { data: recentTrips } = await this.supabase
      .getClient()
      .from('bookings')
      .select('*')
      .eq('driver_id', id)
      .order('pickup_datetime', { ascending: false })
      .limit(10);

    return {
      ...driver,
      recentTrips: recentTrips || [],
    };
  }

  async createDriver(dto: CreateDriverDto) {
    const generatedPassword = dto.password || `BcnDriver_${Math.floor(1000 + Math.random() * 9000)}!`;
    let authUserId: string | null = null;

    // 1. Create user in Supabase Auth
    try {
      const { data: authUser, error: authErr } = await this.supabase
        .getClient()
        .auth.admin.createUser({
          email: dto.email,
          password: generatedPassword,
          email_confirm: true,
          user_metadata: {
            role: 'driver',
            name: dto.name,
            phone: dto.phone,
            vehicle_plate: dto.vehiclePlate,
          },
        });

      if (!authErr && authUser?.user) {
        authUserId = authUser.user.id;
      } else if (authErr) {
        this.logger.warn(`Auth user creation notice: ${authErr.message}`);
      }
    } catch (err: any) {
      this.logger.warn(`Supabase Auth user creation skipped or failed: ${err.message}`);
    }

    // 2. Insert into drivers table
    const { data, error } = await this.supabase
      .getClient()
      .from('drivers')
      .insert({
        user_id: authUserId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        vehicle_plate: dto.vehiclePlate,
        vehicle_model: dto.vehicleModel,
        assigned_categories: dto.assignedCategories || ['ECONOMY', 'STANDARD', 'PREMIUM'],
        license_number: dto.licenseNumber || null,
        is_active: dto.isActive !== undefined ? dto.isActive : true,
        is_available: true,
        current_status: 'AVAILABLE',
      })
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);

    return {
      ...data,
      credentials: {
        login: dto.email,
        phone: dto.phone,
        password: generatedPassword,
        portalUrl: 'http://localhost:3002',
      },
    };
  }

  async resetDriverPassword(id: string, dto?: ResetDriverPasswordDto) {
    const driver = await this.getDriverById(id);
    const newPassword = dto?.password || `BcnDriver_${Math.floor(1000 + Math.random() * 9000)}!`;

    if (driver.user_id) {
      const { error } = await this.supabase
        .getClient()
        .auth.admin.updateUserById(driver.user_id, {
          password: newPassword,
        });

      if (error) {
        this.logger.error(`Failed to update driver password in auth: ${error.message}`);
      }
    }

    return {
      success: true,
      message: 'Driver credentials updated successfully',
      driverId: id,
      driverName: driver.name,
      newPassword,
    };
  }

  async updateDriver(id: string, dto: UpdateDriverDto) {
    const updates: Record<string, any> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.vehiclePlate !== undefined) updates.vehicle_plate = dto.vehiclePlate;
    if (dto.vehicleModel !== undefined) updates.vehicle_model = dto.vehicleModel;
    if (dto.assignedCategories !== undefined) updates.assigned_categories = dto.assignedCategories;
    if (dto.licenseNumber !== undefined) updates.license_number = dto.licenseNumber;
    if (dto.isActive !== undefined) updates.is_active = dto.isActive;
    if (dto.isAvailable !== undefined) updates.is_available = dto.isAvailable;
    if (dto.currentStatus !== undefined) updates.current_status = dto.currentStatus;

    const { data, error } = await this.supabase
      .getClient()
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new BadRequestException(error.message);
    return data;
  }

  async deleteDriver(id: string) {
    // Unlink any bookings referencing this driver
    await this.supabase
      .getClient()
      .from('bookings')
      .update({ driver_id: null })
      .eq('driver_id', id);

    // Delete driver
    const { error } = await this.supabase
      .getClient()
      .from('drivers')
      .delete()
      .eq('id', id);

    if (error) {
      // Fallback to soft delete
      await this.supabase
        .getClient()
        .from('drivers')
        .update({ is_active: false, is_available: false, current_status: 'OFFLINE' })
        .eq('id', id);
      return { success: true, message: 'Driver deactivated and removed from dispatch' };
    }

    return { success: true, message: 'Driver deleted successfully' };
  }
}
