const http = require('http');

async function testApi() {
    console.log("Testing /api/selfcare for multiple runs...");
    const diagnoses = ["Stress", "Anxiety", "Depression"];

    for (let i = 1; i <= 3; i++) {
        const data = JSON.stringify({ diagnoses });
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/selfcare',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': data.length
            }
        };

        const req = http.request(options, res => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                const activities = JSON.parse(body).suggestions;
                console.log(`Run ${i}: Returned ${activities.length} activities.`);
                activities.forEach(a => console.log(` - ${a.title}`));
                console.log("-------------------");
            });
        });

        req.on('error', error => console.error(`Run ${i} failed:`, error.message));
        req.write(data);
        req.end();
        
        await new Promise(r => setTimeout(r, 1000)); // Delay between runs
    }
}

testApi();
