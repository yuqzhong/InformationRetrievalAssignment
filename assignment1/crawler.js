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
    // request(seed, function (err, response, body) {
    //     if (err) {
    //         console.log(err);
    //     } else if (body) {
    //         console.log(body);
    //     }
    // });

//download the html

var todo = new Set();
var visited = [];

var name = seed.split('/');
name = name[name.length - 1];
var des = fs.createWriteStream('./downloads/' + name + '.text');


request(seed, function (err, response, body) {
        if (err) {
            console.log(err);
        } else if (body) {
            var $ = cheerio.load(body);

            var content = '.mw-parser-output';
            var urls = $('a',content)
                .each(function (i, el) {

                    if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                        var url = $(this).attr('href');
                        if (url.includes('/wiki')
                            && !url.includes('/File')
                            && !url.includes('#')
                            && !todo.has(url)) {
                            todo.add(url);
                        }

                    }

                });
            console.log(todo);
        }

    })
    .pipe(des)
    .on('finish', function () {
        console.log('File save successfully!');
    })
    .on('error', function (err) {
        console.log(error);
    });
// or
// des.on('close', function () {
//     console.log('done');
// })
// .on('error', function (err) {
//     console.log(err);
// })