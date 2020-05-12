const fetch = require('node-fetch');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');
const Database = require('./database');

const wordExists = (word) => {
    return new Promise((resolve, reject) => {
        Database.pool.query("SELECT word FROM spanish_words WHERE unaccented_word = $1", [word], (error, results) => {
            if (error) {
                console.log("word doesn't exist:", word);
                reject(error)
            }
            //console.log("word exists:", word);
            resolve(results.rows[0]);
        })
    })
    .catch((err) => { 
        console.log(err);
    })
}

const insertWord = (word, source) => {
    return new Promise((resolve, reject) => {
        //console.log("insertWord:", word, source);
        Database.pool.query('INSERT INTO spanish_words ("word", "source", "unaccented_word") VALUES ($1, $2, remove_accents($1)) RETURNING word', 
        [word, source], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            else {
                if (results && results.rows[0]) {
                    resolve(results.rows[0]);
                }
                resolve();
            }
            //resolve(results.rows[0]);
        });
    })
    .catch((err) => { 
        //console.log(err);
    })
}

const calcWordScore = (word) => {
    let wordLength = word.length;
    if (wordLength <= 3) return 2;
    if (wordLength <= 5) return 5;
    if (wordLength <= 7) return 11;
    if (wordLength <= 9) return 15;
    else return 20;
}

const registerPlayerWord = (board_id, player, word, score) => {
    return new Promise((resolve, reject) => {
        Database.pool.query('INSERT INTO player_board (board_id, player, word, score) VALUES ($1, $2, $3, $4) RETURNING word, score', 
        [board_id, player, word, score], 
        (error, results) => {
            if (error) {
                reject(error)
            }
            resolve(results.rows[0]);
        });
    })
    .catch((err) => { 
        console.log(err);
    })
}

const normalizeStr = (str) => {
    //return (str.trim() && str.trim().length > 0) ? str.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
    return (str.trim() && str.trim().length > 0) ? str.trim().toLowerCase().replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i").replace(/ó/g,"o").replace(/ú/g,"u") : "";
}

const prepareForDB = (str) => {
    return str.trim().toLowerCase();
}

const scrapeRAEResults = (htmlContent, word, learningModeON = false) => {
    word = normalizeStr(word);
    const $ = cheerio.load(htmlContent);
    let header = $("header.f").first();
    const headerRgxp = /^[A-Za-zÀ-ÖØ-öø-ÿ]+\,\s[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
    const wordRgxp = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}$/;
    const terminations = ["es", "a", "s"];
    const terminationsRgxp = new RegExp(`(${terminations.join("|")})$`, "g");
    let normalized = "";
    
    console.log("scrapeRAEResults:", word);
    
    if (header && header.length > 0) {
        header.find("sup").remove();
        //normalized = normalizeStr(header.text().replace("-",""));
        normalized = normalizeStr(header.text());
        
        if (normalized.includes("-")) {
            console.log("Found word, but it contains '-':", normalized);
            return "not found";
        }
        
        console.log("Header check");
        if (normalized === word) {
            console.log("Header check (SUCCESS):", normalized, word);
            return prepareForDB(header.text());
        }
        else {
            console.log("Terminations check");
            if (terminationsRgxp.test(word)) { //could be a plural - Example: cañones
                for (let temination of terminations) {
                    if (word.endsWith(temination)) {
                        console.log("Checking termination:", word, normalized + temination);
                        if (word === (normalized + temination)) {
                            result = (normalized + temination);
                            console.log("Terminations check (SUCCESS):", result);
                            return result;
                        }
                    }
                }
            }
            if (headerRgxp.test(normalized)) {
                console.log("Special header check");
                const normalized_op1 = normalized.split(',')[0].trim();
                const temp = normalized.split(',')[1].trim();
                const normalized_op2 = normalized_op1.substring(0, normalized_op1.length - temp.length) + temp;
                
                if ([normalized_op1, normalized_op2].includes(word)) {
                    if (normalized === word) { 
                        result = header.text().trim().toLowerCase();
                        console.log("Special header check 1(SUCCESS):", result);
                        return result;
                    }
                    if (normalized_op1 === word) { 
                        result = header.text().split(',')[0].trim().toLowerCase();
                        console.log("Special header check 2 (SUCCESS):", result);
                        return result;
                    }
                    if (normalized_op2 === word) { 
                        let str1 = header.text().split(',')[0].trim().toLowerCase();
                        let str2 = header.text().split(',')[1].trim().toLowerCase();
                        result = str1.substring(0, str1.length - str2.length) + str2;
                        console.log("Special header check 3 (SUCCESS):", result);
                        return result;
                    }
                }
            }
            const tdNodes = $("#conjugacion td");
            if (tdNodes && tdNodes.length > 0) {
                console.log("Conjugation check");
                let result = "not found";
                let txt = "";
                let splitContent = "";
                let newWords = [];
                tdNodes.each(async function() {
                    splitContent = $(this).text().split(/[\s,\/]+/);
                    for (let content of splitContent) {
                        content = prepareForDB(content);
                        if (wordRgxp.test(content)) {
                            if (learningModeON) { //learn from the additional extracted content
                                if (normalizeStr(content) !== word) {
                                    newWords.push(content);
                                }
                            }
                            txt = normalizeStr(content);
                            if (txt === word && result === "not found") {
                                result = content;
                                console.log("Conjugation check (SUCCESS):", result);
                            }
                        }
                    }
                });
                if (learningModeON && newWords.length > 0) {
                    learn(newWords);
                }
                return result;
            }
        }
    }
    else {
        const relatedEntries = $(".item-list .n1, .otras .n1");
        if (relatedEntries && relatedEntries.length > 0) {
            console.log("Related entries check");
            let txt = "";
            let result = "not found";
            let splitContent = "";
            
            relatedEntries.each(function() {
                $(this).find("sup").remove();
                splitContent = $(this).text().replace("-","").split(/[\(\)\s,\/]+/);
                for (let content of splitContent) {
                    content = prepareForDB(content);
                    console.log("relatedEntry:", content);
                    normalized = normalizeStr(content);
                    
                    if (normalized === word) {
                        console.log("entry full match:", word, normalized);
                        result = content;
                        console.log("Related entries check (SUCCESS):", result);
                        return false;
                    }
                    /*else {
                        for (let temination of terminations) {
                            if (word.endsWith(temination)) { //could be a plural - Example: ratones
                                console.log("checking termination:", word, normalized + temination);
                                if (word === (normalized + temination)) {
                                    result = (normalized + temination);
                                    console.log("Related entries check (SUCCESS):", result);
                                    return false;
                                }
                            }
                        }
                    }*/
                }
            });
            return result;
        }
    }
    
    return "not found";
}

