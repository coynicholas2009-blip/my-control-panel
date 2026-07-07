const UPDATE_BITCOIN_WEBHOOK = 'PASTE_YOUR_WEBHOOK_URL_HERE';

async function updateBitcoinPrice() {
    const input = document.getElementById('updatePriceInput').value.trim();
    const resultBox = document.getElementById('updatePriceResult');
    resultBox.style.display = 'block';

    if (!input) {
        resultBox.innerHTML = '<p style="color:red;">Please enter a price before submitting.</p>';
        resultBox.className = 'result-box error';
        return;
    }

    resultBox.innerHTML = 'Sending updated price...';
    resultBox.className = 'result-box';

    try {
        const response = await fetch(UPDATE_BITCOIN_WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatedprice: input })
        });

        if (!response.ok) throw new Error(`Server responded with ${response.status}`);

        resultBox.innerHTML = `<p style="color:green;">✅ Bitcoin price updated to <strong>$${Number(input).toLocaleString()}</strong> successfully!</p>`;
        resultBox.className = 'result-box success';
        document.getElementById('updatePriceInput').value = '';

    } catch (error) {
        resultBox.innerHTML = `<p style="color:red;">❌ Error updating price: ${error.message}</p>`;
        resultBox.className = 'result-box error';
    }
}

async function getBitcoinPrices() {
    const resultBox = document.getElementById('btn1Result');
    resultBox.innerHTML = 'Fetching live Bitcoin prices...';
    resultBox.className = '';

    try {
        const response = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd,eur,gbp,jpy,aud,cad,chf,inr'
        );

        if (!response.ok) throw new Error('Failed to fetch prices');

        const data = await response.json();
        const btc = data.bitcoin;

        const currencies = [
            { code: 'USD', symbol: '$',  flag: '🇺🇸', name: 'US Dollar',       value: btc.usd },
            { code: 'EUR', symbol: '€',  flag: '🇪🇺', name: 'Euro',            value: btc.eur },
            { code: 'GBP', symbol: '£',  flag: '🇬🇧', name: 'British Pound',   value: btc.gbp },
            { code: 'JPY', symbol: '¥',  flag: '🇯🇵', name: 'Japanese Yen',    value: btc.jpy },
            { code: 'AUD', symbol: 'A$', flag: '🇦🇺', name: 'Australian Dollar',value: btc.aud },
            { code: 'CAD', symbol: 'C$', flag: '🇨🇦', name: 'Canadian Dollar',  value: btc.cad },
            { code: 'CHF', symbol: 'Fr', flag: '🇨🇭', name: 'Swiss Franc',      value: btc.chf },
            { code: 'INR', symbol: '₹',  flag: '🇮🇳', name: 'Indian Rupee',     value: btc.inr },
        ];

        const rows = currencies.map(c => `
            <tr>
                <td style="padding: 10px 15px;">${c.flag} ${c.name}</td>
                <td style="padding: 10px 15px; font-weight: bold; color: #2c3e50;">${c.symbol}${c.value.toLocaleString()}</td>
                <td style="padding: 10px 15px; color: #888; font-size: 0.9em;">${c.code}</td>
            </tr>
        `).join('');

        resultBox.innerHTML = `
            <div style="background: linear-gradient(135deg, #f7931a 0%, #f4a623 100%); color: white; padding: 15px 20px; border-radius: 8px 8px 0 0; margin: -15px -15px 0 -15px;">
                <h3 style="margin: 0; color: white;">₿ Live Bitcoin Prices</h3>
                <p style="margin: 5px 0 0 0; font-size: 0.85em; opacity: 0.9;">Last updated: ${new Date().toLocaleTimeString()}</p>
            </div>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                <thead>
                    <tr style="border-bottom: 2px solid #eee;">
                        <th style="padding: 10px 15px; text-align: left; color: #666;">Currency</th>
                        <th style="padding: 10px 15px; text-align: left; color: #666;">Price</th>
                        <th style="padding: 10px 15px; text-align: left; color: #666;">Code</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
        resultBox.className = 'result-box success';

    } catch (error) {
        resultBox.innerHTML = `<p style="color: red;">Error fetching Bitcoin prices: ${error.message}</p>`;
        resultBox.className = 'result-box error';
    }
}
