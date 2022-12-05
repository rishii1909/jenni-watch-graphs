# Site URL
`https://rishii1909.github.io/jenni-watch-graphs/`
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