const scrapeWordReferenceResults = (htmlContent, word, learningModeON = false) => {
    const $ = cheerio.load(htmlContent);
    const headerRgxp = /^[A-Za-zÀ-ÖØ-öø-ÿ]+\,\s[A-Za-zÀ-ÖØ-öø-ÿ]+$/;
    const wordRgxp = /^[A-Za-zÀ-ÖØ-öø-ÿ]{2,}$/;
    
    console.log(`Scraping wordreference.com: ${word}`);
    
    const headerWord = $(".headerWord");
    let result = "not found";
    
    if (headerWord && headerWord.length > 0 && headerWord.text() === word) {
        
        const noEntryFound = $("#noEntryFound");
        
        if (!noEntryFound || noEntryFound.length === 0) {
            let content = '';
            let uniqueWords = [];
            
            //remove elements that won't be needed
            $("#footerlink").remove();
            $("#listen_widget").remove();
            $("script").remove();
            $("#dummyspan").remove();
            $("br").remove();
            $("strong").remove();
            $("#forumNotes").remove();
            $("#WHlinks").remove();
            $("#strAnchors").remove();
            $(".headerWord").remove();
            $("div").remove();
            
            content = $.text();
            content = content.replace(/\s/g, '');
            
            if (content && content.length > 0) {
                console.log(`The word '${headerWord.text()}' was found!`);
                result = prepareForDB(headerWord.text());
            
                content = content.replace(/de''/g, '');
                content = content.replace(/^\(.*?\):/, '');
                content = content.replace(/\(.*?\):/g, ',');
                content = content.replace(/^.*?:/, '');
                content = content.replace(/,.*?:/g, ',');
                
                for (const aWord of content.split(',')) {
                    if (!uniqueWords.includes(aWord) && wordRgxp.test(aWord)) {
                        uniqueWords.push(prepareForDB(aWord));
                    }
                }
                
                //console.log("RESULT:", uniqueWords.join(','));
                //return [word, ...uniqueWords];
                
                if (learningModeON && uniqueWords.length > 0) {
                    learn(uniqueWords);
                }
            }
        }
    }
    
    return result;
}

const learn = async (newWords = []) => {
    if (newWords && newWords.length > 0) {
        for (const word of newWords) {
            const wordExistsRES = await wordExists(word);
            if (!wordExistsRES) { //the word doesn't exist
                const insertRES = await insertWord(word, "rae");
                if (insertRES) { //word insercion was successful
                    console.log("Learnt a new word:", word);
                }
            }
        }
    }
}

