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
            min-height: 400px;
        }
        
        /* Home Section */
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
            transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
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
        
        /* Content Sections */
        .content-section {
            animation: fadeIn 0.3s ease;
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
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* Products Section */
        .products-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .product-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 15px;
            text-align: center;
            transition: all 0.3s ease;
        }
        
        .product-card:hover {
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            transform: translateY(-2px);
        }
        
        .product-image {
            width: 100%;
            height: 120px;
            background: #f8f9fa;
            border-radius: 4px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
        }
        
        .product-name {
            font-weight: bold;
            margin-bottom: 5px;
            color: #333;
        }
        
        .product-price {
            color: #667eea;
            font-weight: bold;
            margin-bottom: 10px;
        }
        
        /* Cart Section */
        .cart-items {
            margin-top: 20px;
        }
        
        .cart-item {
            display: flex;
            align-items: center;
            padding: 15px;
            background: #f8f9fa;
            margin-bottom: 10px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        
        .cart-item-image {
            width: 60px;
            height: 60px;
            background: #e0e0e0;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 15px;
            font-size: 1.2rem;
        }
        
        .cart-item-details {
            flex: 1;
        }
        
        .cart-item-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .cart-item-price {
            color: #667eea;
            font-weight: bold;
        }
        
        .cart-summary {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-top: 20px;
            text-align: center;
        }
        
        /* Orders Section */
        .order-list {
            margin-top: 20px;
        }
        
        .order-item {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #667eea;
        }
        
        .order-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .order-id {
            font-weight: bold;
            color: #333;
        }
        
        .order-status {
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .status-delivered {
            background: #d4edda;
            color: #155724;
        }
        
        .status-pending {
            background: #fff3cd;
            color: #856404;
        }
        
        .status-shipped {
            background: #cce7ff;
            color: #004085;
        }
        
        /* Incentives Section */
        .rewards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        
        .reward-card {
            background: white;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .reward-icon {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .reward-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #333;
        }
        
        .reward-description {
            color: #666;
            margin-bottom: 15px;
            font-size: 0.9rem;
        }
        
        .reward-points {
            background: #667eea;
            color: white;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8rem;
            font-weight: bold;
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
            cursor: pointer;
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
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
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
        <!-- Home Section -->
        <div id="home-section" class="content-section">
            <div class="welcome-section">
                <h2>Welcome back, ${userInfo ? userInfo.login_id : 'User'}! 👋</h2>
                <p>Here's what's happening with your account today.</p>
            </div>

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

            <h3 class="section-title">Dashboard Overview</h3>
            <ul class="feature-list">
                <li>📦 <strong>Recent Orders:</strong> Track your latest purchases</li>
                <li>🛒 <strong>Cart Items:</strong> 3 items waiting for checkout</li>
                <li>🎁 <strong>Special Offers:</strong> Check out today's deals</li>
                <li>📊 <strong>Account Summary:</strong> View your activity</li>
            </ul>
        </div>

        <!-- Products Section -->
        <div id="products-section" class="content-section" style="display: none;">
            <div class="welcome-section">
                <h2>Our Products 🛍️</h2>
                <p>Discover our amazing collection of products</p>
            </div>

            <div class="products-grid">
                <div class="product-card">
                    <div class="product-image">📱</div>
                    <div class="product-name">Smartphone X1</div>
                    <div class="product-price">$599.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
                <div class="product-card">
                    <div class="product-image">💻</div>
                    <div class="product-name">Laptop Pro</div>
                    <div class="product-price">$1299.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
                <div class="product-card">
                    <div class="product-image">🎧</div>
                    <div class="product-name">Wireless Headphones</div>
                    <div class="product-price">$199.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
                <div class="product-card">
                    <div class="product-image">⌚</div>
                    <div class="product-name">Smart Watch</div>
                    <div class="product-price">$299.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
                <div class="product-card">
                    <div class="product-image">📷</div>
                    <div class="product-name">Digital Camera</div>
                    <div class="product-price">$499.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
                <div class="product-card">
                    <div class="product-image">🎮</div>
                    <div class="product-name">Gaming Console</div>
                    <div class="product-price">$399.99</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; width: 100%;">Add to Cart</button>
                </div>
            </div>
        </div>

        <!-- Cart Section -->
        <div id="cart-section" class="content-section" style="display: none;">
            <div class="welcome-section">
                <h2>Your Shopping Cart 🛒</h2>
                <p>Review your items before checkout</p>
            </div>

            <div class="cart-items">
                <div class="cart-item">
                    <div class="cart-item-image">📱</div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">Smartphone X1</div>
                        <div class="cart-item-price">$599.99</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">-</button>
                        <span>1</span>
                        <button style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </div>
                <div class="cart-item">
                    <div class="cart-item-image">🎧</div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">Wireless Headphones</div>
                        <div class="cart-item-price">$199.99</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">-</button>
                        <span>2</span>
                        <button style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </div>
                <div class="cart-item">
                    <div class="cart-item-image">⌚</div>
                    <div class="cart-item-details">
                        <div class="cart-item-name">Smart Watch</div>
                        <div class="cart-item-price">$299.99</div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <button style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">-</button>
                        <span>1</span>
                        <button style="background: #28a745; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">+</button>
                    </div>
                </div>
            </div>
            <div class="cart-summary">
                <h3>Order Summary</h3>
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Subtotal:</span>
                    <span>$1299.97</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0;">
                    <span>Shipping:</span>
                    <span>$0.00</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 15px 0; font-size: 1.2rem; font-weight: bold;">
                    <span>Total:</span>
                    <span>$1299.97</span>
                </div>
                <button style="background: #28a745; color: white; border: none; padding: 12px 30px; border-radius: 6px; cursor: pointer; font-size: 1.1rem; margin-top: 10px; width: 100%;">Proceed to Checkout</button>
            </div>
        </div>

        <!-- Orders Section -->
        <div id="orders-section" class="content-section" style="display: none;">
            <div class="welcome-section">
                <h2>Your Orders 📦</h2>
                <p>Track your orders and their status</p>
            </div>

            <div class="order-list">
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-id">ORDER #12345</div>
                        <div class="order-status status-delivered">Delivered</div>
                    </div>
                    <div style="margin: 5px 0;">Placed on: Oct 15, 2023</div>
                    <div style="margin: 5px 0;">Total: $299.99</div>
                    <div style="margin: 5px 0;">Items: Smart Watch</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">View Details</button>
                </div>
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-id">ORDER #12344</div>
                        <div class="order-status status-shipped">Shipped</div>
                    </div>
                    <div style="margin: 5px 0;">Placed on: Oct 10, 2023</div>
                    <div style="margin: 5px 0;">Total: $799.98</div>
                    <div style="margin: 5px 0;">Items: Laptop Pro</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Track Order</button>
                </div>
                <div class="order-item">
                    <div class="order-header">
                        <div class="order-id">ORDER #12343</div>
                        <div class="order-status status-pending">Processing</div>
                    </div>
                    <div style="margin: 5px 0;">Placed on: Oct 5, 2023</div>
                    <div style="margin: 5px 0;">Total: $199.99</div>
                    <div style="margin: 5px 0;">Items: Wireless Headphones</div>
                    <button style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">View Details</button>
                </div>
            </div>
        </div>

        <!-- Incentives Section -->
        <div id="incentives-section" class="content-section" style="display: none;">
            <div class="welcome-section">
                <h2>Rewards & Incentives 🎁</h2>
                <p>Your rewards and available offers</p>
            </div>

            <div class="rewards-grid">
                <div class="reward-card">
                    <div class="reward-icon">⭐</div>
                    <div class="reward-title">Loyalty Points</div>
                    <div class="reward-description">Earn points on every purchase and redeem for discounts</div>
                    <div class="reward-points">1,250 Points</div>
                </div>
                <div class="reward-card">
                    <div class="reward-icon">💰</div>
                    <div class="reward-title">Cashback</div>
                    <div class="reward-description">5% cashback on all orders over $50</div>
                    <div class="reward-points">$45.00 Available</div>
                </div>
                <div class="reward-card">
                    <div class="reward-icon">🎁</div>
                    <div class="reward-title">Special Offers</div>
                    <div class="reward-description">Exclusive member discounts and early access to sales</div>
                    <div class="reward-points">3 Active Offers</div>
                </div>
                <div class="reward-card">
                    <div class="reward-icon">🏆</div>
                    <div class="reward-title">VIP Status</div>
                    <div class="reward-description">Enjoy premium benefits with Gold membership</div>
                    <div class="reward-points">Gold Tier</div>
                </div>
                <div class="reward-card">
                    <div class="reward-icon">🎯</div>
                    <div class="reward-title">Referral Bonus</div>
                    <div class="reward-description">Get $20 for each friend you refer</div>
                    <div class="reward-points">2/5 Referrals</div>
                </div>
                <div class="reward-card">
                    <div class="reward-icon">📧</div>
                    <div class="reward-title">Newsletter</div>
                    <div class="reward-description">Subscribe for weekly deals and updates</div>
                    <div class="reward-points">Subscribed</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Bottom Navigation Bar -->
    <div class="nav-bar">
        <div class="nav-item active" data-section="home-section">
            <div class="nav-icon">🏠</div>
            <div class="nav-label">Home</div>
        </div>
        <div class="nav-item" data-section="products-section">
            <div class="nav-icon">📦</div>
            <div class="nav-label">Products</div>
        </div>
        <div class="nav-item" data-section="cart-section">
            <div class="nav-icon">🛒</div>
            <div class="nav-label">Cart</div>
        </div>
        <div class="nav-item" data-section="orders-section">
            <div class="nav-icon">📋</div>
            <div class="nav-label">Orders</div>
        </div>
        <div class="nav-item" data-section="incentives-section">
            <div class="nav-icon">🎁</div>
            <div class="nav-label">Incentives</div>
        </div>
    </div>

    <script>
        // Navigation functionality
        document.addEventListener('DOMContentLoaded', function() {
            const navItems = document.querySelectorAll('.nav-item');
            const contentSections = document.querySelectorAll('.content-section');
            
            // Show home section by default, hide others
            document.getElementById('home-section').style.display = 'block';
            contentSections.forEach(section => {
                if (section.id !== 'home-section') {
                    section.style.display = 'none';
                }
            });
            
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    // Remove active class from all items
                    navItems.forEach(nav => nav.classList.remove('active'));
                    
                    // Add active class to clicked item
                    this.classList.add('active');
                    
                    // Hide all content sections
                    contentSections.forEach(section => {
                        section.style.display = 'none';
                    });
                    
                    // Show corresponding section
                    const sectionId = this.getAttribute('data-section');
                    document.getElementById(sectionId).style.display = 'block';
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
