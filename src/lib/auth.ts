import { supabase } from './supabase';

export interface AdminPermissions {
  can_manage_users: boolean;
  can_manage_camps: boolean;
  can_manage_registrations: boolean;
  can_manage_admins?: boolean;
}

export async function checkAdminPermissions(): Promise<AdminPermissions | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('role, permissions')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching admin:', error);
      return null;
    }

    if (!admin) {
      console.error('No admin record found');
      return null;
    }

    // Super admins have all permissions
    if (admin.role === 'super_admin') {
      return {
        can_manage_users: true,
        can_manage_camps: true,
        can_manage_registrations: true,
        can_manage_admins: true
      };
    }

    return admin.permissions as AdminPermissions;
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    return null;
  }
}

export async function hasPermission(permission: keyof AdminPermissions): Promise<boolean> {
  const permissions = await checkAdminPermissions();
  return !!permissions && !!permissions[permission];
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return !!admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}