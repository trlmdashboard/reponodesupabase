const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

module.exports = async (req, res) => {
  // Check if user is authenticated
  if (!await isAuthenticated(req)) {
    return res.redirect(302, '/?message=' + encodeURIComponent('Please login first') + '&type=error');
  }

  // Set HTML content type
  res.setHeader('Content-Type', 'text/html');
  
  // Get user info from session
  const userInfo = await getUserFromSession(req);
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 100px auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .dashboard {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .message {
            margin: 20px 0;
            padding: 15px;
            border-radius: 4px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .logout-btn {
            padding: 10px 20px;
            background-color: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
            margin-top: 20px;
        }
        .logout-btn:hover {
            background-color: #c82333;
        }
        .user-info {
            background-color: #e9ecef;
            padding: 15px;
            border-radius: 4px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>Dashboard</h1>
        <div class="user-info">
            <h3>Welcome, ${userInfo ? userInfo.login_id : 'User'}!</h3>
            <p>You are successfully logged in.</p>
        </div>
        <p>This is a protected dashboard page.</p>
        <a href="/logout" class="logout-btn">Logout</a>
    </div>
</body>
</html>
  `;

  res.end(html);
};

// Authentication check function
async function isAuthenticated(req) {
  try {
    const cookies = parseCookies(req);
    const sessionToken = cookies.session;
    
    if (!sessionToken) {
      return false;
    }

    // Decode the session token to get username
    const decoded = Buffer.from(sessionToken, 'base64').toString('ascii');
    const [username, timestamp] = decoded.split(':');
    
    // Check if session is expired (1 hour)
    const sessionTime = parseInt(timestamp);
    const currentTime = Date.now();
    if (currentTime - sessionTime > 3600000) { // 1 hour
      return false;
    }

    // Verify user still exists in database
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: users, error } = await supabase
      .from('01_users')
      .select('login_id')
      .eq('login_id', username)
      .limit(1);

    if (error || !users || users.length === 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Get user info from session
async function getUserFromSession(req) {
  try {
    const cookies = parseCookies(req);
    const sessionToken = cookies.session;
    
    if (!sessionToken) {
      return null;
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('ascii');
    const [username] = decoded.split(':');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: users, error } = await supabase
      .from('01_users')
      .select('login_id')
      .eq('login_id', username)
      .limit(1);

    if (error || !users || users.length === 0) {
      return null;
    }

    return users[0];
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}

// Helper function to parse cookies
function parseCookies(req) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};
  
  const cookies = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, value] = cookie.trim().split('=');
    cookies[name] = value;
  });
  
  return cookies;
}
