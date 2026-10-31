import re,sys
p='index.html'; s=open(p,encoding='utf-8').read(); o=s
def rep(a,b):
    global s
    if b in s: return
    assert a in s, 'bulunamadı: '+a[:50]
    s=s.replace(a,b,1)
rep('https://semhdaq.github.io/stackpulse/nullvoid-banner.jpg','https://semhdaq.github.io/nullvoid/nullvoid-banner.jpg')
rep('<link rel="stylesheet" href="extras.css">','<link rel="stylesheet" href="extras.css">\n<link rel="stylesheet" href="plus.css">\n<link rel="manifest" href="manifest.webmanifest">\n<link rel="alternate" type="application/rss+xml" title="NullVoid" href="feed.xml">')
rep('<script src="extras.js"></script>','<script src="extras.js"></script>\n<script src="plus.js"></script>')
rep('<div id="feed" role="tabpanel"','<noscript><p class="status">NullVoid\'in haberleri göstermesi için JavaScript gerekiyor. Tarayıcında etkinleştirip sayfayı yenile.</p></noscript>\n    <div id="feed" role="tabpanel"')
open(p,'w',encoding='utf-8').write(s); print('index.html güncellendi' if s!=o else 'zaten güncel')
