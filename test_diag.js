const axios = require('axios');

const API_URL = 'http://localhost:5000';
const USER_ID = '67dfe49f6580cb4a02808064'; // Assuming this is the current user ID based on previous context

async function test() {
    try {
        console.log("Fetching all diagnoses...");
        const resHistory = await axios.get(`${API_URL}/api/selfcare/diagnosis?userId=${USER_ID}`);
        console.log("History Count:", resHistory.data.length);
        if (resHistory.data.length > 0) {
            const first = resHistory.data[0];
            console.log("First Diagnosis Sample:", JSON.stringify(first, null, 2));
            
            console.log("Fetching specific diagnosis by ID:", first._id);
            const resSingle = await axios.get(`${API_URL}/api/selfcare/diagnosis/${first._id}`);
            console.log("Single Result Sample:", JSON.stringify(resSingle.data, null, 2));
        } else {
            console.log("No history found for user", USER_ID);
        }
    } catch (err) {
        console.error("Test failed:", err.message);
        if (err.response) {
            console.error("Response data:", err.response.data);
        }
    }
}

test();
