const cron = require('cron');
const https = require('https');

const url = process.env.PUBLIC_URL;
const job = new cron.CronJob('*/10 * * * *', function () {
    console.log('Hitting server');

    https.get(url), (res) => {
        console.log(res.statusCode)
    };
})

module.exports = job;