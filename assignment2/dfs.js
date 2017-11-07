var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');


var seed = 'https://en.wikipedia.org/wiki/Tropical_cyclone';
//
var maxLevel = 6;
var maxCrawlPageNum = 1000;
var pauseTime = 10;


// format for data in todoArr: url, parentDId, depth
var todo = [];
var visited = new Set();
var URLs = [];
var inLink = []; // inlink graph
var outLink = []; // out link graph
var map = new Map(); // Key: lowercase url Value: index in inlink and outlink
var nameMap = new Map(); // Key: index value: documentId (title of url / name)
var names = []; // store name (related to index in inlink and outlink)


todo.push([seed, 0, 0]);


function crawl() {
    var combo = todo.pop();
    console.log(combo);

    var url = combo[0];
    var parentIndex = combo[1];
    var level = combo[2];
    var nextLevel = level + 1;

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

                var name = thisUrl.split('/');
                name = name[name.length - 1];
                names.push(name);
                nameMap.set(names.length - 1, name);
                map.set(thisUrl.toLowerCase(), names.length - 1);
                inLink.push(new Set());
                outLink.push(new Set());


                var content = '.mw-parser-output';

                $('a', content).each(function (i, el) {
                    if (!$(this).attr("class:contains('image')")
                        && $(this).attr('href')) {
                        var toadd = $(this).attr('href');
                        if (toadd.includes('/wiki/')
                            && !toadd.includes(':')
                            && !toadd.includes('/File')
                            && !toadd.includes('#')) {

                            if (nextLevel <= maxLevel) {
                                var urlToAdd = toadd.includes('https://en.wikipedia.org') ? toadd : 'https://en.wikipedia.org' + toadd;
                                todo.push([urlToAdd, map.get(thisUrl.toLowerCase()), nextLevel]);

                            }
                        }
                    }
                });

                name = name.replace(/[\\*?:"<>|]/g, function (x) {
                    return x.charCodeAt(0);
                });
                // console.log(name);
                var filename = './dfsDownloads/' + name.toLowerCase() + '.txt';
                fs.writeFileSync(filename, body);
                URLs.push(thisUrl);
            }

            var thisIndex = map.get(thisUrl.toLowerCase());
            inLink[thisIndex].add(nameMap.get(parentIndex)); // put the name of parent in inlink
            outLink[parentIndex].add(nameMap.get(thisIndex));
            
            next();
        }
    });

}


function next() {
    if (todo.length > 0 && URLs.length < maxCrawlPageNum) {
        console.log(URLs.length);
        console.log(todo.length);
        setTimeout(crawl, pauseTime);
    } else {
        outputURLs();
    }
}

function outputURLs() {
    console.log(inLink);
    var outURLs = fs.createWriteStream('./dfsURLs.txt');
    URLs.forEach(function (p1, p2, p3) {
        outURLs.write(p1 + "\r\n");
    });
    //
    // var outIndex = fs.createWriteStream('./dfsIndex.txt');
    // map.forEach(function (value, key, map) {
    //     var arr = key.split('/');
    //     var name = arr[arr.length - 1];
    //     outIndex.write(key + " " + name + "\r\n");
    //
    // });
    //
    // var dfsInLink = fs.createWriteStream('./dfsInLink.txt');
    // for (var i = 0; i < inLink.length; i++) {
    //     dfsInLink.write("| " + names[i] + " ");
    //     inLink[i].forEach (function (value, p1, p2) {
    //         dfsInLink.write(value + " ");
    //     });
    //     dfsInLink.write('\r\n');
    // }
    //
    // var dfsOutLink = fs.createWriteStream('./dfsOutLink.txt');
    // for (var i = 0; i < outLink.length; i++) {
    //     dfsOutLink.write("| " + names[i] + " ");
    //     outLink[i].forEach (function (value, p1, p2) {
    //         dfsOutLink.write(value + " ");
    //     });
    //     dfsOutLink.write('\r\n');
    // }
    
    console.log('Finished XD');
}

crawl();