const consultExternalDic = async (dic, word) => {
    const urlRAE = 'https://dle.rae.es/';
    const urlWordReference = 'https://www.wordreference.com/definicion/';
    let url = (dic === 'rae') ? urlRAE : urlWordReference;
    url = url + encodeURIComponent(word);
    
    try{
        const browser = await puppeteer.launch({
            args: [
                '--disable-gpu',
                '--disable-dev-shm-usage',
                '--disable-setuid-sandbox',
                '--no-first-run',
                '--no-sandbox',
                '--no-zygote',
                '--single-process',
           ]
        });
        const page = await browser.newPage();
        page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36");
        await page.goto(url);
        let html = (dic === 'rae') ? await page.$eval("#resultados", e => e.innerHTML) : await page.$eval("#articleHead", e => e.innerHTML);
        browser.close();
        return html;
    }
    catch(err) {
        console.log(err);
    }
}

const consultExternalDics = async (request, response) => {
    const board_id = request.params.board_id;
    const player = request.params.player;
    const word = request.params.word;
    
    let results = "";
    let result = "";
    let html = null;
    let insertRes = null;
    
    console.log("consultExternalDics:", word);
    
    html = await consultExternalDic("rae", word);
    if (html) {
        result = scrapeRAEResults(html, word, true);
        if (result !== "not found") {
            const wordInDB = await wordExists(result);
            if (!wordInDB) {
                insertRes = await insertWord(result, "rae");
                if (insertRes) {
                    console.log("insertRes:", insertRes);
                    const wordScore = calcWordScore(word);
                    const playerWordRes = await registerPlayerWord(board_id, player, word, wordScore);
                    if (playerWordRes) {
                        response.writeHead(200, {"Content-Type": "application/json"});
                        response.end(JSON.stringify({ ...insertRes, score: wordScore }));
                    }
                    else {
                        response.writeHead(404, {"Content-Type": "application/json"});
                        response.end(JSON.stringify({ err: "error at registering player, word and score" }));
                    }
                }
                else {
                    response.writeHead(404, {"Content-Type": "application/json"});
                    response.end(JSON.stringify({ err: "error at insertion" }));
                }
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: "word already exists" }));
            }
        }
        else {
            html = await consultExternalDic("wordreference", word);
            if (html) {
                result = scrapeWordReferenceResults(html, word, true);
                if (result !== "not found") {
                    const wordInDB = await wordExists(result);
                    if (!wordInDB) {
                        insertRes = await insertWord(result, "wordreference");
                        if (insertRes) {
                            console.log("insertRes:", insertRes);
                            const wordScore = calcWordScore(word);
                            const playerWordRes = await registerPlayerWord(board_id, player, word, wordScore);
                            if (playerWordRes) {
                                response.writeHead(200, {"Content-Type": "application/json"});
                                response.end(JSON.stringify({ ...insertRes, score: wordScore }));
                            }
                            else {
                                response.writeHead(404, {"Content-Type": "application/json"});
                                response.end(JSON.stringify({ err: "error at registering player, word and score" }));
                            }
                        }
                        else {
                            response.writeHead(404, {"Content-Type": "application/json"});
                            response.end(JSON.stringify({ err: "error at insertion" }));
                        }
                    }
                    else {
                        response.writeHead(404, {"Content-Type": "application/json"});
                        response.end(JSON.stringify({ err: "word already exists" }));
                    }
                }
                else {
                    response.writeHead(404, {"Content-Type": "application/json"});
                    response.end(JSON.stringify({ err: "not found" }));
                }
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: "not found" }));
            }
        }
    }
    else {
        response.writeHead(404, {"Content-Type": "application/json"});
        response.end(JSON.stringify({ err: "not found" }));
    }
}

const checkWord = (request, response) => {
    const board_id = request.params.board_id;
    const player = request.params.player;
    const word = request.params.word;
    wordExists(word)
    .then(async (res) => {
        if (res) {
            const wordScore = calcWordScore(word);
            const playerWordRes = await registerPlayerWord(board_id, player, word, wordScore);
            if (playerWordRes) {
                response.writeHead(200, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ ...res, score: wordScore }));
            }
            else {
                response.writeHead(404, {"Content-Type": "application/json"});
                response.end(JSON.stringify({ err: "error at registering player, word and score" }));
            }
        }
        else {
            response.writeHead(206, {"Content-Type": "application/json"});
            response.end(JSON.stringify({ msg: "consult-external-dic"}));
        }
    })
    .catch((err) => { 
        console.log(err);
        response.writeHead(404, {"Content-Type": "application/json"});
        response.end(JSON.stringify({ err }));
    })
}

module.exports = {
    checkWord,
    consultExternalDics
}