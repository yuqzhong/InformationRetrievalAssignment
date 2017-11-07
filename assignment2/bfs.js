var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';

var maxLevel = 6;
var maxCrawlPageNum = 1000;
var pauseTime = 10;



var todo = []; // format : [[url, parentDId],..]
var visited = new Set();
var URLs = [];
var inLink = []; // inlink graph
var outLink = []; // out link graph
var map = new Map(); // Key: lowercase url Value: index in inlink and outlink
var nameMap = new Map(); // Key: index value: documentId (title of url / name)
var names = []; // store name (related to index in inlink and outlink)


todo.push([[seed, 0]]);

for (var i = 0; i < 6; i++) {
    todo.push([]);
}
var level = 0;


function crawl() {
    var combo = todo[level].shift();
    if (combo === undefined) {
        level = level + 1;
        combo = todo[level].shift();
    }
    var url = combo[0];
    var parentIndex = combo[1];

    //download the html
    request(url, function (err, response, body) {
        // console.log(response.statusCode);
        if (err) {
            console.log(err);
        } else if (response.statusCode === 200 && body) {

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

                var name = thisUrl.split('/');
                name = name[name.length - 1];
                names.push(name);
                nameMap.set(names.length - 1, name);

                map.set(thisUrl.toLowerCase(), names.length - 1);
                inLink.push(new Set());
                outLink.push(new Set());
                
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
                            var urlToAdd = toadd.includes('https://en.wikipedia.org') ? toadd : 'https://en.wikipedia.org' + toadd;
                            todo[level + 1].push([urlToAdd, map.get(thisUrl.toLowerCase())]);
                        }

                    }

                });
                
                name = name.replace(/[\\*?:"<>|]/g, function (x) {
                    return x.charCodeAt(0);
                });
                
                var filename = './bfsDownloads/' + name.toLowerCase() + '.txt';
                fs.writeFileSync(filename, body);

            }

            var thisIndex = map.get(thisUrl.toLowerCase());
            inLink[thisIndex].add(nameMap.get(parentIndex)); // put the name of parent in inlink
            outLink[parentIndex].add(nameMap.get(thisIndex));

            next();
        }

    })


}

function next() {
    console.log(todo[level].length);
    console.log(URLs.length);
    if (level < maxLevel && URLs.length < maxCrawlPageNum) {
        setTimeout(crawl, pauseTime);
    } else {
        outputURLs();
    }
}

function outputURLs() {
    console.log(inLink);
    var outURLs = fs.createWriteStream('./bfsURLs.txt');
    URLs.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + "\r\n");
    });

    var outIndex = fs.createWriteStream('./bfsIndex.txt');
    map.forEach(function (value, key, map) {
        var arr = key.split('/');
        var name = arr[arr.length - 1];
        outIndex.write(key + " " + name + "\r\n");

    });

    var bfsInLink = fs.createWriteStream('./bfsInLink.txt');
    for (var i = 0; i < inLink.length; i++) {
        bfsInLink.write("| " + names[i] + " ");
        inLink[i].forEach (function (value, p1, p2) {
            bfsInLink.write(value + " ");
        });
        bfsInLink.write('\r\n');
    }

    var bfsOutLink = fs.createWriteStream('./bfsOutLink.txt');
    for (var i = 0; i < outLink.length; i++) {
        bfsOutLink.write("| " + names[i] + " ");
        outLink[i].forEach (function (value, p1, p2) {
            bfsOutLink.write(value + " ");
        });
        bfsOutLink.write('\r\n');
    }

    console.log('Finished XD');
}

crawl();
