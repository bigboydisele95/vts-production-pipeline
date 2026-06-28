const http = require('http');
const querystring = require('querystring');
const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, 'database.json');

const VTS_LOGO_DATA_URI = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAADGElEQVR4nO3dy2oTQRyG4e9pY6wWvIBeWES8ghAEXolX4Nl4B56Nt+DZ7D8KogTfCqIo3glCEXwBvYCXEAovIIKWFpW0SdPZTCeZ7Dczv/n9S7mI6Wxm5m8zm5llZmZVVfX4EwGSpI53YgBJKXoEAEktSgsAM8sMwMyyMwAyS56YASQlzxMzACT5EzMAJPkTMwAkS54nZgBI8idmAEjSJ2YASKXoEwBIStEnAJCUok8AICXof08AMsvMT6ZzX5nOfWU699XF6XgAklL0CQCkovRJACSl6EsASKUofwYASTfK+6T8AJK6fXU6/bU8AElSjv75E0CKfvkXQIp++RdAkn75C0CKe6Y/A0DSDX9ZAEgl/rYAkEr8NQEglXhUAEAqMVYAIJUYIwCQSkwVAEgldhQAUombBQAUYvUfAEAhvlsAQCF2HQAhwvo/AICEjAsASEh4fQBmZpntf0dmZmb7Y/3zAL6v8p/vX5mvevT//pZAnpS6f36Y2b8//gWQfEn9pLp/fvhbAnE+X+e/P18XmZltf5zPHwHkT76X9pPv9v+XAHw+nOfHeU95X7kvHwEwD88D4zwxz5HzeQRgrt0P59Z56Xw7AnD23U/nzz6fD4E+27D//I52n62E35OAn2HYf/8L4vckwPeE/I75XfN64u9NoM2vK/lZ4bOfp4E5m/m+m85458/V8ACcOfvO/vNbeo4eB4SdfZOfI/b5E/C5O7wL+D0pP9999jX0CUCf97Sfj7SfN34F0Od7pM9j4NdfA5/fM55N/V/b1H6u7Z/vF4CH3+B98fW837U8AvC0h//488A83H0F0NdX53sVAnXpG5nF+mP9/CugL/6p9fE/pX8A4Onb1//01bVPPXmPff1T+mOfAPz3n/f7T/o4b50/A3/6Wp+X+zCfp/vxCMD9+w3+z8c4Hw+fD4Y5H/7jX8KftnE8Osb5/G9O/v2f4vI/D44HxwPwZ6A8f/4b8Kdzj3M/vB46f90XwF8D/NlM/+8P6/55n7//vS72OfsL4H+/mS/m++p8fM4A+L5y4v8//8t39f99/pX47H7f9w4LgHhM/z8vX4m//wAAAABJRU5ErkJggg==';

const USERS = {
    "intake": { password: "123", role: "intake", name: "Front Desk (PC 1)" },
    "designer": { password: "456", role: "designer", name: "Design Studio (PC 2)" },
    "manager": { password: "789", role: "manager", name: "Manager Office (PC 3)" },
    "printer": { password: "000", role: "printer", name: "Print Station (PC 4)" }
};

let orders = [];
let activeSessions = {};
const CUSTOMER_ORIGINS = ["Walk-In Customer", "Email Submission", "Telephone / WhatsApp Order", "Internal Project"];

function calculateVtsPrice(service, qty, subType) {
    const q = parseInt(qty) || 0;
    if (q <= 0) return 0;
    switch (service) {
        case "Printout B/W":
            if (q >= 1 && q <= 9) return q * 5;
            if (q >= 10 && q <= 19) return q * 4;
            if (q >= 20) return q * 3;
            return 0;
        case "Copies B/W": return q * 2;
        case "Printout Colour": return q * 10;
        case "Copy Colour": return q * 5;
        case "Lamination": return subType === "A3" ? q * 30 : q * 20;
        case "ID Photos":
            if (q === 1) return 30;
            if (q === 2) return 40;
            if (q === 4) return 60;
            return q * 15;
        case "Scan to Email / WhatsApp": return (q * 5) + 10;
        default: return 0; 
    }
}

