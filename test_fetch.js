const fetch = require('node-fetch');
const fs = require('fs');

async function test() {
  try {
    const res = await fetch("http://localhost:3000/api/proxy?url=https%3A%2F%2Fapi.meloshort.com%2Fv1%2Fplay%2F680b4b25a47366643e6cb695%2Fv.m3u8%3Fauth_key%3D540p3590837f583141279e70e47c6dd7fb68");
    const text = await res.text();
    fs.writeFileSync('m3u8_test.txt', text);
    console.log("Written to m3u8_test.txt. First 100 chars: ", text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
