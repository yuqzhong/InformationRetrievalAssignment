var express = require('express');
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var port = 8000;
var app = express();

app.listen(port);
console.log('Server is running at' + port);

var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';


var todo = [];
var visited = new Set();

todo.push(seed);

var level = 1;

function crawl() {
    var url = todo.pop();
    if (!visited.has(url)) {
        visited.add(url);
        //download the html
        var name = url.split('/');
        name = name[name.length - 1];
        var des = fs.createWriteStream('./downloads/' + name + '.text');

        request(url, function (err, response, body) {
            if (err) {
                console.log(err);
            } else if (body) {
                var $ = cheerio.load(body);

                var content = '.mw-parser-output';
                $('a',content)
                    .each(function (i, el) {
                        if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                            var toadd = $(this).attr('href');
                            console.log(toadd);
                            if (toadd.includes('/wiki/')
                                && !toadd.includes('/File')
                                && !toadd.includes('#')) {
                                console.log(toadd);
                                if (!toadd.includes('https')) {
                                    todo.push('https://en.wikipedia.org' + toadd);
                                } else {
                                    todo.push(toadd);
                                }
                            }

                        }

                    });
                console.log(todo);
            }

        })
        .pipe(des)
        .on('finish', function () {
            console.log('File save successfully!');
            if (level <= 6 && visited.size < 10) {
                crawl();
            }
        })
        .on('error', function (err) {
            console.log(error);
        })
    } else {
        if (level <= 6 && visited.size < 10) {
            crawl();
        }
    }
}

crawl();

