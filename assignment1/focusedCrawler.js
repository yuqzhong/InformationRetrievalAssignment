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
var ptodo = [];
var error = [];
var visited = new Set();
var URLs = [];
var counter = 0;

var invalidChar = ['\\','/','*', '?', ':', '"', '<', '>', '|'];

todo.push([seed, '', 1]);
visited.add(seed.toLowerCase());
// var level = 0;

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

function crawl() {
    counter = counter + 1;
    var combo = undefined;
    if (ptodo.length !== 0)
        combo = ptodo.shift();
    else
        combo = todo.shift();

    console.log(combo);
    var url = combo[0];
    var level = combo[2];
    var nextLevel = level + 1;
    //download the html
    var name = url.split('/');
    name = name[name.length - 1];

    request(url, function (err, response, body) {
        if (err) {
            console.log(err);
        } else if (response && response.statusCode === 200 && body) {
            var $ = cheerio.load(body);
            var content = '.mw-parser-output';

            var flag = containsKeyword(url, combo[1]);
            $('a', content).each(function (i, el) {
                if (!$(this).attr("class:contains('image')")
                    && $(this).attr('href')) {
                    var toadd = $(this).attr('href');
                    var anchor = $(this).attr('title');
                    if (toadd.includes('/wiki/')
                        && !toadd.includes(':')
                        && !toadd.includes('/File')
                        && !toadd.includes('#')) {

                        var lowerURL = toadd.toLowerCase();
                        if (nextLevel <= maxLevel && !visited.has(lowerURL)) {
                            visited.add(lowerURL);
                            var urlToAdd = toadd.includes('https://en.wikipedia.org') ? toadd : 'https://en.wikipedia.org' + toadd;
                            if (containsKeyword(toadd, anchor)) {
                                ptodo.unshift([urlToAdd, anchor, nextLevel]);
                            } else if (flag) {
                                ptodo.push([urlToAdd, anchor, nextLevel]);
                            } else {
                                todo.push([urlToAdd, anchor, nextLevel]);
                            }
                        }
                    }
                }
            });
            var anchor = combo[1];
            if (containsKeyword(url, anchor)) {
                //language=JSRegexp
                name = name.replace(/[\\*?:"<>|]/g, function (x) {
                    return x.charCodeAt(0);
                });
                console.log(name);
                filename = './focusedDownloads/' + name.toLowerCase() + '.txt';
                fs.writeFileSync(filename, body);
                URLs.push(url);
            }
        }

        if ((todo.length > 0 || ptodo.length > 0) && URLs.length < maxCrawlPageNum) {
            console.log(URLs.length);
            console.log(ptodo.length);
            console.log(todo.length);
            setTimeout(crawl, pauseTime);
        } else {
            outputURLs();
        }
    });
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
