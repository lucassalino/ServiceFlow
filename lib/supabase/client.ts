import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const SUPABASE_URL = "https://ikhxbczktmwkeglomgrv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlraHhiY3prdG13a2VnbG9tZ3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NjI5MTcsImV4cCI6MjA5NjIzODkxN30.tYmHGRCmVbPNIkGCWo0k_Zmpy6i9S7-brWBLQ8Jjd_I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
