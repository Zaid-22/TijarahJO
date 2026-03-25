const fs = require('fs');

async function fetchLog() {
    const runId = "23515643055";
    const authHeaders = {
        // No auth for public HTML
    };

    const res = await fetch(`https://github.com/Zaid-22/TijarahJO/commit/4555daf00bd551d7ee3a4dd8c1da2472d82bbbee/checks`);
    const txt = await res.text();
    fs.writeFileSync('checks.html', txt);
    console.log("Saved checks.html");
}

fetchLog();
