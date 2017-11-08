var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');

var outDir = './task1/';
var rawFileDir = './downloads/';
var htmlFile = 'crawledURLs.txt';
var htmlString = fs.readFileSync (htmlFile, 'utf-8', function(err, data) {
    return data;
});
var htmls = htmlString.split(" ");
htmls.pop(); // remove last empty element



function parse(htmls) {
    var names = [];
    for (var i = 0; i < htmls.length; i++) {
        var tempArr = htmls[i].split('/');
        var name = tempArr[tempArr.length - 1];
        console.log(i + " " + name);
        var rawHtml = fs.readFileSync(rawFileDir + name + '.txt', 'utf-8', function (err, dat) {
            return data;
        });
        var $ = cheerio.load(rawHtml);
        names.push(name);
        var outFilename = outDir + names.length + '.txt';
        var content = '.mw-parser-output';
        $('.reference').remove(); // remove [1] this kind of reference to reference part in the page
        $('table').remove(); // Remove table
        $('.navigation-not-searchable').remove(); // Remove not searchable navigations
        $('.vertical-navbox').remove(); // Remove navigation
        $('img').remove(); // Remove images
        $('.mwe-math-element').remove(); // Remove formulas
        $('#toc').remove();
        $('#See_also').parent().next().remove();
        $('#See_also').parent().remove();
        $('#References').parent().remove();
        var text = $(content).children().first().nextUntil('.reflist').text();
        // Write articles to file until the reference part of the page
        text = caseFolding(text);
        text = removePunctuation(text);
        fs.writeFileSync(outFilename, text);

    }
    outputNameMap(names);
}

function outputNameMap(names) {
    var outFileName = 'fileNameMap.txt';
    for (var i = 0; i < names.length; i++) {
        fs.appendFileSync(outFileName, (i + 1) + " " + names[i] + "\r\n");
    }
}

function caseFolding(text) {
    return text.toLowerCase();
}

function removePunctuation(text) {
    text = text.replace(/\(\/.*?\/\)/g, "") // remove soundmark
        .replace(/[^\w\s\/,.\-°']|_/g, " ") // remove punctuation except / , . ° ' -
        .replace(/, /g, " ")
        .replace(/\./g, function (match, offset, string) {
            if (string[offset - 1].match(/[^0-9]/) !== null
                || offset >= (string.length - 1)
                || string[offset + 1].match(/[^0-9]/) !== null) {
                return " ";
            } else {
                return ".";
            } // remove dot at the end of a sentence
        })
        .replace(/,/g, function (match, offset, string) {
            if (string[offset - 1].match(/[a-zA-Z]/) !== null
                && offset >= (string.length - 1)
                && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                return "'";
            } else {
                return " ";
            }
        })
        .replace(/-/g, function (match, offset, string) {
            if (string[offset - 1].match(/[^ ]/) !== null
                || offset >= (string.length - 1)
                || string[offset + 1].match(/[^0-9]/) !== null) {
                return " ";
            } else {
                return "-";
            }
        })
        .replace(/\//g, function (match, offset, string) {
            if (string[offset - 1].match(/[a-zA-Z]/) !== null
                && offset >= (string.length - 1)
                && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                return "/";
            } else {
                return " ";
            }
        })
        .replace(/\s+/g, " ");
    return text;
}

parse(htmls);
