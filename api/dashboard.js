module.exports = async (req, res) => {
  // Set HTML content type
  res.setHeader('Content-Type', 'text/html');
  
  // Get message from query parameters
  const urlParams = new URLSearchParams(req.url.split('?')[1]);
  const message = urlParams.get('message');
  const type = urlParams.get('type');

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
        }
        .logout-btn:hover {
            background-color: #c82333;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>Dashboard</h1>
        ${message ? `<div class="message ${type}">${decodeURIComponent(message)}</div>` : ''}
        <p>You have successfully logged in!</p>
        <a href="/" class="logout-btn">Logout</a>
    </div>
</body>
</html>
  `;

  res.end(html);
};
