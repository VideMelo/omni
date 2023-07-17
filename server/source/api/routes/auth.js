const route = require('express').Router();
const axios = require('axios');

route.get('/api/auth', (req, res) => {
   const code = req.query.code;
   const state = req.query.state;
   if (!code || !state) res.status(400).send('Invalid request!');

   const data = new URLSearchParams({
      client_id: process.env.DISCORD_ID,
      client_secret: process.env.DISCORD_SECRET,
      redirect_uri: process.env.DISCORD_REDIRECT,
      grant_type: 'authorization_code',
      scope: 'identify guilds',
      code,
   });

   axios
      .post('https://discord.com/api/oauth2/token', data)
      .then((response) => {
         res.send(`
            <script>
               window.opener.postMessage(
                  {
                     type: 'auth-success',
                     token: '${response.data.access_token}',
                     refresh: '${response.data.refresh_token}',
                     expires: '${response.data.expires_in}',
                     state: '${req.query.state}',
                  },
                  window.location.origin
               );
               window.close();
               window.location.href = "/";
            </script>
         `);
      })

      .catch((error) => {
         res.send(`
            <script>
               window.opener.postMessage(
                  {
                     type: 'auth-error',
                  },
                  window.location.origin
               );
               window.close();
            </script>
         `);
      });
});

module.exports = route;
