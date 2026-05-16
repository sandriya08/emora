const API_URL = 'http://localhost:5000/api/therapist/match';

async function testMatch() {
    console.log("Testing matching with multi-diagnosis labels...");
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                features: [1, 1, 1, 0, 1, 0.9, 0.9, 0.8], // Vector for Anxiety, Depression, etc.
                labels: ["Anxiety", "Burnout"]
            })
        });

        const data = await response.json();
        console.log("Top matches:");
        data.forEach((t, i) => {
            console.log(`${i+1}. ${t.name} - ${t.type}`);
            console.log(`   Specialization: ${t.specialization.join(', ')}`);
            console.log(`   Certificates: ${t.certificates ? t.certificates.join(', ') : 'None'}`);
            console.log(`   Is Specialist: ${t.isSpecialist}`);
        });

    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

testMatch();
