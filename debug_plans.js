
async function testPlans() {
    try {
        console.log("Fetching plans...");
        const response = await fetch('http://localhost:4000/api/v1/plans');

        console.log("Status:", response.status);
        const data = await response.json();
        console.log("Response:", JSON.stringify(data, null, 2));

    } catch (error) {
        console.error("Error:", error);
    }
}

testPlans();
