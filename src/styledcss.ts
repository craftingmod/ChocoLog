export const styledCSS = `@\u001b[32mfont-face\u001b[39m {
  \u001b[33mfont-family\u001b[39m: Alpha;
  \u001b[33msrc\u001b[39m: \u001b[31murl\u001b[39m(\u001b[36m'Bravo.otf'\u001b[39m);
}

\u001b[32mbody\u001b[39m, \u001b[34m.charlie\u001b[39m, \u001b[34m#delta\u001b[39m {
  \u001b[33mcolor\u001b[39m: \u001b[36m#bada55\u001b[39m;
  \u001b[33mbackground-color\u001b[39m: \u001b[31mrgba\u001b[39m(33, 33, 33, 0.33);
  \u001b[33mfont-family\u001b[39m: \u001b[36m\"Alpha\"\u001b[39m, sans-serif;
}

@\u001b[32mimport\u001b[39m url(echo.css);

@\u001b[32mmedia\u001b[39m print {
  \u001b[32ma\u001b[39m\u001b[35m[href^=http]\u001b[39m\u001b[35m::after\u001b[39m {
    \u001b[33mcontent\u001b[39m: \u001b[31mattr\u001b[39m(href)
  }
}`
