(()=>{const e=async(e,t,n)=>{xe(!0);const l=new Headers;l.key=oe();const s=await fetch(`/${e}/${t}${n?"/"+n:""}`,{headers:l}),o=await s.json();return xe(!1),{result:o[0],err:o[1]}};let t,n;(()=>{let e;window.addEventListener("load",()=>{e=io({upgrade:!1,transports:["websocket"]}),e.on(G_S_CONNECTED,([{games:e,maps:t,id:n}])=>{Ce(n),Me(t),T(e)}),e.on(G_S_LIST_UPDATED,([e])=>{T(e)}),e.on(G_S_LOBBY_LIST_UPDATED,([e])=>{C(e)}),e.on(G_S_START,([{gameData:e}])=>{Re(e)}),e.on(G_S_STOP,([e])=>{Pe("menu"),Fe(e),ke(null)}),e.on(G_S_START_SIMULATION,([e])=>{Se([e]),Ie(e)}),e.on(G_S_STOP_SIMULATION,([e])=>{Se([]),je(e)}),e.on(G_S_BROADCAST,([{gameData:e}])=>{ke(e);const t=ae();t.push(e),t.length>500&&t.shift()}),e.on(G_S_FINISHED,([e])=>{He(e)}),e.on("connect",()=>{}),e.on("disconnect",e=>{Ue("You disconnected from the game server!")}),e.on("error",e=>{Ue("An error occurred with the connection to the game server!")}),Ne(),a()},!1)})();let l=!1,s=null,o=Math.PI;const a=()=>{},r=()=>_("c").getContext("2d"),i=(e,t)=>{e.innerHTML=t},c=(e,t,n,l)=>{const s=r();s.beginPath(),s.arc(e,t,n,0,2*o,!1),s.fillStyle=l,s.fill()},d=(e,t,n,l,s,a)=>{const i=r();if(i.save(),i.beginPath(),i.translate(e,t),i.fillStyle=s,void 0!==a){const e=n/2;i.translate(e,l/2),i.rotate(a*o/180),i.fillRect(-e,-l/1.5,n,l)}else i.fillRect(0,0,n,l);i.restore()},p=(e,t,n,l)=>{let s=l-t,a=n-e;const{sqrt:r,asin:i}=Math;let c=r(a*a+s*s),d=0;return d=l>=t&&n>=e?180*i(s/c)/o+90:l>=t&&n<e?180*i(s/-c)/o-90:l<t&&n>e?180*i(s/c)/o+90:180*i(-s/c)/o-90,d>=360&&(d=360-d),d<0&&(d=360+d),isNaN(d)?0:d},y=e=>`background-color:${m("dark",e)};color:${m("light",e)};`,u=e=>{t=+new Date,n=0,s=e;const o=()=>{let e=+new Date;n=e-t,t=e,s(),requestAnimationFrame(o)};l||requestAnimationFrame(o),l=!0},h=()=>{const e=r().canvas,{left:t,top:n}=e.getBoundingClientRect();return{left:t,top:n,width:e.width,height:e.height}},m=(e,t)=>({"":{blue:"#44F",yellow:"#cac200"},dark:{blue:"darkblue",red:"darkred",green:"darkgreen",yellow:"#B8860B"},light:{blue:"lightblue",red:"#F08080",green:"lightgreen",yellow:"#FFF60B"}}[e][t]||e+t),g=(e,t)=>{const{width:n,height:l}=h();return{x:(e-n/2)/G_SCALE,y:-(t-l/2)/G_SCALE}},f=(e,t)=>{const{width:n,height:l}=h();return{x:Math.round(e*G_SCALE+n/2),y:Math.round(-t*G_SCALE+l/2)}},_=e=>document.getElementById(e),x=e=>{const{players:t,planets:n,projectiles:l}=e,s=ae();(()=>{const e=r(),t=e.canvas;e.fillStyle="#222",e.fillRect(0,0,t.width,t.height)})();for(let t=0;t<s.length;t++){const{projectiles:n}=s[t];for(let t=0;t<n.length;t++){const{px:l,py:s,r:o,meta:a}=n[t],{x:r,y:i}=f(l,s),d=Z(a.player,e);c(r,i,o*G_SCALE,m("light",d.color))}}S(t),w(n,e),w(l,e);let o=e.collisions,a=o.length;if(a)for(let t=0;t<a;t++){const[n,l]=o[t],{x:s,y:a}=f(n.px,n.py);if((l&&l.meta||{}).player===n.meta.player)continue;n.meta.type!==G_action_move&&$(s,a);let r=e.projectiles.indexOf(n);if(r>-1&&e.projectiles.splice(r,1),K(l)){const t=Z(n.meta.player,e),s=(_("res-"+l.id)||{}).parentElement;if(!s)continue;s.remove();let o="";switch(l.type){case G_res_coin:o="+$"+l.value;break;case G_res_spray:o="+2 Spreadfire";break;case G_res_planetCracker:o="+2 PlanetCracker"}const{x:a,y:r}=f(l.x,l.y);G(a,r,o,m("light",t.color))}else l&&l.meta&&"planet"===l.meta.type&&n.meta.type===G_action_planetCracker&&b(l.px,l.py,G_AU,30);const i=l&&Q(l,e),c=l&&n.meta.type===G_action_move&&!!l.color;let d=null;if(i?d=Z(l.id,e):c&&(d=Z(n.meta.player,e)),d){d.dead=!0;const{x:e,y:t}=f(d.x,d.y);G(e,t,"Eliminated!",m("light",d.color)),b(d.x,d.y,G_AU/2,12)}}e.collisions=[]},v=(e,t,n,l,s,o,a)=>{a=a||{};const r={position:"absolute",left:l+"px",top:s+"px",...a},c=document.createElement("div");c.className=n,"string"==typeof t?i(c,t):c.appendChild(t),c.id=o;for(let e in r)c.style[e]=r[e];return e.appendChild(c),c},b=(e,t,n,l)=>{for(let s=0;s<l;s++){const{x:o,y:a}=G_getRandomLocInCircle(e,t,n),{x:r,y:i}=f(o,a);setTimeout(()=>{$(r,i)},s/l*2e3)}},$=(e,t)=>{const n=e+","+t;_(n)||v(_("particles"),"","expl",e-50,t-50,n)},G=(e,t,n,l)=>{const s="text,"+e+","+t;_(s)||v(_("particles"),n,"text-particle",e-100,t,s,{color:l})},S=e=>{for(let t=0;t<e.length;t++){const{x:n,y:l,r:s,color:o,target:a,dead:r}=e[t],{x:i,y:y}=f(n,l),u=2*s*G_SCALE-10,h=u/2,[g,x]=o===ce()?ye():a,{x:v,y:b}=f(g,x),$=_("pl-"+o);$.style.left=i-100+"px",$.style.top=y-75+"px",r?$.style.opacity=0:(c(i,y,s*G_SCALE,m("dark",o)),d(i-h,y-h,u,u,m("",o)),d(i-5,y-30,10,60,"white",p(i,y,v,b)),c(i,y,h/1.5,m("light",o)))}},w=(e,t)=>{for(let n=0;n<e.length;n++){const{meta:l,px:s,py:o,r:a,color:r}=e[n],{x:i,y:d}=f(s,o),p="planet"===l.type;let y;p||(y=Z(l.player,t),!l.player||l.type!==G_action_move)?c(i,d,a*G_SCALE,p?r:y.color):(y.x=s,y.y=o)}},E=e=>{if(!e)return;const t=ee(e),n=te(),l=se(),s=t.dead,o=ne();_("controls").style.display=le()||o||l||s?"none":"flex",_("leave-game").style.display=l||s?"block":"none";let a="";Object.keys(G_SPEEDS).forEach(e=>{let[,t]=G_SPEEDS[e],l=e===re()?y(ce()):"";a+=`<div class="action-label" style="pointer-events:${n?"none":"all"}">\n<div>Cost $${t}</div>\n<div class="action" style="${l}" id="${e}" onclick="events.setSpeed('${e}')">${e}\n</div>\n</div>`}),i(_("speed-buttons"),a),_("back-practice").style.display=_e()?"block":"none";let r="";G_actions.forEach(([e,n],l)=>{const s=t.actions[e];s&&(r=L(e+(s<99?` (${s})`:""),"$"+n,e,l>1)+r)}),i(_("action-buttons"),r);const c=G_getActionCost(ie())+G_getSpeedCost(re());_("confirm-button").disabled=c>t.funds,i(_("funds"),"Funds: $"+t.funds);let d=_("target");const p=ye(),{x:u,y:h}=f(p[0],p[1]);d.style.display=le()||l||s?"none":"flex",d.style.left=u-30+"px",d.style.top=h-30+"px",d.style.stroke=m("",ce()),d.className="target";const g=_("x").cloneNode(!0);g.id="x2",g.style.display="block",i(d,""),d.appendChild(g);const x=_("banner-message"),v=_("banner-message2");if(i(x,o?"Waiting for other players...":l?"The Game is Over!":s?"You have been destroyed!":`You are the <span style="${y(t.color)}border:1px solid;padding:2px;">${t.color}</span> player.`),l){const t=Z(e.result,e);i(v,t?`The Victor is <span style="${y(t.color)}">${t.name}</span>!`:"The result is a DRAW!")}else o||le()||s?i(v,""):i(v,`<span style="color:${m("light",t.color)}">[Right Click/Dbl Tap]</span> to set Target.<br /> <span style="color:${m("light",t.color)}">[Left Click/Tap]</span> to pan.`)},T=e=>{const t=_("games");i(t,"");for(let n=0;n<e.length;n++){const{id:l,name:s}=e[n];t.innerHTML+=`<button style="background-color:#225;" onclick="events.join('${l}')">${n+1}. Join Game: ${s}</button>`}i(_("map-select-practice"),A())},C=e=>{const t=_("players-lobby");i(t,"");for(let n=0;n<e.length;n++){const{id:l,userName:s}=e[n];t.innerHTML+=`<div class="lobby-player">${n+1}. ${l===de()?`<a class="lobby-name">${s}</a>`:s}</div>`}const n=fe(),l=e[0].id===de(),s=e.length>1&&e.length<=n.maxPlayers;i(_("map-select"),A(!l)),i(_("lobby-title"),pe()),i(_("player-count"),e.length+" of 4 joined (at least 2 required to start)");const o=_("start");o.style.display=l?"block":"none",o.disabled=!s},L=(e,t,n,l)=>`<div class="h-button-list">\n<button class="action" onclick="events.setAction('${n}')" style="${ie()===n?y(ce()):""};width:136px;margin:2px;animation:${l?"2s linear infinite border-color;":""}">${e}</button>\n<div>${t}</div>\n</div>`,A=e=>`<select style="display:${e?"none":"block"}" id="lobby-map-select" class="centered" onchange="events.setMapIndex()">${ge().reduce((e,t,n)=>e+`<option ${me()===n?"selected":""} value=${n}>${t.name}</option>`,"")}</select>`;let k=null,M=null,D=null,Y=null,N=0,R=[],I=!1,j="menu",O=null,X=!1,P=G_action_shoot,F="Normal",H=!1,B=[0,0],q=null,U="blue",W="",J=!1,V=null,z=["dialog","game","lobby","menu"];const K=e=>!!e&&[G_res_coin,G_res_spray,G_res_planetCracker].includes(e.type),Q=e=>!(!e.color||!e.target),Z=(e,t)=>t.players.reduce((t,n)=>n.id===e?n:t,null),ee=e=>{const{players:t}=e||{};for(let e=0;e<t.length;e++){const n=t[e];if(n.id===de())return n}return null},te=()=>I,ne=()=>H,le=()=>X,se=()=>J,oe=()=>null,ae=()=>R,re=()=>F,ie=()=>P,ce=()=>U,de=()=>k,pe=()=>D,ye=()=>B,ue=()=>q,he=()=>W||"Player",me=()=>N,ge=()=>V,fe=()=>V[N],_e=()=>1===ue().players.length,xe=e=>I=e,ve=e=>H=e,be=e=>X=e,$e=e=>J=e,Ge=e=>Y=e,Se=e=>R=e,we=e=>F=e,Ee=e=>P=e,Te=e=>M=e,Ce=e=>k=e,Le=e=>D=e,Ae=e=>B=e,ke=e=>q=e,Me=e=>V=e;window.events={async create(t){Be(_("player-name-input").value);const{result:n,err:l}=await e(G_R_CREATE,`${de()}/${he()||de()}/${!!t}`);if(!l){const{id:e,name:l}=n;Te(e),Le(l||"Game Name"),t||(Pe("lobby"),C([{id:de(),userName:he()}])),t&&await window.events.start()}},async join(t){Be(_("player-name-input").value);const{result:n,err:l}=await e(G_R_JOIN,`${de()}/${t},${he()||de()}`);if(l)Ue("Could not join game.");else{const{id:e,name:t,players:l}=n;Te(e),Le(t),Pe("lobby"),C(l)}},async leave(){const{err:t}=await e(G_R_LEAVE,""+de());t||(Te(null),Pe("menu"))},async start(){await e(G_R_START,`${de()}/${me()}`)},async setMapIndex(e){void 0===e&&(e=_("lobby-map-select").value),N=parseInt(e)},async confirmAction(){const t=ie();let n=[...ye(),re()].join(",");const l=G_getActionCost(t),s=ee(ue()),{x:o,y:a}=f(s.x,s.y);G(o,a-30,"-$"+l,m("light",ce())),Oe(!0),ve(!0);const{err:r}=await e(G_R_CONFIRM_ACTION,`${de()}/${t}/${n}`);r&&ve(!1),Oe(!1)},setAction(e){Ee(e),E(ue())},setSpeed(e){we(e),E(ue())},setTarget(e){e.preventDefault(),e.stopPropagation(),!Y||ne()||le()||We(e)},centerCam(){Xe()},async returnToMenu(){M&&await window.events.leave(),ke(null),Te(null),Pe("menu")},hideDialog(){Pe(O)}};let De=_("c"),Ye=0;De.addEventListener("touchend",e=>{if(Je)return;let t=+new Date;t-Ye<500&&(window.events.setTarget(e),e.preventDefault()),Ye=t}),De.addEventListener("contextmenu",window.events.setTarget);const Ne=()=>{let e=_("main").style,t=()=>{const{innerHeight:t}=window;e.height=t+"px"};addEventListener("resize",t),Be(qe()),t(),function(e,t){function n(e,t,n,l,s){const o=l,a=t,r=n,i=s;let c=!1,d=!1,p=0,y=0,u=0;e.style.transform="matrix(1, 0, 0, 1, 0, 0)";const h=()=>{let t=e.style.transform,n=t.indexOf("(")+1,l=t.indexOf(")"),s=t.slice(n,l).split(",");return{scale:+s[0],transX:+s[4],transY:+s[5]}},m=t=>{e.style.transform="matrix("+t.scale+", 0, 0, "+t.scale+", "+t.transX+", "+t.transY+")"},g=(e,t)=>{let n=h();n.transX+=e,n.transY+=t,m(n)},f=(t,n,l)=>{let s=h(),o=n-(e.width?e.width:e.offsetWidth)/2,c=l-(e.height?e.height:e.offsetHeight)/2;s.scale+=t=i?t:t*s.scale;let d=s.scale<=a||s.scale>=r;s.scale<a&&(s.scale=a),s.scale>r&&(s.scale=r),d||(g(o,c),m(s),g(-o*t,-c*t))},_=(e,t,n,l)=>Math.sqrt(Math.pow(n-e,2)+Math.pow(l-t,2)),x=(e,t,n,l)=>({x:Math.min(e,n)+Math.abs(n-e)/2,y:Math.min(t,l)+Math.abs(l-t)/2});e.addEventListener("mousedown",e=>{0===e.button&&(e.preventDefault(),c=!0,p=e.clientX,y=e.clientY)}),e.addEventListener("touchstart",e=>{e.preventDefault();const t=e.touches,n=t.length;if(n)if(c=!0,n>=2){const{clientX:e,clientY:n}=t[1],{clientX:l,clientY:s}=t[0];u=_(e,n,l,s),d=!0,Je=!0;const{x:o,y:a}=x(e,n,l,s);p=o,y=a}else p=t[0].clientX,y=t[0].clientY}),e.addEventListener("mouseup",e=>{0===e.button&&(c=!1,Je=!1)}),e.addEventListener("mouseleave",()=>{c=!1,Je=!1}),e.addEventListener("touchend",e=>{0===e.touches.length&&(c=!1,d=!1,Je=!1)}),e.addEventListener("mousemove",e=>{c&&(g(e.clientX-p,e.clientY-y),p=e.clientX,y=e.clientY)}),e.addEventListener("touchmove",e=>{const t=e.touches;if(c||d){let n=0,l=0;if(t.length>=2){const{clientX:e,clientY:s}=t[1],{clientX:o,clientY:a}=t[0],r=_(e,s,o,a),{x:i,y:c}=x(e,s,o,a);n=i-p,l=c-y,g(n,l),p=i,y=c;const d=h();f(r>u?.018:-.018,d.tranX,d.transY),u=r}else{const t=e.touches[0];n=t.clientX-p,l=t.clientY-y,g(n,l),p=t.clientX,y=t.clientY}}});const v=e=>{f(Math.max(-1,Math.min(1,e.wheelDelta||-e.detail))<0?-o:o,e.offsetX,e.offsetY)};e.addEventListener("DOMMouseScroll",v,!1),e.addEventListener("mousewheel",v,!1)}let l=[],s=(t=t||{}).minScale?t.minScale:.1,o=t.maxScale?t.maxScale:1,a=t.increment?t.increment:.2,r=!!t.liner&&t.liner;document.querySelectorAll("#cc").forEach((function(e){l.push(new n(e,s,o,a,r))}))}(0,[{minScale:.2,maxScale:1,increment:.1,linear:!0}])},Re=e=>{Ge(!0),ke(e),Se([]),Pe("game");const{players:t,width:n,height:l}=e;((e,t)=>{const n=_("c");n.width=e,n.height=t})(2*n*G_SCALE,2*l*G_SCALE);const s=ee(e);we("Normal"),U=s.color;const o=_("players");i(o,"");for(let e=0;e<t.length;e++){const{x:n,y:l,name:s,color:a}=t[e],r=document.createElement("div");i(r,s),r.className="player-name",r.id="pl-"+a;const{x:c,y:d}=f(n,l);r.style.left=c-100+"px",r.style.top=d-75+"px",r.style.color=m("light",a),o.appendChild(r)}Ae([s.x,s.y+100]),Xe(),ve(!1),be(!1),$e(!1),_("particles").innerHTML="",Pe("game"),E(e),(e=>{const t=_("res");i(t,"");for(let n=0;n<e.length;n++){const{x:l,y:s,id:o,type:a}=e[n],{x:r,y:i}=f(l,s),c=document.createElement("div"),d={[G_res_planetCracker]:"PlanetCracker",[G_res_spray]:"Spreadfire",[G_res_coin]:""};c.innerHTML=d[a];const p=v(c,a===G_res_coin?"$":"!","resource "+a,r-100,i-(a===G_res_coin?25:45),"res-"+o);c.style.left=p.style.left,c.style.top=p.style.top,c.className="res2 centered",p.style.position="unset",t.appendChild(c)}})(e.resources),x(e)},Ie=e=>{ke(e),ve(!1),be(!0),_("particles").innerHTML="",E(e),x(e),u(()=>{let e=ue();G_applyGravity(e.projectiles,e.planets,e.players.concat(e.resources),n),x(e)})},je=e=>{if(u((function(){})),be(!1),e){ke(e);const t=ee(e);t.actions[ie()]||Ee(G_action_shoot),E(e);for(let t=0;t<e.projectiles.length;t++){const n=e.projectiles[t],{x:l,y:s,meta:o}=f(n.px,n.py);$(l,s,o&&"Move"===o.type?"mv":"sm")}e.projectiles=[],x(e);const{x:n,y:l}=f(t.x,t.y);if(!t.dead){const t=e.baseFundsPerRound;i(_("banner-message3"),`All players granted $${t} at completion of the round.`),setTimeout(()=>{G(n,l-30,"+$"+t,m("light",ce()))},500),setTimeout(()=>{i(_("banner-message3"),"")},3e3)}}},Oe=e=>{xe(e),E(ue())},Xe=()=>{const e=ee(ue()),{width:t,height:n}=h(),{x:l,y:s}=f(e.x,e.y),o=_("cc").style;o.transition="transform 0.5s",o.transform=`matrix(1, 0, 0, 1, ${-(l-t/2)}, ${-(s-n/2-2)})`,setTimeout(()=>{o.transition=""},500)},Pe=(e,t)=>{j=e,z.forEach(n=>{const l=_(n);let s="none";e===n&&(s="flex",t&&t()),l.style.display=s})},Fe=e=>{O=j,Pe("dialog"),_("dialog-text").innerHTML=e},He=e=>{ue()&&e.result&&(Ge(!1),$e(!0),ke(e),E(e),x(e))},Be=e=>{_("player-name-input").value=e,W=e,localStorage.setItem("js13k2020_orbital_forts_u",e)},qe=()=>he()||localStorage.getItem("js13k2020_orbital_forts_u")||"Player",Ue=e=>{je(ue()),Pe("menu"),Te(null),ke(null),Ge(!1),T([]),Pe("menu"),Fe(e)},We=e=>{let t=_("c");if(e.changedTouches){const n=e.changedTouches[0],l=t.parentElement.style.transform,{left:s,top:o}=t.getBoundingClientRect(),a=parseFloat(l.slice(7,l.indexOf(",")));let{x:r,y:i}=g((n.clientX-s)/a,(n.clientY-o)/a);Ae([r,i])}else{const{offsetX:t,offsetY:n}=e;let{x:l,y:s}=g(t,n);Ae([l,s])}E(ue()),x(ue())};let Je=!1})();