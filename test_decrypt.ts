import { decryptData } from "./src/lib/crypto.ts";

async function test() {
    const res = await fetch("http://localhost:3000/api/goodshort/detail?id=31001445624");
    const json = await res.json();
    console.log("Encrypted:", json);
    if (json.data && typeof json.data === "string") {
        const decrypted = decryptData(json.data);
        console.log("Decrypted:", decrypted);
    }
}
test();
