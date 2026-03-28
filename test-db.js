const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const envFile = fs.readFileSync('.env.local', 'utf8');
const lines = envFile.split('\n');
let url = '';
let key = '';

lines.forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
});

const supabase = createClient(url, key);

async function checkConnection() {
  console.log("Connecting to Supabase...");
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Connection failed:", error.message);
  } else {
    console.log("Connection successful! Supabase is fully configured and ready.");
  }
}

checkConnection();
