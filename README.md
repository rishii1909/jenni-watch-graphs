# Site URL
https://master--moonlit-semifreddo-a84efc.netlify.app
# Code to scrape Events CSV 

```
var jlimit = 5, jcounter = 0 

var jInterval = setInterval(() => {
    const target = document.querySelector('[elref="loadMoreButton"]')
    if(target){
        target.click();
        jcounter++;
        if (jcounter === jlimit) clearInterval(jInterval)
    }
}, 100);
```


