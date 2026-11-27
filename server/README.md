# Benji's Kitchen sync server

The shared kitchen feature needs a tiny server that stores each household's locked (encrypted) kitchen.
It runs free on Cloudflare: a Worker (the code in `sync-worker.js`) and a D1 database.
The server never sees kitchen codes or food. Phones lock everything with the code before sending it.

## Set it up (about 10 minutes, in the Cloudflare dashboard)

### 1. Make the database
1. Sign in at https://dash.cloudflare.com
2. In the left menu, open **Storage & databases**, then **D1 SQL database**.
3. Click **Create database**. Name it `pantrypal-sync` and create it.
4. Open the new database and go to its **Console** tab.
5. Paste everything from `schema.sql` into the box and click **Execute**.

### 2. Make the Worker
1. In the left menu, open **Compute (Workers)**, then **Workers & Pages**.
2. Click **Create**, choose **Start with Hello World**, name it `pantrypal-sync`, and click **Deploy**.
3. Click **Edit code**. Delete everything in the editor, paste in all of `sync-worker.js`, and click **Deploy**.

### 3. Connect the Worker to the database
1. Open the `pantrypal-sync` Worker and go to **Settings**, then **Bindings**.
2. Click **Add binding**, choose **D1 database**.
3. Variable name: `DB` (capital letters). Database: `pantrypal-sync`. Click **Add binding** (or Save), and deploy if it asks.

### 4. Check it
1. On the Worker's page, copy its address. It looks like `https://pantrypal-sync.YOURNAME.workers.dev`
2. Open that address with `/health` on the end. You should see `{"ok":true}`.
3. Send the address to Claude. It goes into `SYNC_URL` in `js/core/config.js`, and shared kitchens switch on in the app.

## Limits on the free plan
Workers allow 100,000 requests a day. Each open phone syncs about once every 45 seconds while the app is on screen,
plus once after each change, so the free plan covers many households. Kitchens nobody opens for 180 days are deleted.

## Testing on a computer
`node server/fake-d1-server.mjs 8790` runs the same Worker with a pretend database in memory.
