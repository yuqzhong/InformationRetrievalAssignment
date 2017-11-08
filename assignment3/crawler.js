var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
var maxLevel = 6;
var maxCrawlPageNum = 10;
var pauseTime = 100;


var todo = [];
var error = [];
var visited = new Set();
var URLs = [];

todo.push([seed]);
for (var i = 1; i < 7; i++) {
    todo.push([]);
}
var level = 0;

function crawl() {
    var url = todo[level].pop();
    if (url === undefined) {
        level = level + 1;
        url = todo[level].pop();
    }
    var lowerURL = url.toLowerCase();
    console.log(url);
    if (!visited.has(lowerURL)) {
        //download the html
        request(url, function (err, response, body) {
            if (err) {
                console.log(err);
            } else if (response.statusCode === 200 && body) {
                // console.log(response);
                var $ = cheerio.load(body);
                //check if change to other url
                var thisUrl = $('link[rel=canonical]').attr('href');
                if (thisUrl.includes('#')) {
                    var temp = url.split('#');
                    thisUrl = temp[0];
                }
                console.log(thisUrl);
                if (!visited.has(thisUrl.toLowerCase())) {
                    visited.add(thisUrl.toLowerCase());
                    URLs.push(thisUrl);
                    var content = '.mw-parser-output';

                    $('a',content).each(function (i, el) {
                        if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                            var toadd = $(this).attr('href');
                            if (toadd.includes('/wiki/')
                                && !toadd.includes(':')
                                && !toadd.includes('/File')) {
                                if (toadd.includes('#')) {
                                    var temp = url.split('#');
                                    toadd = temp[0];
                                }
                                if (toadd.includes('https://en.wikipedia.org')) {
                                    todo[level + 1].push(toadd);
                                } else {
                                    todo[level + 1].push('https://en.wikipedia.org' + toadd);
                                }
                            }

                        }

                    });
                    var name = thisUrl.split('/');
                    name = name[name.length - 1];
                    name = name.replace(/[\\*?:"<>|]/g, function (x) {
                        return x.charCodeAt(0);
                    });
                    console.log(name.toLowerCase());
                    var filename = './testDownloads/' + name + '.txt';
                    $('.reference').remove();
                    fs.writeFileSync(filename, $(content).children().first().nextUntil('.reflist').text());


                    afterFunction();
                } else {
                    visited.add(url);
                    afterFunction();
                }
            }

        })

    } else {
        console.log(level);
        console.log();
        if (level < maxLevel && URLs.length < maxCrawlPageNum) {
            crawl();
        } else {
            outputURLs();
        }
    }
}

function afterFunction() {
    console.log(todo[level].length);
    console.log(visited.size);
    console.log(URLs.length);
    console.log(level);
    console.log();
    if (level < maxLevel && URLs.length < maxCrawlPageNum) {
        setTimeout(crawl, pauseTime);
    } else {
        outputURLs();
    }
}

function outputURLs() {
    var outURLs = fs.createWriteStream('./testCrawledURLs.txt');
    URLs.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + " ");
    });
    console.log(error);
    console.log('Finished XD');
}

crawl();

