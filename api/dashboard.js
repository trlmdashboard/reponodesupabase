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
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding-top: 60px;
            padding-bottom: 70px;
            min-height: 100vh;
        }
        
        /* Top Title Bar */
        .title-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            height: 60px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .title-bar h1 {
            font-size: 1.5rem;
            font-weight: 600;
        }
        
        .logout-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
            text-decoration: none;
            font-size: 0.9rem;
        }
        
        .logout-btn:hover {
            background: rgba(255,255,255,0.3);
            transform: translateY(-1px);
        }
        
        /* Main Content */
        .dashboard {
            max-width: 800px;
            margin: 20px auto;
            padding: 30px;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .welcome-section {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .welcome-section h2 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.8rem;
        }
        
        .welcome-section p {
            color: #666;
            font-size: 1.1rem;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin: 30px 0;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #666;
            margin-top: 5px;
        }
        
        /* Bottom Navigation Bar */
        .nav-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 70px;
            background: white;
            display: flex;
            align-items: center;
            justify-content: space-around;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        
        .nav-item {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 10px;
            color: #666;
            text-decoration: none;
            transition: all 0.3s ease;
            flex: 1;
            height: 100%;
        }
        
        .nav-item:hover {
            background: #f8f9fa;
            color: #667eea;
        }
        
        .nav-item.active {
            color: #667eea;
        }
        
        .nav-icon {
            font-size: 1.2rem;
            margin-bottom: 4px;
        }
        
        .nav-label {
            font-size: 0.8rem;
            font-weight: 500;
        }
        
        /* Content Sections */
        .content-section {
            display: none;
            animation: fadeIn 0.3s ease;
        }
        
        .content-section.active {
            display: block;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .section-title {
            color: #333;
            margin-bottom: 20px;
            font-size: 1.4rem;
            border-bottom: 2px solid #f0f0f0;
            padding-bottom: 10px;
        }
        
        .feature-list {
            list-style: none;
            padding: 0;
        }
        
        .feature-list li {
            padding: 15px;
            background: #f8f9fa;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
    </style>
</head>
<body>
    <!-- Top Title Bar -->
    <div class="title-bar">
        <h1>My Dashboard</h1>
        <a href="/logout" class="logout-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
        </a>
    </div>

    <!-- Main Content -->
    <div class="dashboard">
        <div class="welcome-section">
            <h2>Welcome back, ${userInfo ? userInfo.login_id : 'User'}! 👋</h2>
            <p>Here's what's happening with your account today.</p>
        </div>

        <!-- Quick Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">12</div>
                <div class="stat-label">Products</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">3</div>
                <div class="stat-label">Cart Items</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">5</div>
                <div class="stat-label">Orders</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$45</div>
                <div class="stat-label">Incentives</div>
            </div>
        </div>

        <!-- Content Sections -->
        <div id="home-section" class="content-section active">
            <h3 class="section-title">Dashboard Overview</h3>
            <ul class="feature-list">
                <li>📦 <strong>Recent Orders:</strong> Track your latest purchases</li>
                <li>🛒 <strong>Cart Items:</strong> 3 items waiting for checkout</li>
                <li>🎁 <strong>Special Offers:</strong> Check out today's deals</li>
                <li>📊 <strong>Account Summary:</strong> View your activity</li>
            </ul>
        </div>

        <div id="products-section" class="content-section">
            <h3 class="section-title">Products</h3>
            <ul class="feature-list">
                <li>🔍 Browse our product catalog</li>
                <li>🏷️ Filter by categories and brands</li>
                <li>⭐ View product ratings and reviews</li>
                <li>📱 Responsive product grid</li>
            </ul>
        </div>

        <div id="cart-section" class="content-section">
            <h3 class="section-title">Shopping Cart</h3>
            <ul class="feature-list">
                <li>🛒 3 items in your cart</li>
                <li>💰 Total: $156.99</li>
                <li>🚚 Free shipping available</li>
                <li>⚡ Quick checkout process</li>
            </ul>
        </div>

        <div id="orders-section" class="content-section">
            <h3 class="section-title">Order History</h3>
            <ul class="feature-list">
                <li>📋 View order details and status</li>
                <li>📦 Track shipment progress</li>
                <li>🔄 Easy returns and exchanges</li>
                <li>📧 Order notifications</li>
            </ul>
        </div>

        <div id="incentives-section" class="content-section">
            <h3 class="section-title">Rewards & Incentives</h3>
            <ul class="feature-list">
                <li>🎯 Earn points on purchases</li>
                <li>🏆 Member exclusive deals</li>
                <li>💰 Cashback offers</li>
                <li>🎁 Birthday rewards</li>
            </ul>
        </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="nav-bar">
        <a href="#" class="nav-item active" data-section="home-section">
            <div class="nav-icon">🏠</div>
            <div class="nav-label">Home</div>
        </a>
        <a href="#" class="nav-item" data-section="products-section">
            <div class="nav-icon">📦</div>
            <div class="nav-label">Products</div>
        </a>
        <a href="#" class="nav-item" data-section="cart-section">
            <div class="nav-icon">🛒</div>
            <div class="nav-label">Cart</div>
        </a>
        <a href="#" class="nav-item" data-section="orders-section">
            <div class="nav-icon">📋</div>
            <div class="nav-label">Orders</div>
        </a>
        <a href="#" class="nav-item" data-section="incentives-section">
            <div class="nav-icon">🎁</div>
            <div class="nav-label">Incentives</div>
        </a>
    </div>

    <script>
        // Navigation functionality
        document.addEventListener('DOMContentLoaded', function() {
            const navItems = document.querySelectorAll('.nav-item');
            const contentSections = document.querySelectorAll('.content-section');
            
            navItems.forEach(item => {
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Remove active class from all items and sections
                    navItems.forEach(nav => nav.classList.remove('active'));
                    contentSections.forEach(section => section.classList.remove('active'));
                    
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Show corresponding section
                    const sectionId = this.getAttribute('data-section');
                    document.getElementById(sectionId).classList.add('active');
                });
            });
        });
    </script>
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
