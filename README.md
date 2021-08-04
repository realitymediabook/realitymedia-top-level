# realitymedia-top-level

This is the setup we're using for a node server to be used in conjunction with Hubs.  This one is set up to run on a small Ubuntu EC2 instance on realitymedia.digital, with Hubs installed at xr.realitymedia.digital.

To test locally, run

```
npm install
node index.js
```

You'll see in the code that it either runs an HTTP or HTTPS server, depending on if the certificates can be found. Our production server uses HTTPS, with certs created by the LetsEncrypt certbot.  When you run locally, it should create an HTTP server.

To create your own AWS setup, must set up Nginx and LetsEncrypt.  The Nginx-config copied to whatever file you're using, for us it's /etc/nginx/sites-available/realitymedia

See the blog post at https://blairmacintyre.me/2020/10/17/setting-up-a-node-server-on-aws/ for an overview of how this was set up.

# SSO Auth system

1. First, the hubs instance requests the SSO bundle at `/sso/bundle.js` and loads the JS

2. The hubs SSO bundle creates an iframe and loads the `/sso/index.html` page

3. The hubs SSO bundle listens for login events in Hubs

4. The hubs SSO bundle sends the token to server, creating a new account if needed. The token is also sent to the iframe so it can be used in the Realitymedia site.
   
5. The script in the iframe saved the token to local storage so it can be used by the Realitymedia site.

6. The backend uses the token to create rooms. A list of rooms for the user can be loaded via API call.


# Required environment variables
These should be set on the server or development machine.

1. "DB_FILE": "./path/to/db.sqlite",
2. "ALLOWED_DOMAIN":"*", // iframe origin
3. "ENABLE_SSO":"1", // to serve the SSO endpoint
4. "NODE_ENV": // shows debugging data if set to "development"