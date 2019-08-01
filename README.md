# mai-score-bookmarklet

## ブックマークレット
```
javascript:
(function(d,s){
  let i=location.hostname.indexOf('maimaidx.jp');
  if(i!=-1){
  let g=d.createElement('div');g.id='mai-score-bookmarklet';d.body.appendChild(g);
  let s=d.createElement('script');s.src='//mai-score-bookmarklet.web.app/js/app.js'+'?'+Date.now();d.body.appendChild(s);
  let c=d.createElement('script');c.src='//mai-score-bookmarklet.web.app/js/chunk.js'+'?'+Date.now();d.body.appendChild(c);
  let a=d.createElement('link');a.href='//mai-score-bookmarklet.web.app/css/app.css'+'?'+Date.now();a.rel="stylesheet";a.type="text/css";d.body.appendChild(a);
  }else{
  if(confirm('maimaiでらっくすNETを開きますか？')){
  window.open('https://maimaidx.jp');
  }
  }
})(document)
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Run your tests
```
npm run test
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
