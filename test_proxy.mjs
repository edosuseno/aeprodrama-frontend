import crypto from "crypto";

async function run() {
    try {
        const res = await fetch('http://localhost:5001/api/idrama2/stream/161001641914/1');
        const data = await res.json();
        console.log("Raw API Proxy response:", data);
    } catch(e) {
        console.log(e);
    }
}
run();
