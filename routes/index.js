require('dotenv').config();
var express = require('express');
var router = express.Router();

const axios = require('axios');
const { JSDOM } = require("jsdom");
const db = require('../models');
const { Op } = require('sequelize');
const fuzzy = require('fuzzy');
const { createObjectCsvWriter } = require('csv-writer');

async function fetchAndExtractTransactions(htmlString) {
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

      rows.forEach(async row => {
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
          transactions.push(transaction)
          const exists = await db.Transaction.findOne({ where: { transactionId: transaction.transactionId } });
          if(!exists) {
            await db.Transaction.create({
              transactionDate: transaction.transactionDate,
              transactionId: transaction.transactionId,
              accountName: transaction.accountName.split(' / ')[0],
              accountNumber: transaction.accountNumber,
              username: transaction.username,
              refNo: transaction.refNo,
              fundMethod: transaction.fundMethod.split(' / ')[1],
              credit: transaction.credit.replace(/,/g, '').replace('.00', ''),
              status: transaction.status,
            });
          }
          
      });

      console.log(transactions);
      return transactions

  } catch (error) {
      console.error("Error fetching or parsing HTML:", error);
  }
}

function fuzzySearchWithThreshold(data, searchQuery, threshold = 88) {
  const accountNames = data.map(item => item.accountName);
  const result = fuzzy.filter(searchQuery, accountNames);

  return result
      .filter(match => match.score >= threshold) // Filter matches with score above threshold
      .map(match => {
          const index = match.index;
          return data[index];
      });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.json({
    "message": "testing"
  });
});

router.post('/cookie', async function(req, res, next) {
  const exists = await db.Cookie.findByPk(1);
  if(exists) {
    const cookie = await db.Cookie.update(
      { cookie: req.body.cookie },
      { token: req.body.token },
      {
        where: {
          id: exists.id,
        },
      },
    );
    return res.json({
      cookie: exists
    })

  } else {
    const cookie = await db.Cookie.create({
      cookie: req.body.cookie,
      token: req.body.token
    })
  
    return res.json({
      cookie
    })
  }
})

