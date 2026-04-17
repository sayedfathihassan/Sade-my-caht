import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('id, username, role, is_super_admin').order('created_at', { ascending: false }).limit(5);
  if (error) {
    console.error('Error:', error);
    return;
  }
  console.log(JSON.stringify(data, null, 2));
}

checkUsers();
