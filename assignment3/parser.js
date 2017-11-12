var path = require('path');
var request = require('request');
var cheerio = require('cheerio');
var fs = require('fs');


var outDir = './task1/';
var rawFileDir = './downloads/';
// var rawFileDir = '';
var htmlFile = 'crawledURLs.txt';
var htmlString = fs.readFileSync (htmlFile, 'utf-8', function(err, data) {
    return data;
});
var htmls = htmlString.split(" ");
htmls.pop(); // remove last empty element


parse(htmls);

function parse(htmls) {
    var choice = setUpChoice();

    var names = [];
    for (var i = 0; i < htmls.length; i++) {
    // i = 1;
        var tempArr = htmls[i].split('/');
        var name = tempArr[tempArr.length - 1];
        // var name = 'test';
        console.log(i + " " + name);
        var rawHtml = fs.readFileSync(rawFileDir + name + '.txt', 'utf-8', function (err, dat) {
            return data;
        });
        var $ = cheerio.load(rawHtml);
        names.push(name);
        var outFilename = outDir + names.length + '.txt';
        var content = '.mw-parser-output';
        $('<h3> </h3>')
            .insertAfter('p')
            .insertBefore('p');
        $('<p> </p>')
            .insertAfter('h2')
            .insertAfter('img');
            // .insertAfter('table');

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
        $('.mw-editsection').remove();
        // console.log($(content).html());

        var text = $(content).children().first().text();
        text += $(content).children().first().nextUntil('.reflist').text();
        text = $('h1').text() + ' ' + text;
        // Write articles to file until the reference part of the page
        if (choice[0] === 'Y') {
            text = caseFolding(text);
        }
        if (choice[1] === 'Y') {
            text = removePunctuation(text);
        }
        fs.writeFileSync(outFilename, text);
    }
    outputNameMap(names);
}


// Output the mapping from 1-1000 to actual file title name
function outputNameMap(names) {
    var outFileName = 'fileNameMap.txt';
    for (var i = 0; i < names.length; i++) {
        fs.appendFileSync(outFileName, (i + 1) + " " + names[i] + "\r\n");
    }
}

// Read the option of case-folding and punctionation handling
function setUpChoice() {
    var rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });


    var res = [];

    rl.question('Do you want use the default choice of case-folding and punctuation handling (both yes) ? (Y / N) \n', function(answer) {
        if (answer === 'Y') {
            res.push('Y');
            res.push('Y');
            rl.close();
            return res;
        } else {
            rl.question('Do you want to perform case-folding ? (Y / N) \n', function(answer) {
                res.push(answer);
                rl.close();
                rl = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });
                rl.question('Do you want to perform punctuation handling? (Y / N) \n', function(answer) {
                    res.push(answer);
                    rl.close();

                    return res;
                });
            });
        }
    });

}

function caseFolding(text) {
    return text.toLowerCase();
}

function removePunctuation(text) {
    text = text.replace(/\(\/.*?\/\)/g, "") // remove soundmark
        .replace(/[^\w\s\/.\-°']|_/g, " ") // remove punctuation except / , . ° ' -
        .replace(/\./g, function (match, offset, string) {
            if (offset === 0
                || string[offset - 1].match(/[^0-9a-zA-Z]/) !== null
                || offset >= (string.length - 1)
                || string[offset + 1].match(/[^0-9a-zA-Z]/) !== null) {
                    return " "; // remove dot at the end of a sentence
                } else if (string[offset - 1].match(/[a-zA-Z]/) !== null
                    && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                    return "";
                // remove the dot inside a word like e.g and combine the characters together (-> eg)
                } else {
                    return ".";
                    // keep the dot inside a decimal
            }

            })
        .replace(/,/g, function (match, offset, string) {
            if (offset === 0
                || string[offset - 1].match(/[^0-9]/) !== null
                || offset >= (string.length - 1)
                || string[offset + 1].match(/[^0-9]/) !== null) {
                return " ";
            } else {
                return ",";
            } // remove comma at the middle of a sentence, retain , within digits
        })
        .replace(/'/g, function (match, offset, string) {
            if (offset > 0
                && string[offset - 1].match(/[a-zA-Z]/) !== null
                && offset < (string.length - 1)
                && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                return "";
            } else {
                return " ";
            }
        }) // handling she's this kind of special case (->shes)
        .replace(/-/g, function (match, offset, string) {
            if (offset === 0
                || string[offset - 1].match(/[^ a-zA-Z]/) !== null
                || offset >= (string.length - 1)
                || string[offset + 1].match(/[^0-9a-zA-Z]/) !== null) {
                return " ";
            } else {
                return "-";
            }
        }) // handling - as the negative symbol
        .replace(/\//g, function (match, offset, string) {
            if (offset > 0
                && string[offset - 1].match(/[a-zA-Z]/) !== null
                && offset < (string.length - 1)
                && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                return "";
            } else {
                return " ";
            }
        })
        .replace(/°/g, function (match, offset, string) {
            if (offset > 0 && string[offset - 1] === " "
                && offset < (string.length - 1)
                && string[offset + 1].match(/[a-zA-Z]/) !== null) {
                return "°";
            } else {
                return " ";
            }
        })
        .replace(/\s+/g, " ");
    return text;
}