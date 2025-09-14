// api/save-data.js
export default async function handler(req, res) {
  // Enable CORS for frontend requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Environment variables check:');
    console.log('SUPABASE_URL exists:', !!process.env.SUPABASE_URL);
    console.log('SUPABASE_KEY exists:', !!process.env.SUPABASE_KEY);

    // Import Supabase client
    const { createClient } = await import('@supabase/supabase-js');
    
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing environment variables:');
      console.error('SUPABASE_URL:', supabaseUrl);
      console.error('SUPABASE_KEY:', supabaseKey ? 'Exists (hidden)' : 'Missing');
      return res.status(500).json({ error: 'Server configuration error - missing credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse JSON body
    let body;
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    const { name, email } = body;
    
    console.log('Received data:', { name, email });

    if (!name || !email) {
      return res.status(400).json({ 
        error: 'Name and email are required',
        received: { name, email }
      });
    }

    // Insert data into Supabase
    const { data, error } = await supabase
      .from('users')
      .insert([{ 
        name: name.trim(), 
        email: email.trim().toLowerCase(), 
        created_at: new Date().toISOString() 
      }])
      .select();

    if (error) {
      console.error('Supabase error details:', error);
      return res.status(500).json({ 
        error: 'Failed to save data to database',
        details: error.message 
      });
    }

    console.log('Successfully saved data:', data);
    
    res.status(200).json({ 
      success: true, 
      message: 'Data saved successfully', 
      data 
    });

  } catch (error) {
    console.error('Unexpected server error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
