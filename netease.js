const puppeteer = require('puppeteer');
const _ = require('underscore');
const CREDS = require('./creds');
const fs = require('fs')

function processListeningRecord(songs) {
    const path = 'records.json';
    if (fs.existsSync(path)) {
        fs.unlink(path);
    }

    fs.writeFile(path, JSON.stringify(songs));
}

puppeteer.launch({headless: false, slowMo: 50, defaultViewport: {width: 1400, height: 1080}}).then(async browser => {
    const page = await browser.newPage();

    await page.goto('https://music.163.com/');

    // login with netease email credential
    await page.hover('a.link');
    await page.click('i.icn-wy');
    await page.waitForSelector('div.f-thide');

    await page.type('input#e', CREDS.username);
    await page.type('input#epw', CREDS.password);
    await page.keyboard.press('Enter');

    // get user id
    await page.waitForSelector('a.name');
    const homeUrl = await page.$eval('a.name', e => e.href);
    var id = homeUrl.match(/id=(\d+)$/)[1];

    // get the listening record
    await page.goto('https://music.163.com/#/user/songs/rank?id=' + id);
    
    const recordUrlPattern = /weapi\/v1\/play\/record/;
    const response = await page.waitForResponse(response => response.ok() && recordUrlPattern.test(response.url()));
    
    response.json().then(function(records) {        
        let albums = _.groupBy(records.weekData, record => record.song.al.id);
        let aggregatedSongs = _.mapObject(albums, function(songs, albumId) {
            return songs.map(function(s) { return s.song.id; });
        });

        processListeningRecord(aggregatedSongs);
    });

});