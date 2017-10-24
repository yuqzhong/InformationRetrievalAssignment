var path = require('path');
var request = require('request');
var promise = require('request-promise');
var cheerio = require('cheerio');
var fs = require('fs');

var pauseTime = 100;

var urlFileName = 'crawledURLs.txt';
var urlStr = "";

var inLink = [];
var outLink = [];
var map = new Map();
var nameMap = new Map();
var todo = [];
var toFind = [];
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
    todo = urlStr.split(" ");
    // pop last empty string
    todo.pop();

    // urls = urlStr.split(" ");


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
                        // var waiting = 1;
                        var out = map.get(outUrl.toLowerCase());
                        // console.log(outUrl);
                        if (out !== undefined && out !== index) {
                            inLink[out].add(nameMap.get(index));
                            outLink[index].add(nameMap.get(out));
                            // waiting--;
                        }
                        // else if (out === undefined) {
                        //    toFind.push([outUrl, index]);
                            // request(outUrl, function (err, response, body) {
                            //     var $ = cheerio.load(body);
                            //     outUrl = $('link[rel=canonical]').attr('href');
                            //     console.log('-------------------hah---------');
                            //     out = map.get(outUrl.toLowerCase());
                            //     if (out !== undefined && out !== index) {
                            //         inLink[out].add(index + 1);
                            //         outLink[index].add(out + 1);
                            //     }
                            //     // waiting--;
                            //
                            // })
                        // }
                        // } else  {
                        //     waiting--;
                        // }
                        // console.log(waiting);
                        // if (waiting > 0) {
                        //     setTimeout(function (args) { console.log('paused') },1000);
                        // }
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


    if (todo.length > 990) {
        setTimeout(createMap, pauseTime);
    } else {
        finish();
    }
}

function finish() {
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
    console.log('Finished! OvO');
}


//
// function dealWithToFind() {
//     var pair = toFind.pop();
//     var url = pair[0];
//     var index = pair[1];
//     console.log(url);
//     request(url, function (err, response, body) {
//         if (err) {
//             console.log(err);
//         } else if (response.statusCode === 200 && body) {
//             var $ = cheerio.load(body);
//             var outUrl = $('link[rel=canonical]').attr('href');
//             // console.log('-------------------hah---------');
//             var out = map.get(outUrl.toLowerCase());
//             if (out !== undefined && out !== index) {
//                 inLink[out].add(index + 1);
//                 outLink[index].add(out + 1);
//             }
//         }
//         dealGoNext();
//     });
// }
//
// function dealGoNext() {
//     console.log('toFind length is' + toFind.length);
//     if (toFind.length > 0) {
//         setTimeout(dealWithToFind, pauseTime);
//     } else {
//         finish();
//     }
// }







