const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse form data
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/x-www-form-urlencoded')) {
      return res.redirect('/?message=' + encodeURIComponent('Invalid content type') + '&type=error');
    }

    // Parse the form data manually
    const body = await new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => resolve(data));
      req.on('error', reject);
    });

    const params = new URLSearchParams(body);
    const login_id = params.get('login_id');
    const login_password = params.get('login_password');

    // Validate input
    if (!login_id || !login_password) {
      return res.redirect('/?message=' + encodeURIComponent('Username and password are required') + '&type=error');
    }

    // Query Supabase for user
    const { data: users, error } = await supabase
      .from('01_users')
      .select('login_id, login_password')
      .eq('login_id', login_id)
      .eq('login_password', login_password); // Note: This is plain text comparison

    if (error) {
      console.error('Supabase error:', error);
      return res.redirect('/?message=' + encodeURIComponent('Database error') + '&type=error');
    }

    // Check if user exists and password matches
    if (users && users.length > 0) {
      // Login successful - redirect to dashboard with success message
      return res.redirect('/dashboard?message=' + encodeURIComponent(`Welcome ${login_id}!`) + '&type=success');
    } else {
      // Login failed
      return res.redirect('/?message=' + encodeURIComponent('Invalid username or password') + '&type=error');
    }

  } catch (error) {
    console.error('Server error:', error);
    return res.redirect('/?message=' + encodeURIComponent('Server error') + '&type=error');
  }
};
