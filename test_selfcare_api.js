async function testApi() {
  const url = "http://localhost:5000/api/selfcare";
  const body = {
    diagnoses: ["Stress", "Anxiety", "Emotional Exhaustion"]
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testApi();
