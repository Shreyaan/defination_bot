// bot.js

const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const parser = require("./parser.js");

require("dotenv").config();

const filePath = "./words.csv";

const csv = require("csv-parser");
const fs = require("fs");
const results = [];

const express = require("express");
const bodyParser = require("body-parser");
const { json } = require("body-parser");
const app = express();

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min); //The maximum is exclusive and the minimum is inclusive
}

function urbanDic(msg, match) {
  const chatId = msg.chat.id;
  const word = match[1];
  let numberOfDef;
  axios;

  var options = {
    method: "GET",
    url: "https://mashape-community-urban-dictionary.p.rapidapi.com/define",
    params: { term: word },
    headers: {
      "x-rapidapi-host": "mashape-community-urban-dictionary.p.rapidapi.com",
      "x-rapidapi-key": RapidApitoken,
    },
  };

  axios
    .request(options)
    .then(function (response) {
      let responseData = response.data;
      let defination = responseData["list"][0]["definition"];
      let example = responseData["list"][0]["example"];

      if (numberOfDef == null || numberOfDef == undefined) {
        bot.sendMessage(
          chatId,
          `Word: ${word}

${responseData["list"].length} definition(s) found for the word

DEFINITION: ${defination}

Example: ${example}


You can see other definitions here: https://www.urbandictionary.com/define.php?term=${encodeURI(
            word
          )}

          
    `
        );
      } else {
        numberOfDef = parseInt(numberOfDef);
        bot.sendMessage(
          chatId,
          `Word: ${word}
${responseData["list"].length} definition(s) found for the word

DEFINITION: ${responseData["list"][++numberOfDef]["definition"]}

Example: ${example}


    `
        );
      }
    })
    .catch(function (error) {
      console.log(error);
      bot.sendMessage(
        chatId,
        `Sorry no definition found in Urban Dictionary😞😞


Trying MERRIAM-WEBSTER'S DICTIONARY but be warned its not polished xdddddd
        `

      );

      let config = {
        method: 'get',
        url: `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${mdapi}`,
        headers: { }
      };
      
      axios(config)
      .then((response) => {
        let meaning = JSON.stringify(response.data[0]["def"][0])

        console.log(response.data[0]["def"])
        console.log(meaning)
        bot.sendMessage(
                    chatId,
                    `Word: ${word}
            
            ${meaning}
            
         
                     `
                  );
      })
      .catch((error) => {
        bot.sendMessage(
          chatId,
          `Sorry no definition found😞😞
 ${error}
          `
  
        );
  
        let config = {
          method: 'get',
          url: `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${mdapi}`,
          headers: { }
        };
      });


    });
}

const token = process.env.TELEGRAM_TOKEN;
const RapidApitoken = process.env.rapid;
const mdapi = process.env.mdapi;
let bot;

if (process.env.NODE_ENV === "production") {
  bot = new TelegramBot(token);
  bot.setWebHook(process.env.HEROKU_URL + bot.token);
} else {
  bot = new TelegramBot(token, { polling: true });
}

// Start command
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `/word - send /word plus the word whose definition you want
    
/random- send this to get definition of a random word

/urban- get definition from Urban Dictionary`
  );
});

// Matches "/word whatever"
bot.onText(/\/word (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const word = match[1];
  axios;

  var options = {
    method: "GET",
    url: `https://wordsapiv1.p.rapidapi.com/words/${word}/definitions`,
    headers: {
      "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
      "x-rapidapi-key": RapidApitoken,
    },
  };

  axios
    .request(options)
    .then(function (response) {
      let responseData = response.data;
      let wordResponse = responseData["word"];

      let definationString = "";

      responseData["definitions"].forEach((element, index) => {
        definationString += `
${++index}:
CATEGORY: ${element.partOfSpeech}
DEFINITION:${element.definition}

        `;
      });

      if (responseData["definitions"].length <= 0) {
        bot.sendMessage(
          chatId,
          `Sorry no definition found 😞😞

          Trying Urban Dictionary
          `
        );

        urbanDic(msg, match);
      } else {
        bot.sendMessage(
          chatId,
          `Word: ${wordResponse}
  
  ${responseData["definitions"].length} definition(s) found for the word
  
  Definition(s): ${definationString}
           `
        );
      }
    })
    .catch(function (error) {
      if (error.response.status == 404) {
        bot.sendMessage(
          chatId,
          `Sorry no definition found 😞😞

          Trying Urban Dictionary
          `
        );
        urbanDic(msg, match);
      } else {
        bot.sendMessage(
          chatId,
          `there has been an unexpected error
${error} 
please contact dev at @bruh7814
      `
        );
      }
    });
});

//gets word from Urban Dictionary
bot.onText(/\/urban (.+)/, (msg, match) => {
  urbanDic(msg, match);
});

// gives random word
bot.onText(/\/random/, (msg) => {
  let lineNo = getRandomInt(0, 5348);
  let randomWord;
  let randomWordDef;

  fs.createReadStream("words.csv")
    .pipe(csv({ separator: "\t" }))
    .on("data", (data) => results.push(data))
    .on("end", () => {
      randomWord = results[lineNo]["word"];
      randomWordDef = results[lineNo]["definition"];
      bot.sendMessage(
        msg.chat.id,
        `Random Word:
${randomWord}
  
Definition:
${randomWordDef}`
      );
    });
});

app.use(bodyParser.json());

app.listen(process.env.PORT);

app.post("/" + bot.token, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});
