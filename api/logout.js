module.exports = async (req, res) => {
  // Clear the session cookie
  res.setHeader('Set-Cookie', 'session=; Path=/; HttpOnly; SameSite=Strict; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  
  // Redirect to login page
  return res.redirect(302, '/?message=' + encodeURIComponent('You have been logged out') + '&type=success');
};
