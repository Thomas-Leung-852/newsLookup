/*
Created By: Thomas Leung
Date: 2021/06/12
Description: search news website by keywords 
Usage: node index.js "Hong Kong, Chow" 
*/
const request = require("request");
const JSSoup = require('jssoup').default;
const xlsx = require('xlsx');

if(process.argv.length<=2)
{
    console.log("Search by keywords:\t node index.js \"keyword1,keyword2,... \" ");
    console.log("Get news website urls:\t node index.js -geturl {URL} ");
    console.log("example:\t\t node index.js -geturl \"https://www.w3newspapers.com/newssites/\" ");
    return
}
 
const doSearch = async () => {
    const SITES_LIST_FILE_NAME = "sitesList.xlsx";
    var keywords = [];
    var keywordStr = process.argv[2]
    keywords = keywordStr.split(",");

    const workbook = xlsx.readFile(SITES_LIST_FILE_NAME);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];

    for (let z in worksheet) {
        if(z.toString()[0] === 'A'){
            searchByUrl("",worksheet[z].v, keywords, true).then(elm=> { 
                if(elm.site[0].kwFound == "Found"){
                    console.log(elm.site[0].url);
                }
            }).catch(err => { console.error(worksheet[z].v + " Fetch Failed!");});
        }
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
                        //console.log(tags[idx].attrs.href +'\t\t'+ tags[idx].nextElement._text);
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
                reject(error);
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
                            if( !aIsMatchAll && matchRst.includes(element.toLowerCase()) )
                            {
                                theErrFlag = theErrFlag | true;
                            }else if(aIsMatchAll && !matchRst.includes(element.toLowerCase()) ){
                                theErrFlag = theErrFlag & false;
                            }
                        });
                        
                        theSearchRst = (theErrFlag? "Found" : "Not Found");
                    }    
                }
 
            }catch(ex){
                reject(ex);
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

