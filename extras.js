(function(){'use strict';
var $=function(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
var SLUG=/^[a-z0-9-]+$/;
function md(src){var box=$('div','md'),ul=null;
function inl(p,t){t.split(/(`[^`]+`|\*\*[^*]+\*\*)/).forEach(function(s){
if(s[0]==='`'&&s.length>2)p.appendChild($('code',0,s.slice(1,-1)));
else if(s.slice(0,2)==='**'&&s.length>4)p.appendChild($('strong',0,s.slice(2,-2)));
else p.appendChild(document.createTextNode(s))})}
src.split('\n').forEach(function(l){var m;
if(m=l.match(/^(#{1,3}) (.*)/)){ul=null;inl(box.appendChild($('h'+(m[1].length+1))),m[2])}
else if(m=l.match(/^[-*] (.*)/)){if(!ul)ul=box.appendChild($('ul'));inl(ul.appendChild($('li')),m[1])}
else if(m=l.match(/^> (.*)/)){ul=null;inl(box.appendChild($('blockquote')),m[1])}
else if(l.trim()){ul=null;inl(box.appendChild($('p')),l)}});return box}
var views={};
function view(id,title,cls){var v=$('div','xv '+(cls||'')),in_=v.appendChild($('div','in')),t=in_.appendChild($('div','top'));
t.appendChild($('h2',0,title));var c=t.appendChild($('button',0,'Kapat ✕'));c.onclick=function(){v.classList.remove('on')};
var body=in_.appendChild($('div'));document.body.appendChild(v);views[id]={v:v,body:body};return body}
function open(id){Object.keys(views).forEach(function(k){views[k].v.classList.remove('on')});views[id].v.classList.add('on');if(views[id].init){views[id].init();views[id].init=null}}
var posts=[];
function loadList(){return fetch('posts/index.json').then(function(r){return r.json()}).then(function(j){posts=j.filter(function(p){return SLUG.test(p.slug)})})}
function readPost(slug,body){if(!SLUG.test(slug))return;body.textContent='Yükleniyor…';
fetch('posts/'+slug+'.md').then(function(r){return r.text()}).then(function(t){body.textContent='';body.appendChild(md(t))}).catch(function(){body.textContent='Yazı açılamadı.'})}
// Yazılar
var B=view('blog','Yazılar');
function blog(){loadList().then(function(){B.textContent='';var row=B.appendChild($('div','row')),list=B.appendChild($('div'));
['hepsi','blog','lab','data','devlog'].forEach(function(f){var b=row.appendChild($('button',0,{hepsi:'Hepsi',blog:'Blog',lab:'LLM Lab',data:'Veri notları',devlog:'Devlog / Now'}[f]));
b.onclick=function(){list.textContent='';posts.filter(function(p){return f==='hepsi'||p.type===f}).forEach(function(p){var a=list.appendChild($('a','p',p.date+' · '+p.title));a.onclick=function(){list.textContent='';var bk=list.appendChild($('button',0,'← Liste'));bk.onclick=b.onclick;readPost(p.slug,list.appendChild($('div')))}})};});row.firstChild.onclick()})}
views.blog.init=blog;
// Görselleştirici
var V=view('viz','Algoritma görselleştirici'),cv=$('canvas'),ctx,arr=[],busy=false;
var rw=V.appendChild($('div','row'));V.appendChild(cv);
function draw(a,h1,h2){var w=cv.width=cv.clientWidth*2,h=cv.height=520;ctx=cv.getContext('2d');ctx.clearRect(0,0,w,h);var bw=w/a.length;
a.forEach(function(v,i){ctx.fillStyle=i===h1||i===h2?'#f2b552':'#4fd1d9';ctx.fillRect(i*bw+1,h-v*5,bw-2,v*5)})}
function reset(){arr=[];for(var i=0;i<40;i++)arr.push(8+Math.floor(Math.random()*92));draw(arr)}
var sleep=function(){return new Promise(function(r){setTimeout(r,18)})};
var algos={Bubble:async function(a){for(var i=0;i<a.length;i++)for(var j=0;j<a.length-i-1;j++){if(a[j]>a[j+1]){var t=a[j];a[j]=a[j+1];a[j+1]=t}draw(a,j,j+1);await sleep()}},
Quick:async function(a){async function q(l,h){if(l>=h)return;var p=a[h],i=l;for(var j=l;j<h;j++){if(a[j]<p){var t=a[i];a[i]=a[j];a[j]=t;i++}draw(a,i,j);await sleep()}t=a[i];a[i]=a[h];a[h]=t;await q(l,i-1);await q(i+1,h)}await q(0,a.length-1)},
Merge:async function(a){async function m(l,r){if(r-l<1)return;var mid=(l+r)>>1;await m(l,mid);await m(mid+1,r);var L=a.slice(l,mid+1),R=a.slice(mid+1,r+1),i=0,j=0,k=l;while(i<L.length||j<R.length){a[k++]=j>=R.length||(i<L.length&&L[i]<=R[j])?L[i++]:R[j++];draw(a,k-1);await sleep()}}await m(0,a.length-1)}};
Object.keys(algos).forEach(function(n){rw.appendChild($('button',0,n+' Sort')).onclick=async function(){if(busy)return;busy=true;await algos[n](arr);draw(arr);busy=false}});
rw.appendChild($('button',0,'Karıştır')).onclick=function(){if(!busy)reset()};views.viz.init=reset;
// Kod konsolu
var K=view('run','JS kod konsolu (izole Worker)'),ta=K.appendChild($('textarea')),ro=K.appendChild($('div','row')),po=K.appendChild($('pre'));
ta.value='const a=[5,3,8,1];\nconsole.log(a.sort((x,y)=>x-y));';
ro.appendChild($('button',0,'Çalıştır ▶')).onclick=function(){var w=new Worker('runner.js'),t=setTimeout(function(){w.terminate();po.textContent='! Zaman aşımı (2 sn)'},2000);
w.onmessage=function(e){clearTimeout(t);po.textContent=e.data;w.terminate()};w.postMessage(ta.value)};
K.appendChild($('p',0,'C/C++/Python için WASM (Pyodide) henüz yok; ayrı adım.')).style.color='var(--muted)';
// Terminal
var T=view('term','Terminal','term'),out=T.appendChild($('div','out')),inp=T.appendChild($('input'));
inp.setAttribute('aria-label','komut');inp.autocomplete='off';
function say(t){out.textContent+=t+'\n'}
var cmds={help:function(){say('help about projects blog now cat <slug> matrix viz run clear')},
about:function(){say('NullVoid — AI & yazılım gündemi. Kurucu: semhdaq.')},
projects:function(){say('• NullVoid (haber panosu)\n• Algoritma görselleştirici\n• JS konsolu')},
blog:function(){loadList().then(function(){posts.forEach(function(p){say(p.slug+'  '+p.title)})})},
now:function(){cmds.cat('devlog-1')},
cat:function(a){a=(a||'').replace(/\.(txt|md)$/,'');if(a==='blog')return cmds.blog();if(!SLUG.test(a))return say('geçersiz ad');
fetch('posts/'+a+'.md').then(function(r){if(!r.ok)throw 0;return r.text()}).then(say).catch(function(){say('bulunamadı: '+a)})},
matrix:function(){document.body.classList.toggle('mx');say('matrix: '+(document.body.classList.contains('mx')?'açık':'kapalı'))},
viz:function(){open('viz')},run:function(){open('run')},clear:function(){out.textContent=''}};
inp.onkeydown=function(e){if(e.key!=='Enter')return;var p=inp.value.trim().split(/\s+/);inp.value='';say('> '+p.join(' '));
if(!p[0])return;var f=Object.prototype.hasOwnProperty.call(cmds,p[0])?cmds[p[0]]:null;f?f(p[1]):say('bilinmeyen komut: help')};
views.term.init=function(){say('NullVoid terminal. "help" yaz.');setTimeout(function(){inp.focus()},50)};
// Matrix
var mx=$('canvas');mx.id='mx';document.body.appendChild(mx);var mc=mx.getContext('2d'),cols=[],raf=0;
function mstep(){if(!document.body.classList.contains('mx')){raf=0;return}
mc.fillStyle='rgba(15,24,29,.12)';mc.fillRect(0,0,mx.width,mx.height);mc.fillStyle='#4fd1d9';mc.font='14px monospace';
cols.forEach(function(y,i){mc.fillText(String.fromCharCode(0x30A0+Math.random()*60),i*14,y*14);cols[i]=y*14>mx.height&&Math.random()>.975?0:y+1});setTimeout(function(){raf=requestAnimationFrame(mstep)},60)}
function mon(){mx.width=innerWidth;mx.height=innerHeight;cols=new Array(Math.ceil(innerWidth/14)).fill(0);if(!raf)mstep()}
new MutationObserver(function(){if(document.body.classList.contains('mx')&&!raf)mon()}).observe(document.body,{attributes:true,attributeFilter:['class']});
if(matchMedia('(prefers-reduced-motion: reduce)').matches)document.body.classList.remove('mx');
// Dock
var d=$('div','dock');[['blog','Yazılar'],['viz','Görselleştirici'],['run','Konsol'],['term','Terminal']].forEach(function(x){d.appendChild($('button',0,x[1])).onclick=function(){open(x[0])}});
d.appendChild($('button',0,'Matrix')).onclick=function(){document.body.classList.toggle('mx')};document.body.appendChild(d);
document.addEventListener('keydown',function(e){var t=e.target.tagName;if(e.key==='Escape')Object.keys(views).forEach(function(k){views[k].v.classList.remove('on')});
if(e.key==='`'&&t!=='INPUT'&&t!=='TEXTAREA'){e.preventDefault();open('term')}});
})();
