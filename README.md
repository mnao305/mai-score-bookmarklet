# mai-score-bookmarklet

## ブックマークレットｶｯｯｺｶﾘ
```
javascript:
(function(d,s){
  g=d.createElement('div');g.id='mai-score-bookmarklet';d.body.appendChild(g);
  s=d.createElement('script');s.src='//mai-score-bookmarklet.web.app/js/app.js';d.body.appendChild(s);
  c=d.createElement('script');c.src='//mai-score-bookmarklet.web.app/js/chunk.js';d.body.appendChild(c);
  s=d.createElement('link');s.href='//mai-score-bookmarklet.web.app/css/app.css';s.rel="stylesheet";s.type="text/css";d.body.appendChild(s);
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
