import CryptoJS from 'crypto-js';

// Dari backend: BaseProvider.encrypt
// const key = CryptoJS.enc.Utf8.parse('AEP1029384756XYZ'); // Contoh dari file lain

async function run() {
    try {
        const res = await fetch('http://localhost:3000/api/idrama2/explore?page=1');
        const json = await res.json();
        
        // Coba decrypt pakai key default (Sansekai/StardustTV biasanya pakai ini)
        const secretKey = 'AEP1029384756XYZ';
        const key = CryptoJS.enc.Utf8.parse(secretKey);
        const iv = CryptoJS.enc.Utf8.parse(secretKey);
        
        const decrypted = CryptoJS.AES.decrypt(json.data, key, {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7
        });
        const decryptedStr = decrypted.toString(CryptoJS.enc.Utf8);
        console.log("Decrypted (first 200 chars):", decryptedStr.substring(0, 200));
        
        const data = JSON.parse(decryptedStr);
        console.log("Parsed Array Length:", data.length);
        console.log("First item:", data[0]);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
run();
