self.onmessage=function(e){var out=[];var f=function(){return Array.prototype.map.call(arguments,function(a){try{return typeof a==='string'?a:JSON.stringify(a)}catch(x){return String(a)}}).join(' ')};
self.console={log:function(){out.push(f.apply(null,arguments))},error:function(){out.push('! '+f.apply(null,arguments))}};
['fetch','XMLHttpRequest','WebSocket','importScripts','indexedDB'].forEach(function(k){try{self[k]=undefined}catch(x){}});
try{var r=(0,eval)(e.data);if(r!==undefined)out.push('→ '+f(r))}catch(x){out.push('! '+x.message)}
self.postMessage(out.join('\n')||'(çıktı yok)')};
