const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

// Your green shield logo embedded as base64 string
const VTS_LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFfElEQVR4nO3dfYjVdRzH8c+dtmXmZg6bZf5IM9IsI7IsI/8wS0uFsKAsIsKCoIggIiKCiIiIiIiIiIiIiIiIiICAuCioKCoKCgXpS9mDPX9uN8O6f7uN0unWff73fP6wXvF87dzm2f/b7v95zX7zO7u7vDQLbMGRwYvGNoYHBg8I6hgYF7hwYGBrePDR7ZPnZk+9gXo6O3v76w+vW9o6u3v36v9rO5XGf3WOfscofqYwNHzq73N76+NDbWWDp6++ujg4+8PnT0D6+PfjF6dPvYF0e3j30x9sXos7HOnrHZ3U73bO7p7nbn7e4Y7OzsGOzs7Ozo7OzsaHV0dHS2OjraWh0dbXUdHe3V0dFeVxodHdVVG0fGWh0da3UdGW11dKxV7R8Za6/3j9T7R+r9I+M666fO7R+Z3T8yvX9kpK7V0f6Rkf6Rkf6Rkf6RkYfG9o88NDZfGZuv9fO1Prc6Nlfr26zO7VvV9Vb3e6vq3vH8wGjuYGZudmZudmZudmZudmZudmZudqbO1NnZmdqZOjtbO3N35ubOzM2dfZ/Ozp29Z7/WvT/rzp+Zuz8zd3/mnun+8890dfZf+uXmB166+e0PXPXW9as/ePULb3780S2PHX9s29Mfuf70p9ccv+YTa0ZXP7HmhNXHPrnmxAnfX3PihG99f83xl7/+fefuOnfv7jp37648fvXpL6w5/fWvfev017+W862u8/6Xurv7Xu6uOfv97vzz3zrz9ffmvO57p645N+d1XWe867S669S8a85e88Zrr3v9+9e/ffqN8e/+4bXvXf/Gax8f+/b1b79+9Udj33nXf9Kfff61f68/+6e6+L3rn+6+e+p7r9Xp776m7976nr6f/un38k/vX11//vXf3X999b2Xp64++uXvX95574unLj66r85+t85ev2O6ev2Offf6j/7T8d9b//Y/ffv697/x9vVvXH/v+nevv3u6ct/Vpfv2deXf7T8/7L8f/8p/evS///D9/OqPrq8v3X/1X/dfPfBvV9cPrN8xsH5gw46BDTsnNu6Y+HLjVxt3vH7N9m9e/3rj9tef3P7p9p0TX36wfeK7P25/dfuunTfXf7p9V/09b9f9M9/dM99dc898d809P2n1E8fXPHF8zY6vPv61HTfvuLnu9ZvrXr+5vn/m/Mv1T3979p8/e/bLP5vds+fGupVbX67fOPXwzE/vfeqfW+vMvz9828Ofv+O2L/6446Gvbnvka3f9edddf931l1139p6b6zv6rs8/88A9//T5e36sz999Q/33pfeOfv6fHvvshz87+OUPp39w9XU/nO6fPv9wfV3/4Q9vXz+w/Z9uX9+16/r6S/dcPnXx0X11/Z4rq1eeWv3Sby9dXLX68A9XPXr/w0fevPrvA//6eZp8/U+PfuM/Xfv0B7XvP/DBwG0fXLPn9mvu+fCWB75691fvvPeuB796YF/3gX3d9fN7u+tXPLe3fvXhPfWfXnhm9Uv1M6svv3z0pcePvnTsqWOPHXv86InHjx596X8u986f9v9V/N33U2feN//LwN99R61Pnb9T61Pn09mXN/Pfv58+f8f/6fNfP9w7+6Z35t7X2Xdf/5+9330+0z99ftbZ9zf+1/t/fO7/mfn9398/95v7L357v/f/FfP2vU/3/uX+c8fufv+PZ/7T7U8fe/uT95z+9D39058888lzx56+eeyp98zO/B+L5t0S/jL4EwAAAAA6f1FpD3bUf/+Guh890fXb/tO3Xf/BwL8Z2LDjZkAbBwYHBgcGt/9mDwy+fvM3vX7z6K7XR8b6uT0jo7N7RrePjh3dfvy+99y+6y2P3fNf/fP9D6//Ydf+9gAAAABJRU5ErkJggg==';

const USERS = {
    "intake": { password: "123", role: "intake", name: "Front Desk" },
    "designer": { password: "456", role: "designer", name: "Design Studio" },
    "manager": { password: "789", role: "manager", name: "Manager Office" },
    "printer": { password: "000", role: "printer", name: "Print Station" }
};

let orders = [];
let activeSessions = {};

function loadData() {
    try { if (fs.existsSync(DB_FILE)) orders = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (err) { orders = []; }
}
function saveData() {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8'); } catch (err) {}
}
loadData();

const server = http.createServer((req, res) => {
    let cookieHeader = req.headers.cookie || '';
    let match = cookieHeader.match(/session_id=([^;]+)/);
    let sessionId = match ? match[1] : null;
    let currentUser = activeSessions[sessionId];

    // CSS and HTML Template (All-in-one)
    const renderPage = (bodyContent, title = "VTS Workflow") => `
    <!DOCTYPE html>
    <html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
        .box { background: white; padding: 20px; border-radius: 8px; max-width: 500px; margin: 50px auto; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .btn { display: block; width: 100%; padding: 10px; background: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
        input, select, textarea { width: 100%; padding: 8px; margin: 5px 0 15px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    </style></head><body>${bodyContent}</body></html>`;

    if (req.url === '/login' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(renderPage(`
            <div class="box">
                <img src="${VTS_LOGO_DATA_URI}" style="width:50px; display:block; margin: 0 auto;">
                <h2 style="text-align:center;">VTS Sign-In</h2>
                <form action="/login" method="POST">
                    <label>Station</label><input type="text" name="username" required>
                    <label>Key</label><input type="password" name="password" required>
                    <button class="btn">Sign In</button>
                </form>
            </div>`));
    }

    if (req.url === '/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            let data = querystring.parse(body);
            let user = USERS[data.username.toLowerCase()];
            if (user && user.password === data.password) {
                let newId = Date.now().toString();
                activeSessions[newId] = user;
                res.writeHead(302, { 'Set-Cookie': 'session_id=' + newId + '; Path=/', 'Location': '/' });
                res.end();
            } else { res.writeHead(302, { 'Location': '/login' }); res.end(); }
        });
        return;
    }

    if (!currentUser) { res.writeHead(302, { 'Location': '/login' }); return res.end(); }

    if (req.url === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        let html = `<h1>Welcome, ${currentUser.name}</h1>
        <div style="display:flex; gap:20px;">
            <div><h3>Orders</h3>${orders.map(o => `<div style="border:1px solid #ccc; padding:10px; margin-bottom:10px;"><b>${o.clientName}</b> - ${o.status}</div>`).join('')}</div>
        </div>`;
        return res.end(renderPage(html));
    }
});

server.listen(3000, '0.0.0.0', () => console.log('VTS Engine running on port 3000'));