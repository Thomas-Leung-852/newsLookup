/*
Created By: Thomas Leung
Date: 2021/06/12
Description: search news website by keywords 
Usage: node index.js "Hong Kong, Chow"

Useful link
 https://www.w3schools.com/charsets/ref_emoji.asp
*/


class myError extends Error {
    constructor(message) {
    super(message); 
    this.url = ""; 
    }
  }

const request = require("request");
const JSSoup = require('jssoup').default;
const xlsx = require('xlsx');

const zeroPad = (num, places) => String(num).padStart(places, '0')

if(process.argv.length<=2)
{
    console.log("Search by keywords [Only match the keywords]:\t node index.js \"keyword1,keyword2,... \" ");
    console.log("Search by keywords [Return all results]:\t node index.js \"keyword1,keyword2,... \" -all ");
    console.log("Get news website urls:\t node index.js -geturl {URL} ");
    console.log("example:\t\t node index.js -geturl \"https://www.w3newspapers.com/newssites/\" ");
    return
}
 
const prepareSummaey = (aSiteFound) =>{
    console.log("Finished!")
    console.log("%s site found the keywords.", aSiteFound)
    process.exit(0)
}

const doSearch = async () => {
    const SITES_LIST_FILE_NAME = "sitesList.xlsx";
    var keywords = [];
    var keywordStr = process.argv[2]
    keywords = keywordStr.split(",");

    const workbook = xlsx.readFile(SITES_LIST_FILE_NAME);
    const worksheets = workbook.Sheets[workbook.SheetNames[0]];

    var emoji = ""
    var totCnt = 0
    var cnt = 0
    var urls = []
    var siteFound = 0

    for (let wrkSht in worksheets) {
        if(wrkSht.toString()[0] === 'A' && worksheets[wrkSht].v.length > 0){
            totCnt++
            urls.push(worksheets[wrkSht].v)
        }
    }

    if(totCnt > 0){ totCnt-- }

    urls.sort()

    console.log("===============================================")
    console.log("%s : Keywords found.", "\u{2705}")
    console.log("%s : Keywords NOT found.", "\u{274C}")
    console.log("%s : Invalid Url.", "\u{2757}")
    console.log("===============================================")

    for(i=0; i<urls.length; i++){
            searchByUrl("",urls[i], keywords, true).then(elm=> { 

                if(elm.site[0].kwFound == "Found" || elm.site[0].kwFound == "Not Found"){
                    
                    if(process.argv[3] === "-all"){
                        emoji = (elm.site[0].kwFound == "Found" ? "\u{2705}" : "\u{274C}")
                        siteFound = siteFound + (elm.site[0].kwFound == "Found" ? 1 : 0)
                        console.log("[%s/%d] %s %s", zeroPad(++cnt, 3), totCnt, emoji, elm.site[0].url);
                    }else if(elm.site[0].kwFound == "Found"){
                        emoji = "\u{2705}"
                        siteFound = siteFound + 1
                        console.log("[%s/%d] %s %s", zeroPad(++cnt, 3), totCnt, emoji, elm.site[0].url);
                    }
                }

                if(cnt >= totCnt){
                    prepareSummaey(siteFound)
                }

            }).catch(err => { 
                console.log("[%s/%d] %s %s", zeroPad(++cnt,3), totCnt, "\u{2757}", err.url);
                if(cnt >= totCnt){
                    prepareSummaey(siteFound)
                }
            });
    }
};

if(process.argv[2] === "-geturl"){
    if(process.argv.length<4){
        console.log("usage: node index.js geturl {URL} ");
        return
    }

    getNewsSiteUrl(process.argv[3]);
}else{
    ( ()=>{
        doSearch();
        return 0;
    })();
}

function getNewsSiteUrl(aSiteUrl){
    request({uri: aSiteUrl}, 
    function(error, response, body) {
        var soup = new JSSoup(body);
        var tags = soup.findAll('a');
    
        for(var idx in tags){
           
            if( typeof tags[idx].attrs.href !== 'undefined'){              
                if(tags[idx].attrs.href.indexOf("https") >= 0 && tags[idx].attrs.href.indexOf("www") >= 0){  
                    if(
                        tags[idx].attrs.href != "https://www.facebook.com/sharer.php?u=https://www.w3newspapers.com/newssites/" &&
                        tags[idx].attrs.href != "https://twitter.com/share?url=https://www.w3newspapers.com/newssites/" &&
                        tags[idx].attrs.href != "https://www.facebook.com/w3newspapers" &&
                        tags[idx].attrs.href != "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/advice-for-public" &&
                        tags[idx].attrs.href != "https://www.who.int/emergencies/diseases/novel-coronavirus-2019/donate" &&
                        tags[idx].attrs.href != "https://www.w3newspapers.com" &&
                        tags[idx].attrs.href != "https://www.w3newspapers.com/web/disclaimer/" &&
                        tags[idx].attrs.href.indexOf("www.examiner.com") == -1
                    ){
                        console.log(tags[idx].attrs.href);
                    }                    
                }
            }
        }
    });    
}

//
async function searchByUrl(aSiteName, aUrl, aKeywords, aIsMatchAll){
   
    return new Promise((resolve, reject) => {
        request({uri: aUrl}, 
        function(error, response, body) {

            if(error){
                let e = new myError(error)
                e.url = aUrl
                reject(e)
                return
            }

            try{
                var theSearchRst = "Not Found";

                if (response.statusCode == 200) {
                    theErrFlag = true;
                    theContent = body.toLowerCase();               
    
                    var matchRst = theContent.match(new RegExp(aKeywords.join("|"), "gi")); //g=case sensitive, gi=case insensitive
                    
                    if(matchRst != null){
                        aKeywords.forEach(element => {
                            if( !aIsMatchAll && matchRst.includes(element.toLowerCase()) ){
                                theErrFlag = theErrFlag | true;
                            }else if(aIsMatchAll && !matchRst.includes(element.toLowerCase()) ){
                                theErrFlag = theErrFlag & false;
                            }
                        });
                        
                        theSearchRst = (theErrFlag? "Found" : "Not Found");
                    }    
                }
            }catch(ex){
                let e1 = new myError(ex)
                e1.url = aUrl
                reject(e1)
                return
            }

            var rst = {};
            var key = "site";
            rst[key] = [];
    
            var data = {
                siteName: aSiteName,
                url: aUrl,
                kwFound: theSearchRst
            };

            rst[key].push(data);

            resolve(rst);

      });  //Promise
    });
}

