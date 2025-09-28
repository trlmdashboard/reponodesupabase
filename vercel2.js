{
    "version": 2,
    "builds": [
        {
            "src": "api/auth.js",
            "use": "@vercel/node"
        },
        {
            "src": "*.html",
            "use": "@vercel/static"
        }
    ],
    "routes": [
        {
            "src": "/api/(.*)",
            "dest": "/api/auth.js"
        },
        {
            "src": "/(.*)",
            "dest": "/$1"
        }
    ]
}
