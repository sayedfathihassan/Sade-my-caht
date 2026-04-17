const { createClient } = require('./node_modules/@supabase/supabase-js');
const dotenv = require('./node_modules/dotenv');
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function promoteUser(username) {
  if (!username) {
    console.error('Please provide a username');
    process.exit(1);
  }

  console.log(`Promoting user: ${username}...`);
  
  const { data, error } = await supabase
    .from('users')
    .update({ 
      role: 'admin', 
      is_super_admin: true,
      xp: 999999, // Optional: give owner high level
      level: 100
    })
    .eq('username', username)
    .select();

  if (error) {
    console.error('Error promoting user:', error);
  } else if (data.length === 0) {
    console.error('User not found!');
  } else {
    console.log('Success! User promoted to Owner/Super Admin.');
    console.log(data[0]);
  }
}

const username = process.argv[2];
promoteUser(username);
