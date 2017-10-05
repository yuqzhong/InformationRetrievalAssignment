var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

// Set the seed and keyword here
var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
var keyword = 'rain';

var maxLevel = 6;
var maxCrawlPageNum = 1000;
var pauseTime = 0;


var todo = [];
var error = [];
var visited = new Set();
var URLs = [];

todo.push([seed,'', 1]);
// var level = 0;

// var re = new RegExp('_' + keyword.charAt(0) + '|' + keyword.charAt(0).toUpperCase()  + keyword.substring(1));

function crawl() {
    var combo = todo.shift();
    console.log(combo);
    var url = combo[0];
    var level = combo[2];
    var lowerURL = url.toLowerCase();
    if (level <= maxLevel && !visited.has(lowerURL)) {
        visited.add(lowerURL);
        var nextLevel = level + 1;
        //download the html
        var name = url.split('/');
        name = name[name.length - 1];

        request(url, function (err, response, body) {
            // console.log(response.statusCode);
            if (err) {
                console.log(err);
            } else if (response && response.statusCode === 200 && body) {
                // console.log(response);
                var $ = cheerio.load(body);
                var content = '.mw-parser-output';

                $('a',content).each(function (i, el) {
                    if (!$(this).attr("class:contains('image')")
                        && $(this).attr('href')) {
                        var toadd = $(this).attr('href');
                        var anchor = $(this).attr('title');
                        if (toadd.includes('/wiki/')
                            && !toadd.includes(':')
                            && !toadd.includes('/File')
                            && !toadd.includes('#')) {

                            if ((toadd.indexOf(keyword) !== -1
                                && (toadd.charAt(toadd.indexOf(keyword) - 1) === '_'
                                    || toadd.charAt(toadd.indexOf(keyword) - 1) === '/'))
                                || (anchor.indexOf(keyword) !== -1
                                    && (anchor.indexOf(keyword) === 0
                                        || anchor.charAt(anchor.indexOf(keyword) - 1) === ' '))) {

                                if (toadd.includes('https://en.wikipedia.org')) {
                                    todo.unshift([toadd, anchor, nextLevel]);

                                } else {
                                    todo.unshift(['https://en.wikipedia.org' + toadd, anchor, nextLevel]);
                                }

                            } else {
                                if (toadd.includes('https://en.wikipedia.org')) {
                                    todo.push([toadd, anchor, nextLevel]);

                                } else {
                                    todo.push(['https://en.wikipedia.org' + toadd, anchor, nextLevel]);
                                }
                            }
                        }
                    }

                });

                // console.log(todo);
                var anchor = combo[1];

                if ((url.indexOf(keyword) !== -1
                    && (url.charAt(url.indexOf(keyword) - 1) === '_'
                    || url.charAt(url.indexOf(keyword) - 1) === '/'))
                    || (anchor.indexOf(keyword) !== -1
                    && (anchor.indexOf(keyword) === 0
                    || anchor.charAt(anchor.indexOf(keyword) - 1) === ' '))) {

                    fs.writeFile('./focusedDownloads/' + name.toLowerCase() + '.txt', body);
                    URLs.push(url);
                    console.log('File save successfully!');

                }
                console.log(todo);
                // console.log(visited);
                console.log(visited.size);
                console.log(URLs);
                console.log(level);

                if (todo.length > 0 && URLs.length < maxCrawlPageNum) {
                    setTimeout(crawl, pauseTime);
                } else {
                    outputURLs();
                }

            }

        })

    } else {
        if (todo.length > 0 && URLs.length < maxCrawlPageNum) {
            crawl();
        } else {
            outputURLs();
        }
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

