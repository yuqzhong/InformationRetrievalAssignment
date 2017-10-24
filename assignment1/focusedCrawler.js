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

todo.push([seed, '', 1]);


function crawl() {
    var combo = undefined;
    if (ptodo.length !== 0)
        combo = ptodo.shift();
    else
        combo = todo.shift();

    console.log(combo);
    var url = combo[0];
    var level = combo[2];
    var nextLevel = level + 1;
    var lowerURL = url.toLowerCase();
    //download the html

    if (!visited.has(lowerURL)) {
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

                    var flag = containsKeyword(thisUrl.toLowerCase(), combo[1]);
                    $('a', content).each(function (i, el) {
                        if (!$(this).attr("class:contains('image')")
                            && $(this).attr('href')) {
                            var toadd = $(this).attr('href');
                            var anchor = $(this).attr('title');
                            if (toadd.includes('/wiki/')
                                && !toadd.includes(':')
                                && !toadd.includes('/File')
                                && !toadd.includes('#')) {

                                if (nextLevel <= maxLevel) {
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
                    if (containsKeyword(thisUrl, anchor)) {
                        //language=JSRegexp
                        var name = thisUrl.split('/');
                        name = name[name.length - 1];

                        name = name.replace(/[\\*?:"<>|]/g, function (x) {
                            return x.charCodeAt(0);
                        });
                        console.log(name);
                        var filename = './focusedDownloads/' + name.toLowerCase() + '.txt';
                        fs.writeFileSync(filename, body);
                        URLs.push(thisUrl);
                    }
                    afterFunction();
                } else {
                    afterFunction();
                }
            }
        });
    }

    else {
        if ((todo.length > 0 || ptodo.length > 0) && URLs.length < maxCrawlPageNum) {
            console.log(URLs.length);
            console.log(ptodo.length);
            console.log(todo.length);
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
    if ((todo.length > 0 || ptodo.length > 0) && URLs.length < maxCrawlPageNum) {
        console.log(URLs.length);
        console.log(ptodo.length);
        console.log(todo.length);
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
