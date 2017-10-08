var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

// Set the seed and keyword here
var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
var keyword = 'rain';
//
var maxLevel = 6;
var maxCrawlPageNum = 1000;
var pauseTime = 10;


var todo = [];
var error = [];
var visited = new Set();
var URLs = [];
var level = 0;


todo.push([[seed, '']]);
// var level = 0;

for (var i = 2; i <= maxLevel; i++) {
    todo.push([]);
}

function crawl() {
    var combo = todo[level].shift();
    if (combo === undefined) {
        level++;
        combo = todo[level].shift();
    }

    console.log(combo);
    var url = combo[0];
    //download the html
    var name = url.split('/');
    name = name[name.length - 1];
    var lowerURL = url.toLowerCase();
    if (!visited.has(lowerURL)) {
        // visited.add(lowerURL);

        request(url, function (err, response, body) {
            if (err) {
                console.log(err);
            } else if (response && response.statusCode === 200 && body) {
                var $ = cheerio.load(body);

                var thisUrl = $('link[rel=canonical]').attr('href');
                if (thisUrl.includes('#')) {
                    var temp = url.split('#');
                    thisUrl = temp[0];
                }
                console.log(thisUrl);
                if (!visited.has(thisUrl.toLowerCase())) {
                    visited.add(thisUrl.toLowerCase());
                    visited.add(url.toLowerCase());

                    var content = '.mw-parser-output';

                    $('a', content).each(function (i, el) {
                        if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                            var toadd = $(this).attr('href');
                            var anchor = $(this).attr('title');
                            if (toadd.includes('/wiki/')
                                && !toadd.includes(':')
                                && !toadd.includes('/File')
                                && !toadd.includes('#')) {
                                if (level < maxLevel - 1) {
                                    var urlToAdd = toadd.includes('https://en.wikipedia.org') ? toadd : 'https://en.wikipedia.org' + toadd;
                                    todo[level + 1].push([urlToAdd, anchor]);
                                }
                            }
                        }
                    });
                    var anchor = combo[1];
                    if (containsKeyword(url, anchor)) {
                        name = name.replace(/[\\*?:"<>|]/g, function (x) {
                            return x.charCodeAt(0);
                        });
                        console.log(name);
                        filename = './focusedDownloads/' + name.toLowerCase() + '.txt';
                        fs.writeFileSync(filename, body);
                        URLs.push(thisUrl);
                    }

                    afterFunction();

                } else {
                    afterFunction();
                }
            }
        });

    } else {
        if (level < maxLevel && URLs.length < maxCrawlPageNum) {
            console.log(URLs.length);
            console.log(visited.size);
            console.log(todo[level].length);
            console.log(level);
            crawl();
        } else {
            outputURLs();
        }
    }
}

function containsKeyword(url, anchor) {
    if (url === undefined)
        return false;
    url = url.toLowerCase();
    if (anchor !== undefined)
        anchor = anchor.toLowerCase();
    return (url.indexOf(keyword) !== -1
        && (url.charAt(url.indexOf(keyword) - 1) === '_'
        || url.charAt(url.indexOf(keyword) - 1) === '/'))
        || (anchor !== undefined
        && anchor.indexOf(keyword) !== -1
        && (anchor.indexOf(keyword) === 0
        || anchor.charAt(anchor.indexOf(keyword) - 1) === ' '));
}

function afterFunction() {
    if (level < maxLevel && URLs.length < maxCrawlPageNum) {
        console.log(URLs.length);
        console.log(visited.size);
        console.log(todo[level].length);
        console.log(level);
        setTimeout(crawl, pauseTime);
    } else {
        outputURLs();
    }
}

function outputURLs() {
    var outURLs = fs.createWriteStream('./focusedCrawledURLs.txt');
    URLs.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + " ");
    });
    console.log(error);
    console.log('Finished XD');
}

crawl();
