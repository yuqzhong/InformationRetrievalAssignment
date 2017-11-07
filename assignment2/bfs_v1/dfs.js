var path = require('path');
var request = require('request');
var promise = require('request-promise');
var cheerio = require('cheerio');
var fs = require('fs');

var pauseTime = 10;

var urlFileName = 'dfsURLs.txt';
var urlStr = "";


var todo = [];
var inLink = [];
var outLink = [];
var map = new Map();
var nameMap = new Map();
var names = [];

// create todoList by reading from text file that stores the 1000 urls
var inStream = fs.createReadStream(urlFileName);

inStream.on('data', function (data) {
    urlStr += data;
})
    .on('end', function () {
        afterInput();
    });
function afterInput() {
    todo = urlStr.split("\r\n");
    console.log(todo);
    todo.pop();


    // map urls with documentID (urlID), create every id entry in inLink and outLink
    for (var i = 0; i < todo.length; i++) {
        inLink.push(new Set());
        outLink.push(new Set());
        map.set(todo[i].toLowerCase(), i);
        var arr = todo[i].split('/');
        var name = arr[arr.length - 1];
        nameMap.set(i, name);
        names.push(name);
    }
    createMap();
}

function createMap() {

    var url = todo.shift();
    var index = map.get(url.toLowerCase());

    console.log(url);
    console.log(index);

    request(url, function (err, response, body) {
        if (err) {
            console.log(err);
        } else if (response.statusCode === 200 && body) {
            var $ = cheerio.load(body);

            var content = '.mw-parser-output';

            $('a', content).each(function (i, el) {
                if (!$(this).attr("class:contains('image')")
                    && $(this).attr('href')) {
                    var outUrl = $(this).attr('href');
                    if (outUrl.includes('/wiki/')
                        && !outUrl.includes(':')
                        && !outUrl.includes('/File')) {

                        if (outUrl.includes('#')) {
                            var temp = url.split('#');
                            outUrl = temp[0];
                        }

                        if (!outUrl.includes('https://en.wikipedia.org')) {
                            outUrl = 'https://en.wikipedia.org' + outUrl;
                        }

                        var out = map.get(outUrl.toLowerCase());

                        if (out !== undefined && out !== index) {
                            inLink[out].add(nameMap.get(index));
                            outLink[index].add(nameMap.get(out));

                        }
                        //
                    }
                }
            });

            createMapGoNext();

        }

    });
}

function createMapGoNext() {
    console.log("todo length is now " + todo.length);
    // console.log(inLink);


    if (todo.length > 0) {
        setTimeout(createMap, pauseTime);
    } else {
        finish();
    }
}

function finish() {
    console.log(inLink);
    var outURLs = fs.createWriteStream('./dfsURLs.txt');
    // URLs.forEach(function (p1, p2, p3) {
    //     outURLs.write(p1 + "\r\n");
    // });

    var outIndex = fs.createWriteStream('./dfsIndex.txt');
    map.forEach(function (value, key, map) {
        var arr = key.split('/');
        var name = arr[arr.length - 1];
        outIndex.write(key + " " + name + "\r\n");

    });

    var dfsInLink = fs.createWriteStream('./dfsInLink.txt');
    for (var i = 0; i < inLink.length; i++) {
        dfsInLink.write("| " + names[i] + " ");
        inLink[i].forEach (function (value, p1, p2) {
            dfsInLink.write(value + " ");
        });
        dfsInLink.write('\r\n');
    }

    var dfsOutLink = fs.createWriteStream('./dfsOutLink.txt');
    for (var i = 0; i < outLink.length; i++) {
        dfsOutLink.write("| " + names[i] + " ");
        outLink[i].forEach (function (value, p1, p2) {
            dfsOutLink.write(value + " ");
        });
        dfsOutLink.write('\r\n');
    }

    console.log('Finished XD');
}





