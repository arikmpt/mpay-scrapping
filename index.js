const axios = require('axios');
const { JSDOM } = require("jsdom");

const url = 'https://1b.3m3-admin.com/transactions/new_instant_transaction/ajax';

const params = {
  _token: 'Dvf5PQWLbsRkPI89HK0xREtMfvI8wguxuZCtvLSE',
  view_name: 'deposit_only',
  record_type: 1,
  'bank_id[]': [
    'Bank / BANK BCA',
    'Bank / BANK BNI',
    'Bank / BANK MANDIRI',
    'E-wallet / DANA'
  ],
  search_name: '',
  period: ''
};

const headers = {
  'accept': '*/*',
  'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest',
  'Cookie': 'XSRF-TOKEN=eyJpdiI6IkIvekludWJ1c1o2YnVnVFQyWEJJTWc9PSIsInZhbHVlIjoiUEpUQ2UwVDBrQ0tSOGZDaFVRc0JDK25MdExkMjlLMTNQYVpRMkFPVExLeFR5bGNObms1U003cktVbUd6ajJWSFB0VWlvKzRPQittb1lFTDk5YVJkK1ZTTUlDbU9xMjMrT2didW1LM3NiZTdxbkZzR1F3eVVGYWlkNWU5L1FqMUYiLCJtYWMiOiIxYjA2Njc3Zjc4ZWQ4YjJjMGRhOTkzOWM3MDQzYTFiZjdlMjQ4NDNjMmYxYTM1MmUwNjY0NGM3YTc5NjVhZWU4In0%3D; __cf_bm=HKZ4vUG97WJKIp8F.nWHK3wLSqTveV1ij5LXlFmE8Io-1740821264-1.0.1.1-.Q1VeL2lC4Pf06.seufHFrqIqpEI82ZgcoFyt_TjR0.blKlYQV0tZCw6xwEyzgcw_uu9FFaOPliSX0WqMnf_R_4_LHsf7bRyQQmY0ynfqp0; 3m3b_session=eyJpdiI6IjJtWmdiUC9meGY4TGtsTkNybmdoWVE9PSIsInZhbHVlIjoiZXk2LzJZV0s1SzNBUUZaKzkwalF1QlpMQTNYcUhrUkFFVGZIdU5DRHJ3NnBmcEdlRnpaSGtvVmJRQTNVY2FVdXh0MVl1azZkeUJxaTIwZ2FCbGZYS1piZzNSamxYUkJVWUNTYzRyaVZWcE9hNW83cGJ1T2RBWDFpNHp0aHZ2eXYiLCJtYWMiOiJjNThmYTRhZjY1MGE0YmU4ZGQ2NmRjZGY2ZWI4NjEwODFkMTM5MjlmYzI3ZjIzMGMwZDAzNmZkOWQ1ZjRlMmFlIn0%3D; XSRF-TOKEN=eyJpdiI6IjRvWURUb0V0MHkxTE16TTFUeVQ5UGc9PSIsInZhbHVlIjoiMnRBOXJJaXVOUkEyc1FaY0xhZmJBcEVBeXRPbWFoZ2xtaEV5aUhqUTB5dmRHcGZMakJ5SnA5dk1kczlvYU1CT3YyTFNGeDFNTG8zR1Z6TllicGpMSkNhaURTQ1JLYm5LckJBVElWNWpmYm4wUG5WNUt0UkNocCtpUGdOR2twNnQiLCJtYWMiOiI4OWQxOGI2NzE0ODNhYjI3NjM4YjljMTI1MzgxNGI2M2I2Y2JkMjZmZmQ0MmM5YmMyMTU4YjRiYTBkMjczNWNmIn0%3D'
};

axios.get(url, { params, headers })
  .then(response => {fetchAndExtractTransactions(response.data)})
  .catch(error => console.error('Error:', error));

  function fetchAndExtractTransactions(htmlString) {
    try {
        // Parse the HTML using JSDOM
        const dom = new JSDOM(htmlString);
        const document = dom.window.document;

        // Select the table and rows
        const table = document.querySelector("table.instant"); // Modify selector if needed
        if (!table) {
            console.error("Table not found in response");
            return;
        }

        const rows = table.querySelectorAll("tbody tr");
        let transactions = [];

        rows.forEach(row => {
            const cols = row.querySelectorAll("td");
            const transaction = {
                transactionDate: cols[1].textContent.trim().split("\n")[0],
                transactionId: cols[2].querySelector("span")?.textContent.trim() || "",
                accountName: cols[3].childNodes[0].textContent.trim(),
                accountNumber: cols[3].querySelector('.text-primary').textContent.trim(),
                username: cols[4].querySelector("span")?.textContent.trim() || "",
                refNo: cols[5].textContent.trim() || "",
                fundMethod: cols[6].textContent.trim(),
                status: cols[8].textContent.trim(),
                debit: cols[10].textContent.trim(),
                credit: cols[11].textContent.trim(),
            };
            console.log(transaction)
        });

        console.log(transactions);
        return transactions;

    } catch (error) {
        console.error("Error fetching or parsing HTML:", error);
    }
}