
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

module.exports = async (req, res) => {
  // Set CORS headers if needed
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check content type
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('application/x-www-form-urlencoded')) {
      return res.redirect(302, '/?message=' + encodeURIComponent('Invalid content type') + '&type=error');
    }

    // Parse the form data
   /* 
   let body = '';
    for await (const chunk of req) {
      body += chunk.toString();
    }

    const params = new URLSearchParams(body);
    const login_id = params.get('login_id');
    const login_password = params.get('login_password');
    */

    const { login_id, login_password } = req.body;

    // Validate input
    if (!login_id || !login_password) {
      return res.redirect(302, '/?message=' + encodeURIComponent('Username and password are required') + '&type=error');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query Supabase for user
    const { data: users, error } = await supabase
      .from('01_users')
      .select('login_id, login_password')
      .eq('login_id', login_id)
      .eq('user_type', 'LSC CRP')
      .eq('login_password', login_password);

    if (error) {
      console.error('Supabase error:', error);
      return res.redirect(302, '/?message=' + encodeURIComponent('Database error: ' + error.message) + '&type=error');
    }

    // Check if user exists and password matches
    if (users && users.length > 0) {
      // Login successful - set a simple session token as cookie and redirect to dashboard
      const sessionToken = Buffer.from(`${login_id}:${Date.now()}`).toString('base64');
      
      res.setHeader('Set-Cookie', `session=${sessionToken}; Path=/; HttpOnly; SameSite=Strict; Max-Age=3600`);
      return res.redirect(302, '/dashboard');
    } else {
      // Login failed
      return res.redirect(302, '/?message=' + encodeURIComponent('Invalid username or password') + '&type=error');
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.redirect(302, '/?message=' + encodeURIComponent('Server error: ' + error.message) + '&type=error');
  }
};
