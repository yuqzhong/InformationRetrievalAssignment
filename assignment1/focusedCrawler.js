var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
var rp = require('request-promise');
// var stemmer = require('porter-stemmer').stemmer;

// Set the seed and keyword here
var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
var keyword = 'rain';

var maxLevel = 6;
var maxCrawlPageNum = 1000;
var pauseTime = 100;


var todo = [];
var error = [];
var visited = new Set();
var URLs = [];
// var names = new Set();

todo.push([[seed,'']]);
for (var i = 1; i < 7; i++) {
    todo.push([]);
}
var level = 0;

// var re = new RegExp('_' + keyword.charAt(0) + '|' + keyword.charAt(0).toUpperCase()  + keyword.substring(1));

function crawl() {
    var combo = todo[level].pop();
    console.log(combo);
    if (combo === undefined) {
        level = level + 1;
        combo = todo[level].pop();
    }
    var url = combo[0];
    var lowerURL = url.toLowerCase();
    console.log(url);
    if (!visited.has(lowerURL)) {

        visited.add(lowerURL);

        //download the html
        var name = url.split('/');
        name = name[name.length - 1];
        var des = fs.createWriteStream('./focusedDownloads/' + name.toLowerCase() + '.txt');

        var options = {
            uri: url,
            transform: function (body) {
                cheerio.load(body);
            }
        };
        rp(options)
            .then(function ($) {
                console.log(response.statusCode);
                // if (response.statusCode === 200) {
                    // console.log(response);
                    // var $ = cheerio.load(response);
                    console.log($);
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

                                // console.log(anchor);
                                if (toadd.includes('https://en.wikipedia.org')) {
                                    todo[level + 1].push([toadd, anchor]);

                                } else {
                                    todo[level + 1].push(['https://en.wikipedia.org' + toadd, anchor]);
                                }
                                console.log(todo);
                            }

                        }

                    });
                // }

            })
            .then(function() {
                var anchor = combo[1];

                if ((url.indexOf(keyword) !== -1
                    && (url.charAt(url.indexOf(keyword) - 1) === '_'
                    || url.charAt(url.indexOf(keyword) - 1) === '/'))
                    || (anchor.indexOf(keyword) !== -1
                    && (anchor.indexOf(keyword) === 0
                    || anchor.charAt(anchor.indexOf(keyword) - 1) === ' '))) {
                    URLs.push(url);
                    request(url)
                        .pipe(des)
                        .on('close', function () {
                            console.log(todo[level].length);
                            console.log(visited);
                            console.log(visited.size);
                            console.log(level);
                            console.log('File save successfully!');

                            if (level < maxLevel && visited.size < maxCrawlPageNum) {
                                setTimeout(crawl, pauseTime);
                            } else {
                                outputURLs();
                            }

                        })
                        .on('error', function (err) {
                            error.push(url + " " + err);
                            console.log(err);
                        })
                } else {
                    if (level < maxLevel && visited.size < maxCrawlPageNum) {
                        setTimeout(crawl, pauseTime);
                    } else {
                        outputURLs();
                    }
                }
            })
            // .catch('error', function (err) {
            //     console.log(err);
            // });

    } else {
        if (level < maxLevel && visited.size < maxCrawlPageNum) {
            crawl();
        } else {
            outputURLs();
        }
    }
}

function outputURLs() {
    var outURLs = fs.createWriteStream('./focusedDownloads/crawledURLs.txt');
    URLs.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + " ");
    });
    console.log(error);
    console.log('Finished XD');
}

crawl();

