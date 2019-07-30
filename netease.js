const puppeteer = require('puppeteer')

puppeteer.launch({headless: false, slowMo: 250, defaultViewport: {width: 1400, height: 1080}}).then(async brower => {
    const page = await brower.newPage();

    await page.goto("https://music.163.com/");

    // login
    await page.hover('a.link');
    await page.click('i.icn-wy');
    await page.waitForSelector('div.f-thide');

    await page.type('input#e', '@163.com');
    await page.type('input#epw', '');
    await page.keyboard.press('Enter');

    // get user id
    await page.waitForSelector('a.name');
    const homeUrl = await page.$eval('a.name', e => e.href);
    var id = homeUrl.match(/id=(\d+)$/)[1];

    // get the listening record
    await page.goto('https://music.163.com/#/user/songs/rank?id=' + id);
    let recordUrlPattern = /weapi\/v1\/play\/record/;
    page.on('response', response => {
        if (response.ok() && recordUrlPattern.test(response.url())) {
            response.json().then(function(records) {        
                records.weekData.forEach(function(record) {
                    let song = record.song;
                    console.log(song.name + '|' + song.ar.map(function(a) {return a.name;}).join(",") + '|' + song.al.name);
                });
            });
        }
    });
});