function loadData() {
    try { if (fs.existsSync(DB_FILE)) orders = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch (err) { orders = []; }
}
function saveData() {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(orders, null, 2), 'utf8'); } catch (err) {}
}
loadData();

const HTML_HEAD = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VTS Terminal</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
        body { background-color: #f3f4f6; color: #1f2937; padding-bottom: 40px; }
        header { background: white; border-bottom: 1px solid #e5e7eb; padding: 15px; position: sticky; top: 0; z-index: 100; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
        .logo-area { display: flex; align-items: center; gap: 10px; }
        .logo-img { height: 38px; width: 38px; background: #111827; padding: 2px; border-radius: 6px; }
        .logo-title { font-size: 17px; font-weight: 700; letter-spacing: -0.5px; }
        .logo-sub { font-size: 9px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .badge { background: #f3f4f6; border: 1px solid #e5e7eb; padding: 6px 12px; border-radius: 20px; font-size: 12px; display: flex; align-items: center; gap: 6px; }
        .dot { width: 8px; height: 8px; background: #10b981; border-radius: 50%; }
        main { max-w: 1200px; margin: 0 auto; padding: 20px; }
        .login-box { background: white; padding: 30px; border-radius: 12px; border: 1px solid #e5e7eb; width: 100%; max-width: 400px; margin: 100px auto; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .form-group { margin-bottom: 15px; }
        .form-group label { display: block; font-size: 11px; font-weight: 600; uppercase; color: #4b5563; margin-bottom: 5px; letter-spacing: 0.5px; }
        .form-control { w-index: 10; width: 100%; padding: 10px; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 8px; font-size: 14px; }
        .form-control:focus { background: white; outline: 2px solid #3b82f6; }
        .btn-block { width: 100%; background: #111827; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 500; cursor: pointer; transition: 0.2s; }
        .btn-block:hover { background: #1f2937; }
        .pipeline-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px; }
        .column { background: #eaeded; padding: 15px; border-radius: 16px; border: 1px solid #d1d5db; min-height: 400px; }
        .col-title { font-size: 14px; font-weight: 700; margin-bottom: 15px; display: flex; align-items: center; gap: 8px; color: #111827; }
        .col-count { font-size: 11px; background: white; padding: 2px 8px; border-radius: 20px; border: 1px solid #d1d5db; }
        .card { background: white; padding: 15px; border-radius: 12px; border: 1px solid #e5e7eb; box-shadow: 0 1px 3px rgba(0,0,0,0.05); margin-bottom: 12px; position: relative; }
        .card-header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px; }
        .card-id { font-size: 11px; font-weight: 700; color: #9ca3af; }
        .card-name { font-size: 15px; font-weight: 600; color: #111827; margin-top: 2px; }
        .priority-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 10px; }
        .priority-High { background: #fee2e2; color: #b91c1c; border: 1px solid #fca5a5; }
        .priority-Medium { background: #f3f4f6; color: #374151; }
        .priority-Low { background: #f3f4f6; color: #9ca3af; }
        .card-details { background: #f9fafb; border: 1px solid #f3f4f6; padding: 10px; border-radius: 8px; font-size: 12px; color: #4b5563; margin-bottom: 10px; line-height: 1.5; }
        .price-tag { font-size: 15px; font-weight: 700; color: #111827; }
        .action-form { border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 10px; }
        .btn-action { width: 100%; background: #2563eb; color: white; border: none; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-action:hover { background: #1d4ed8; }
        .btn-flex { display: flex; gap: 8px; }
        .btn-rej { background: #f3f4f6; color: #374151; border: 1px solid #d1d5db; width: 50%; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-appr { background: #111827; color: white; border: none; width: 50%; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .btn-done { background: #16a34a; color: white; border: none; width: 100%; padding: 8px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; }
        .note-box { background: #fffbeb; border: 1px solid #fef3c7; color: #92400e; font-size: 12px; padding: 8px; border-radius: 8px; margin-bottom: 10px; }
        .link-btn { color: #2563eb; text-decoration: none; font-size: 12px; font-weight: 500; display: inline-block; margin-bottom: 8px; }
        .link-btn:hover { text-decoration: underline; }
        .intake-box { background: white; padding: 20px; border-radius: 12px; border: 1px solid #e5e7eb; max-width: 600px; margin: 0 auto 30px auto; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .intake-title { font-size: 16px; font-weight: 700; margin-bottom: 15px; }
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .span-2 { grid-column: span 2; }
    </style>
</head>
`;

const server = http.createServer((req, res) => {
    let cookieHeader = req.headers.cookie || '';
    let match = cookieHeader.match(/session_id=([^;]+)/);
    let sessionId = match ? match[1] : null;
    let currentUser = activeSessions[sessionId];

    if (req.url === '/login' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        return res.end(`
            ${HTML_HEAD}
            <body>
                <div class="login-box">
                    <div class="logo-area" style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                        <img src="${VTS_LOGO_DATA_URI}" alt="Logo" class="logo-img">
                        <div>
                            <h2 class="logo-title">Veros Typing Services</h2>
                            <p class="logo-sub">Production Sign-In</p>
                        </div>
                    </div>
                    <form action="/login" method="POST">
                        <div class="form-group">
                            <label>Station ID</label>
                            <input type="text" name="username" placeholder="intake, designer, manager..." required class="form-control">
                        </div>
                        <div class="form-group">
                            <label>Access Key</label>
                            <input type="password" name="password" placeholder="••••••••" required class="form-control">
                        </div>
                        <button type="submit" class="btn-block">Sign In to Dashboard</button>
                    </form>
                </div>
            </body></html>`);
    }

    if (req.url === '/login' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            let data = querystring.parse(body);
            let user = data.username ? USERS[data.username.toLowerCase()] : null;
            if (user && user.password === data.password) {
                let newId = Date.now().toString();
                activeSessions[newId] = user;
                res.writeHead(302, { 'Set-Cookie': 'session_id=' + newId + '; Path=/', 'Location': '/' });
                res.end();
            } else {
                res.writeHead(302, { 'Location': '/login' });
                res.end();
            }
        });
        return;
    }

    if (!currentUser) {
        res.writeHead(302, { 'Location': '/login' });
        return res.end();
    }

    if (req.url.split('?')[0] === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        
        const generateCards = (status, canActAction) => {
            return orders.filter(o => o.status === status).map(o => {
                const priceDisplay = o.calculatedPrice && o.calculatedPrice > 0 ? `R${o.calculatedPrice}` : 'N/A';
                return `
                <div class="card">
                    <div class="card-header">
                        <div>
                            <span class="card-id">#${o.jobCardId || 'No ID'}</span>
                            <h4 class="card-name">${o.clientName}</h4>
                        </div>
                        <span class="priority-badge priority-${o.priority}">${o.priority}</span>
                    </div>
                    
                    <div class="card-details">
                        <p><strong>🛠️ Service:</strong> ${o.serviceType} ${o.laminationSize ? `(${o.laminationSize})` : ''}</p>
                        <p><strong>📦 Qty:</strong> ${o.quantity || '1'}</p>
                        <p><strong>💵 Price:</strong> <span class="price-tag">${priceDisplay}</span></p>
                        <p style="margin-top: 4px;"><strong>📝 Spec:</strong> ${o.specifications}</p>
                    </div>

                    ${o.driveLink ? `<a href="${o.driveLink}" target="_blank" class="link-btn">🔗 View Files ↗</a>` : ''}
                    ${o.feedback ? `<div class="note-box">⚠️ <strong>Note:</strong> ${o.feedback}</div>` : ''}
                    ${canActAction ? canActAction(o) : ''}
                </div>`;
            }).join('');
        };

        const designerActions = (o) => `
            <form action="/submit-design?id=${o.id}" method="POST" class="action-form"><input type="url" name="driveLink" required placeholder="Paste proof link..." class="form-control" style="font-size:11px; margin-bottom:6px;"><button class="btn-action">📤 Submit Proof</button></form>`;

        const managerActions = (o) => `
            <form action="/review?id=${o.id}" method="POST" class="action-form"><input type="text" name="feedback" placeholder="Revision notes..." class="form-control" style="font-size:11px; margin-bottom:6px;"><div class="btn-flex"><button name="action" value="reject" class="btn-rej">❌ Reject</button><button name="action" value="approve" class="btn-appr">✅ Approve</button></div></form>`;

        const printerActions = (o) => `
            <form action="/complete?id=${o.id}" method="POST" class="action-form"><button class="btn-done">🏁 Complete Order</button></form>`;

        let designCards = generateCards('In Design', currentUser.role === 'designer' ? designerActions : null);
        let approvalCards = generateCards('Awaiting Approval', currentUser.role === 'manager' ? managerActions : null);
        let printCards = generateCards('In Printing', currentUser.role === 'printer' ? printerActions : null);

        let intakeForm = currentUser.role === 'intake' ? `
        <section class="intake-box">
            <h2 class="intake-title">📥 Log New Production Order</h2>
            <form action="/create" method="POST" class="grid-2">
                <div class="span-2">
                    <label>Client Name</label>
                    <input type="text" name="clientName" required class="form-control">
                </div>
                <div>
                    <label>📋 Job Card ID</label>
                    <input type="text" name="jobCardId" placeholder="VTS-1050" class="form-control">
                </div>
                <div>
                    <label>📦 Qty / Pages</label>
                    <input type="number" name="quantity" required class="form-control">
                </div>
                <div class="span-2">
                    <label>🛠️ Service Needed</label>
                    <select id="serviceSel" name="serviceType" required class="form-control" onchange="toggleLamination()">
                        <option value="">Choose service...</option>
                        <option value="Printout B/W">Printout B/W (Tier Pricing)</option>
                        <option value="Copies B/W">Copies B/W (R2/page)</option>
                        <option value="Printout Colour">Printout Colour (R10/page)</option>
                        <option value="Copy Colour">Copy Colour (R5/page)</option>
                        <option value="Lamination">Lamination (A4/A3)</option>
                        <option value="ID Photos">ID Photos (1=R30, 2=R40, 4=R60)</option>
                        <option value="Scan to Email / WhatsApp">Scan to Email / WhatsApp (R5/page + R10 fee)</option>
                        <option value="Academic Typing">Academic Typing</option>
                        <option value="CV/Resume Compiling">CV/Resume Compiling</option>
                    </select>
                </div>
                <div id="laminationBox" class="span-2" style="display:none;">
                    <label>📐 Lamination Size</label>
                    <select name="laminationSize" class="form-control">
                        <option value="A4">A4 Size (R20)</option>
                        <option value="A3">A3 Size (R30)</option>
                    </select>
                </div>
                <div class="span-2">
                    <label>📝 Specifications & Details</label>
                    <textarea name="specifications" rows="2" required class="form-control"></textarea>
                </div>
                <div>
                    <label>⚠️ Priority Level</label>
                    <select name="priority" class="form-control"><option value="Low">Low</option><option value="Medium" selected>Medium</option><option value="High">High</option></select>
                </div>
                <div>
                    <label>📍 Intake Source</label>
                    <select name="origin" class="form-control"><option value="">Choose origin...</option>${CUSTOMER_ORIGINS.map(o => `<option value="${o}">${o}</option>`).join('')}</select>
                </div>
                <button type="submit" class="btn-block span-2" style="margin-top:10px;">⚡ Inject into Pipeline</button>
            </form>
        </section>
        <script>
            function toggleLamination() {
                var s = document.getElementById('serviceSel').value;
                document.getElementById('laminationBox').style.display = (s === 'Lamination') ? 'block' : 'none';
            }
        </script>` : '';

        let finalHtml = `
            ${HTML_HEAD}
            <body>
                <header>
                    <div class="logo-area">
                        <img src="${VTS_LOGO_DATA_URI}" alt="Logo" class="logo-img">
                        <div>
                            <h1 class="logo-title">Veros Typing Services</h1>
                            <p class="logo-sub">Workflow Engine</p>
                        </div>
                    </div>
                    <div class="badge">
                        <div class="dot"></div>
                        <span id="header_username"></span>
                        <span id="header_rolename" style="color:#6b7280; font-weight:bold;"></span>
                    </div>
                </header>
                <main>
                    ${intakeForm}
                    <div class="pipeline-grid">
                        <div class="column"><h3 class="col-title">🎨 1. In Design <span class="col-count" id="c1_count"></span></h3>${designCards}</div>
                        <div class="column"><h3 class="col-title">🕵️‍♂️ 2. Awaiting Approval <span class="col-count" id="c2_count"></span></h3>${approvalCards}</div>
                        <div class="column"><h3 class="col-title">🖨️ 3. In Printing <span class="col-count" id="c3_count"></span></h3>${printCards}</div>
                    </div>
                </main>
                <script>
                    document.getElementById('header_username').innerText = "${currentUser.name}"; 
                    document.getElementById('header_rolename').innerText = "${currentUser.role.toUpperCase()}";
                    document.getElementById('c1_count').innerText = "${orders.filter(o => o.status === 'In Design').length}";
                    document.getElementById('c2_count').innerText = "${orders.filter(o => o.status === 'Awaiting Approval').length}";
                    document.getElementById('c3_count').innerText = "${orders.filter(o => o.status === 'In Printing').length}";
                </script>
            </body></html>`;

        return res.end(finalHtml);
    }

    if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            let data = querystring.parse(body);
            let rawUrl = req.url;
            let id = null;
            if (rawUrl.indexOf('?id=') !== -1) { id = rawUrl.split('?id=')[1]; }

            if (rawUrl.indexOf('/create') === 0 && currentUser.role === 'intake') {
                const finalPrice = calculateVtsPrice(data.serviceType, data.quantity, data.laminationSize);
                orders.push({ id: Date.now().toString(), clientName: data.clientName, jobCardId: data.jobCardId, quantity: data.quantity, specifications: data.specifications, serviceType: data.serviceType, laminationSize: data.serviceType === 'Lamination' ? data.laminationSize : null, calculatedPrice: finalPrice, origin: data.origin, priority: data.priority, status: 'In Design', driveLink: '', feedback: null, timestamp: new Date().toLocaleString() });
                saveData();
            } else if (rawUrl.indexOf('/submit-design') === 0 && currentUser.role === 'designer') {
                let order = orders.find(o => o.id === id);
                if (order) { order.driveLink = data.driveLink; order.status = 'Awaiting Approval'; saveData(); }
            } else if (rawUrl.indexOf('/review') === 0 && currentUser.role === 'manager') {
                let order = orders.find(o => o.id === id);
                if (order) {
                    if (data.action === 'approve') { order.status = 'In Printing'; order.feedback = null; }
                    else { order.status = 'In Design'; order.feedback = data.feedback; }
                    saveData();
                }
            } else if (rawUrl.indexOf('/complete') === 0 && currentUser.role === 'printer') {
                orders = orders.filter(o => o.id !== id);
                saveData();
            }
            res.writeHead(302, { 'Location': '/' });
            res.end();
        });
    }
});

server.listen(3000, '0.0.0.0', () => console.log('VTS Engine running locally on port 3000'));