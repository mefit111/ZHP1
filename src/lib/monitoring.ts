import { supabase } from './supabase';

export interface ErrorLog {
  type: string;
  message: string;
  metadata?: Record<string, any>;
  user_id?: string;
}

export async function logError(error: ErrorLog) {
  try {
    // Log error directly to console first
    console.error('Error:', error.type, error.message, error.metadata);    
    
    // Try to log to database if available
    const { error: logError } = await supabase
      .from('admin_audit_logs')
      .insert([{
        action: 'error',
        table_name: 'errors',
        new_data: {
          type: error.type,
          message: error.message,
          metadata: error.metadata,
          user_id: error.user_id
        }
      }]);

    if (logError) {
      console.error('Failed to log error to database:', logError);
    }
  } catch (err) {
    console.error('Failed to log error:', err);
  }
}

export async function monitorDatabaseHealth() {
  try {
    const startTime = performance.now();
    
    // Test basic table access
    const { error: testError } = await supabase
      .from('admins')
      .select('count')
      .limit(1);

    const endTime = performance.now();
    
    const healthReport = {
      status: testError ? 'error' : 'healthy',
      latency: endTime - startTime,
      error: testError?.message
    };

    // Log health check results
    try {
      await supabase
        .from('admin_audit_logs')
        .insert([{
          action: 'health_check',
          new_data: healthReport
        }]);
    } catch (logError) {
      console.error('Failed to log health check:', logError);
    }

    return healthReport;
  } catch (err) {
    console.error('Health check failed:', err);
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}

export async function monitorAuthHealth() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    const healthReport = {
      status: error ? 'error' : 'healthy',
      hasSession: !!session,
      error: error?.message
    };

    // Log health check results
    try {
      await supabase
        .from('admin_audit_logs')
        .insert([{
          action: 'auth_health_check',
          new_data: healthReport
        }]);
    } catch (logError) {
      console.error('Failed to log auth health check:', logError);
    }

    return healthReport;
  } catch (err) {
    console.error('Auth health check failed:', err);
    return {
      status: 'error',
      hasSession: false,
      error: err instanceof Error ? err.message : 'Unknown error'
    };
  }
}