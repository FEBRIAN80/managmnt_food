import { User } from '@supabase/supabase-js';
import { Database } from '../lib/supabase';

export type UserProfile = Database['public']['Tables']['users']['Row'];

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isCashier: boolean;
}