var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');
// var pause = require('pause');

var port = 8000;
var app = express();

app.listen(port);
console.log('Server is running at ' + port);

var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
var maxLevel = 6;
var maxCrawlPageNum = 300;
var pauseTime = 50;


var todo = [];
var error = [];
var visited = new Set();
var names = new Set();

todo.push([seed]);
for (var i = 1; i < 6; i++) {
    todo.push([]);
}
var level = 0;
console.log(todo);

function crawl() {
    var url = todo[level].pop();
    if (url === undefined) {
        level = level + 1;
        url = todo[level].pop();
    }
    console.log(url);
    if (!visited.has(url)) {
        //download the html
        var name = url.split('/');
        name = name[name.length - 1];
        var des = fs.createWriteStream('./downloads/' + name + '.txt');

        request(url, function (err, response, body) {
            if (err) {
                error.push(url + " " + err);
                console.log(err);
            } else if (body) {
                var $ = cheerio.load(body);

                var content = '.mw-parser-output';
                $('a',content)
                    .each(function (i, el) {
                        if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                            var toadd = $(this).attr('href');
                            if (toadd.includes('/wiki/')
                                && !toadd.includes(':')
                                && !toadd.includes('/File')
                                && !toadd.includes('#')) {
                                if (toadd.includes('https://en.wikipedia.org')) {
                                    todo[level + 1].push(toadd);
                                } else {
                                    todo[level + 1].push('https://en.wikipedia.org' + toadd);
                                }
                            }

                        }

                    });
            }

        })
        .pipe(des);

    des
        .on('close', function () {
            visited.add(url);
            if (names.has(name)) {
                console.log(url);
                console.log("!!!!!!!!!!!!!!!!!" + name);
            } else {
                names.add(name);

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
            }

        })
        .on('error', function (err) {
            error.push(url + " " + err);
            console.log(err);
        })

    } else {
        if (level < maxLevel && visited.size < maxCrawlPageNum) {
            crawl();
        } else {
            outputURLs();
        }
    }
}

function outputURLs() {
    var outURLs = fs.createWriteStream('./crawledURLs.txt');
    visited.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + " ");
    });
    var nameOut = fs.createWriteStream('./names.txt');
    names.forEach(function (p1, p2, p3) {
        nameOut.write(p1 + "+");
    });
    console.log(error);
    console.log('Finished XD');
}

crawl();
