async function run() {
    try {
        const res = await fetch('http://localhost:3000/api/idrama2/explore?page=1');
        console.log("Status:", res.status);
        const data = await res.json();
        console.log("Data:", JSON.stringify(data).substring(0, 500));
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
