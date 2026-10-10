import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export interface AdminAccessResult {
  user: User | null
  authorized: boolean
  error: string | null
}

export async function checkAdminAccess(): Promise<AdminAccessResult> {
  if (!supabase) {
    return { user: null, authorized: false, error: 'Supabase is not configured.' }
  }

  const { data, error: userError } = await supabase.auth.getUser()
  if (userError || !data.user) {
    return { user: null, authorized: false, error: null }
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  if (adminError) {
    return {
      user: data.user,
      authorized: false,
      error: 'Admin authorization could not be verified. Confirm that the migrations have been applied.',
    }
  }

  return {
    user: data.user,
    authorized: Boolean(adminRecord),
    error: null,
  }
}