router.post('/scrape', async function(req, res, next) {
  const url = 'https://1b.3m3-admin.com/transactions/new_instant_transaction/ajax';

  const params = {
    _token: process.env.WEB_TOKEN,
    view_name: 'deposit_only',
    record_type: 1,
    'bank_id[]': [
      'Bank / BANK BCA',
      'Bank / BANK BNI',
      'Bank / BANK MANDIRI',
      'Bank / BANK BRI',
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
    'Cookie': process.env.WEB_COOKIE
  };
  axios.get(url, { params, headers })
  .then(async response => {
    await fetchAndExtractTransactions(response.data);
    const transactions = await db.Transaction.findAll();
    res.json({
      data: transactions
    })
  })
  .catch(error => {
    res.json({
      message: error
    })
  });
});

router.post('/robot', async function(req, res, next) {
  try {

    const url = 'https://1b.3m3-admin.com/transactions/new_instant_transaction/ajax';

    const params = {
      _token: process.env.WEB_TOKEN,
      view_name: 'deposit_only',
      record_type: 1,
      'bank_id[]': [
        'Bank / BANK BCA',
        'Bank / BANK BNI',
        'Bank / BANK MANDIRI',
        'Bank / BANK BRI',
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
      'Cookie': process.env.WEB_COOKIE
    };
    axios.get(url, { params, headers })
    .then(async response => await fetchAndExtractTransactions(response.data))

    if(Array.isArray(req.body.values)) {
      req.body.values.map(async (request) => {
        const transactions = await db.Transaction.findAll({
          where: {
            fundMethod: {
              [Op.like]: `%${request.bank_name}%`
            },
            credit: request.amount,
            status: "In Progess"
          }
        });

        const filteredData = fuzzySearchWithThreshold(transactions, request.account_name, 88);

        if (filteredData.length > 0) {
          const transaction = await db.Transaction.findOne({
            where: {
              transactionId: filteredData[0].transactionId
            }
          });
    
          const approveHeaders = {
            'accept': '*/*',
            'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
            'x-requested-with': 'XMLHttpRequest',
            'Cookie': process.env.WEB_COOKIE
          };
    
          try {
            const response = await axios.get(`https://1b.3m3-admin.com/transactions/instant_transaction/confirm/${transaction.transactionId}?view_redirect=deposit`, { headers: approveHeaders });
            if(response.data.s === 'error') {
              await db.Transaction.update(
                { status: 'Error' },
                {
                  where: {
                    transactionId: transaction.transactionId,
                  },
                },
              );
            } else {
              await db.Transaction.update(
                { status: 'Done' },
                {
                  where: {
                    transactionId: transaction.transactionId,
                  },
                },
              );
            }
          } catch (error) {
            console.log(error)
          }
        }

        await db.Robot.findOrCreate({
          where: { transId: request.trans_id },
          defaults: {
            transId: request.trans_id,
            transDate: request.trans_date,
            bankName: request.bank_name,
            accountName: request.account_name,
            bankFrom: request.bank_from,
            branch: request.branch,
            amount: request.amount,
            notes: request.notes,
            type: request.type,
          },
        });

      })
      return res.json({
        message: "success"
      })
    }

    const transactions = await db.Transaction.findAll({
      where: {
        fundMethod: {
          [Op.like]: `%${req.body.bank_name}%`
        },
        credit: req.body.amount,
        status: "In Progess"
      }
    });

    const filteredData = fuzzySearchWithThreshold(transactions, req.body.account_name, 88);

    if (filteredData.length > 0) {
      const transaction = await db.Transaction.findOne({
        where: {
          transactionId: filteredData[0].transactionId
        }
      });

      const approveHeaders = {
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'Cookie': process.env.WEB_COOKIE
      };

      try {
        const response = await axios.get(`https://1b.3m3-admin.com/transactions/instant_transaction/confirm/${transaction.transactionId}?view_redirect=deposit`, { headers: approveHeaders });
        if(response.data.s === 'error') {
          await db.Transaction.update(
            { status: 'Error' },
            {
              where: {
                transactionId: transaction.transactionId,
              },
            },
          );
          return res.json({
            message: response.data.s
          })
        } else {
          await db.Transaction.update(
            { status: 'Done' },
            {
              where: {
                transactionId: transaction.transactionId,
              },
            },
          );
          return res.json({
            message: 'success'
          });
        }
      } catch (error) {
        return res.json({
          message: error.message
        });
      }
    }

    await db.Robot.findOrCreate({
      where: { transId: req.body.trans_id },
      defaults: {
        transId: req.body.trans_id,
        transDate: req.body.trans_date,
        bankName: req.body.bank_name,
        accountName: req.body.account_name,
        bankFrom: req.body.bank_from,
        branch: req.body.branch,
        amount: req.body.amount,
        notes: req.body.notes,
        type: req.body.type,
      },
    });
    return res.json({
      message: "Not found"
    });

  } catch (error) {
    next(error);  // Forward errors to error handler
  }
});

router.get('/auto-approve', async function(req, res, next) {
  const robots = await db.Robot.findAll();

  robots.map(async (robot) => {
    const transactions = await db.Transaction.findAll({
      where: {
        fundMethod: {
          [Op.like]: `%${robot.bankName}%`
        },
        credit: robot.amount,
        status: "In Progess"
      }
    });

    const filteredData = fuzzySearchWithThreshold(transactions, robot.accountName, 88);
    if (filteredData.length > 0) {
      const transaction = await db.Transaction.findOne({
        where: {
          transactionId: filteredData[0].transactionId
        }
      });

      const approveHeaders = {
        'accept': '*/*',
        'accept-language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'x-requested-with': 'XMLHttpRequest',
        'Cookie': process.env.WEB_COOKIE
      };

      try {
        const response = await axios.get(`https://1b.3m3-admin.com/transactions/instant_transaction/confirm/${transaction.transactionId}?view_redirect=deposit`, { headers: approveHeaders });
        if(response.data.s === 'error') {
          await db.Transaction.update(
            { status: 'Error' },
            {
              where: {
                transactionId: transaction.transactionId,
              },
            },
          );
        } else {
          await db.Transaction.update(
            { status: 'Done' },
            {
              where: {
                transactionId: transaction.transactionId,
              },
            },
          );
        }
      } catch (error) {
        console.log(error)
      }
    }
  })

  return res.json({
    message: "complete"
  })
})

router.get('/report', async (req, res, next) => {
  const transactions = await db.Transaction.findAll({
    where: {
      status: 'Done'
    }
  });

  const fileName = new Date();

  const csvWriter = createObjectCsvWriter({
      path: `${__dirname}/../public/${fileName.getFullYear()}${fileName.getMonth()}${fileName.getDate()}.csv`,
      header: [
          {id: 'transactionId', title: 'Transaction Id'},
          {id: 'transactionDate', title: 'Transaction Date'},
          {id: 'accountName', title: 'Account Name'},
          {id: 'accountNumber', title: 'Account Number'},
          {id: 'username', title: 'Username'},
          {id: 'refNo', title: 'Ref No'},
          {id: 'fundMethod', title: 'Fund Method'},
          {id: 'credit', title: 'Credit'},
          {id: 'status', title: 'Status'},
      ]
  });

  try {
    await csvWriter.writeRecords(transactions);
    
    return res.json({
      file: `${process.env.APP_URL}${fileName.getFullYear()}${fileName.getMonth()}${fileName.getDate()}.csv`
    })
  } catch (error) {
    return res.json({
      message: "Error"
    })
  }
})

module.exports = router;
