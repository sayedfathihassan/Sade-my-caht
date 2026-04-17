import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function promoteUser(username) {
  console.log(`Promoting user: ${username}...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ 
      role: 'admin', 
      is_super_admin: true,
      xp: 999999,
      level: 100
    })
    .eq('username', username)
    .select();

  if (error) {
    console.error(`Error promoting user ${username}:`, error);
  } else if (data.length === 0) {
    console.error(`User ${username} not found!`);
  } else {
    console.log(`Success! ${username} promoted to Owner/Super Admin.`);
    console.log(data[0]);
  }
}

// Promoting both potentials to be sure
await promoteUser('sayed');
await promoteUser('Owner');
