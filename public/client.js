(()=>{function e(e,t){const n=parseInt(e.slice(1,3),16),o=parseInt(e.slice(3,5),16),l=parseInt(e.slice(5,7),16);return void 0!==t?"rgba("+n+", "+o+", "+l+", "+t+")":"rgb("+n+", "+o+", "+l+")"}const t=async(e,t,n)=>{Ge(!0);const o=await fetch(`/${e}/${t}${n?"/"+n:""}`,{headers:{key:re()}}),l=await o.json();if(l[1])throw Error("[FETCH-ERROR] "+l[1]);return Ge(!1),{result:l[0],err:l[1]}};let n,o;(()=>{let e;window.addEventListener("load",()=>{e=io({upgrade:!1,transports:["websocket"]}),e.on(G_S_CONNECTED,([{games:e,maps:t,id:n,key:o}])=>{De(n),Oe(t),Ce(o),jt(e)}),e.on(G_S_LIST_UPDATED,([e])=>{jt(e)}),e.on(G_S_LOBBY_DATA,([e])=>{Ot(e)}),e.on(G_S_GAME_METADATA,([e])=>{je(e),Nt(he(),e)}),e.on(G_S_START,([{gameData:e}])=>{lt(e),e.isPractice||Ke("start")}),e.on(G_S_STOP,([e])=>{ut("menu"),ht(e),Ne(null)}),e.on(G_S_START_SIMULATION,([e])=>{Me([e]),at(e)}),e.on(G_S_STOP_SIMULATION,([e])=>{Me([]),rt(e)}),e.on(G_S_BROADCAST,([{gameData:e}])=>{Ne(e);const t=ie();t.push(e),t.length>500&&t.shift()}),e.on(G_S_FINISHED,([{gameData:e,replay:t}])=>{mt(e),Pe(t)}),e.on("connect",()=>{}),e.on("disconnect",e=>{bt("You disconnected from the game server!")}),e.on("error",e=>{console.error("socket-error",e),bt("An error occurred with the connection to the game server!")}),tt(),i()},!1)})();let l=!1,s=null,a=+new Date,r=Math.PI;const i=()=>{Ft()},c=()=>{n-a>9e3&&(a=+new Date)},d=()=>G("c").getContext("2d"),p=(e,t)=>{e.innerHTML=t},y=()=>{const e=d(),t=e.canvas;e.clearRect(0,0,t.width,t.height)},u=(e,t,n,o)=>{const l=d();l.beginPath(),l.arc(e,t,n,0,2*r,!1),l.fillStyle=o,l.fill()},h=(e,t,n,o,l,s)=>{const a=d();if(a.save(),a.beginPath(),a.translate(e,t),a.fillStyle=l,void 0!==s){const e=n/2;a.translate(e,o/2),a.rotate(s*r/180),a.fillRect(-e,-o/1.5,n,o)}else a.fillRect(0,0,n,o);a.restore()},m=(e,t,n,o)=>{let l=o-t,s=n-e;const{sqrt:a,asin:i}=Math;let c=a(s*s+l*l),d=0;return d=o>=t&&n>=e?180*i(l/c)/r+90:o>=t&&n<e?180*i(l/-c)/r-90:o<t&&n>e?180*i(l/c)/r+90:180*i(-l/c)/r-90,d>=360&&(d=360-d),d<0&&(d=360+d),isNaN(d)?0:d},g=(e,t)=>({"":{blue:"#44F",yellow:"#cac200"},dark:{blue:"darkblue",red:"darkred",green:"darkgreen",yellow:"#B8860B"},light:{blue:"lightblue",red:"#F08080",green:"lightgreen",yellow:"#FFF60B"}}[e][t]||e+t),f=e=>`background-color:${g("dark",e)};color:${g("light",e)};`,b=e=>{n=+new Date,o=0,s=e;const t=()=>{let e=+new Date;o=e-n,n=e,s(),requestAnimationFrame(t)};l||requestAnimationFrame(t),l=!0},_=()=>{const e=d().canvas,{left:t,top:n}=e.getBoundingClientRect();return{left:t,top:n,width:e.width,height:e.height}},x=(e,t)=>{const{width:n,height:o}=_();return{x:(e-n/2)/G_SCALE,y:-(t-o/2)/G_SCALE}},v=(e,t)=>{const{width:n,height:o}=_();return{x:Math.round(e*G_SCALE+n/2),y:Math.round(-t*G_SCALE+o/2)}},G=e=>document.getElementById(e),w=e=>{const{players:t,planets:n,projectiles:o}=e,l=ie();y(),c(),E(n);for(let t=0;t<l.length;t++){const{projectiles:n}=l[t];for(let t=0;t<n.length;t++){const{px:o,py:l,r:s,meta:a}=n[t],{x:r,y:i}=v(o,l),c=ne(a.player,e);u(r,i,s*G_SCALE,g("light",c.color))}}if(C(o,e),$(t),G_DEBUG)for(let t=0;t<e.resources.length;t++){const{x:n,y:o,r:l}=e.resources[t],{x:s,y:a}=v(n,o);u(s,a,l*G_SCALE,"white")}},S=e=>{if(!e)return;const{planets:t,players:n}=e;if(y(),c(),$(n),E(t),G_DEBUG)for(let t=0;t<e.resources.length;t++){const{x:n,y:o,r:l}=e.resources[t],{x:s,y:a}=v(n,o);u(s,a,l*G_SCALE,"white")}},$=e=>{for(let t=0;t<e.length;t++){const{x:n,y:o,r:l,color:s,target:a,dead:r}=e[t],{x:i,y:c}=v(n,o),d=2*l*G_SCALE-10,p=d/2,[y,f]=s===pe()?ue():a,{x:b,y:_}=v(y,f),x=G("pl-"+s);x.style.left=i-100+"px",x.style.top=c-75+"px",r?x.style.opacity=0:(u(i,c,l*G_SCALE,g("dark",s)),h(i-p,c-p,d,d,g("",s)),h(i-5,c-30,10,60,"white",m(i,c,b,_)),u(i,c,p/1.5,g("light",s)))}},E=t=>{const o=120/G_SCALE,l=840/G_SCALE;for(let e=0;e<t.length;e++){const{px:n,py:s,mass:a}=t[e],{x:r,y:i}=v(n,s),c=G_normalize(a,G_MASS_MIN,G_MASS_MAX,o,l),p=d().createRadialGradient(r,i,20,r,i,c*G_SCALE);p.addColorStop(0,"#0f0f0f"),p.addColorStop(1,"transparent"),u(r,i,800,p)}for(let o=0;o<t.length;o++){const{px:l,py:s,r:r,color:i}=t[o],{x:c,y:d}=v(l,s),p=Math.min(Math.max(G_normalize(n,a,a+9e3,0,1),0),1);u(c,d,r*G_SCALE,e(i,"0.9")),u(c,d,r*G_SCALE*(1-p),g("dark",i))}},C=(e,t)=>{for(let n=0;n<e.length;n++){const{meta:o,px:l,py:s,r:a}=e[n],{x:r,y:i}=v(l,s);u(r,i,a*G_SCALE,ne(o.player,t).color)}};let M=null,A=null,k=null,L=null,T=null,D=null,I=0,R=[],N=!1,j="menu",O=null,P=!1,Y=G_action_shoot,B="Normal",F=!1,X=[0,0],H=null,U=null,J="blue",q="",W=!1,z=null,V=null,Z=null,K=!1,Q=0,ee=!0,te=["dialog","game","lobby","menu"];const ne=(e,t)=>t.players.reduce((t,n)=>n.id===e?n:t,null),oe=e=>{const{players:t}=e||{};for(let e=0;e<t.length;e++){const n=t[e];if(n.id===ye())return n}return t[0]},le=()=>F,se=()=>P,ae=()=>W,re=()=>D,ie=()=>R,ce=()=>B,de=()=>Y,pe=()=>J,ye=()=>M,ue=()=>X,he=()=>H,me=()=>q,ge=()=>I,fe=()=>z,be=()=>K,_e=()=>V,xe=()=>Q,ve=()=>ee,Ge=e=>N=e,we=e=>F=e,Se=e=>P=e,$e=e=>W=e,Ee=e=>T=e,Ce=e=>D=e,Me=e=>R=e,Ae=e=>B=e,ke=e=>Y=e,Le=e=>A=e,Te=e=>k=e,De=e=>M=e,Ie=e=>L=e,Re=e=>X=e,Ne=e=>H=e,je=e=>U=e,Oe=e=>z=e,Pe=e=>{Z=e,localStorage.setItem("js13k2020_orbital_forts_replay",JSON.stringify(Z))},Ye=e=>K=e,Be=e=>Q=e,Fe=e=>{ee=e,localStorage.setItem("js13k2020_orbital_forts_sound",e)},Xe=localStorage.getItem("js13k2020_orbital_forts_replay");if(Xe)try{Pe(JSON.parse(Xe))}catch(e){}const He=localStorage.getItem("js13k2020_orbital_forts_sound");null!==He&&Fe("true"===He),window.events={async create(e){Ke("button"),gt(G("player-name-input").value.trim()||"Player");const{result:n,err:o}=await t(G_R_CREATE,`${ye()}/${encodeURIComponent(me())||ye()}/${!!e}`);if(!o){const{id:t,name:o}=n;Le(t),Te(t),Ie(o||"Game Name"),e||(ut("lobby"),Ot(n.lobbyData)),e&&await window.events.start()}},async join(e){Ke("button"),gt(G("player-name-input").value.trim()||"Player");const{result:n,err:o}=await t(G_R_JOIN,`${ye()}/${e},${encodeURIComponent(me())}`);if(o)bt("Could not join game.");else{const{id:e,name:t,lobbyData:o}=n;Le(e),Ie(t),Te(e),ut("lobby"),Ot(o)}},async leave(){Ke("button");try{await t(G_R_LEAVE,""+ye())}catch(e){}Le(null),Te(null),ut("menu")},async start(){await t(G_R_START,`${ye()}/${ge()}`)},async setMapIndex(e){let t=G(e).value;I=parseInt(t),"lobby-map-select"===e&&await window.events.updateLobby()},async confirmAction(){Ke("button3");const e=de();let n=[...ue(),ce()].join(",");const o=G_getActionCost(e),l=oe(he()),{x:s,y:a}=v(l.x,l.y);Dt(s,a-30,"-$"+o,g("light",pe())),dt(!0),we(!0);const{err:r}=await t(G_R_CONFIRM_ACTION,`${ye()}/${e}/${n}`);r&&we(!1),dt(!1)},setAction(e){Ke("button2"),ke(e),Rt(he())},setSpeed(e){Ke("button2"),Ae(e),Rt(he())},setTarget(e){e.preventDefault(),e.stopPropagation(),!T||le()||se()||be()||_t(e)},centerCam(){yt()},async returnToMenu(){Ke("button"),dt(!0),be()?(Gt(),vt()):(rt(),st()),await window.events.leave(),Ne(null),Le(null),ut("menu")},hideDialog(){ut(O)},async updateLobby(){const e=""+ge();await t(G_R_UPDATE_LOBBY,`${ye()}/${e}`)},viewLastReplay(){Ke("button");const e=JSON.parse(JSON.stringify(Z));e?xt(e):bt("No recent replay found.")},replayNextRound(){Ke("button"),wt()},toggleSound(){const e=ve();Fe(!e),Ft()}};let Ue,Je,qe,We=G("c"),ze=0;We.addEventListener("touchend",e=>{if($t)return;let t=+new Date;t-ze<500&&(window.events.setTarget(e),e.preventDefault()),ze=t}),We.addEventListener("contextmenu",window.events.setTarget),Je=.3,Ue=(e=1,t=.05,n=220,o=0,l=0,s=.1,a=0,r=1,i=0,c=0,d=0,p=0,y=0,u=0,h=0,m=0,g=0,f=2*Math.PI,b=44100,_=(e=>2*e*Math.random()-e),x=(e=>0<e?1:-1),v=(i*=500*f/b**2),G=(n*=(1+_(t))*f/b),w=x(h)*f/4,S=[],$=0,E=0,C=0,M=1,A=0,k=0,L=0,T,D,I,R=qe.createBufferSource())=>{for(c*=500*f/b**3,D=(o=99+o*b|0)+(l=l*b|0)+(s=s*b|0)+(g=g*b|0),h*=f/b,d*=f/b,p*=b,y*=b;C<D;S[C++]=L)++k>100*m&&(k=0,L=$*n*Math.sin(E*h-w),L=x(L=a?1<a?2<a?3<a?Math.sin((L%f)**3):Math.max(Math.min(Math.tan(L),1),-1):1-(2*L/f%2+2)%2:1-4*Math.abs(Math.round(L/f)-L/f):Math.sin(L))*Math.abs(L)**r,L*=e*Je*(C<o?C/o:C<o+l?1:C<D-g?1-(C-o-l)/s:0),L=g?L/2+(g>C?0:(C<D-g?1:(C-D)/g)*S[C-g]/2):L),$+=1+_(u),E+=1+_(u),n+=i+=c,M&&++M>p&&(G+=d,n+=d,M=0),y&&++A>y&&(n=G,i=v,A=1,M=M||1);(I=qe.createBuffer(1,S.length,b)).getChannelData(0).set(S),R.buffer=I,R.connect(qe.destination),R.start()},qe=new AudioContext;const Ve={button:[,,204,,,.06,,1.39,64,-17,,,,,-17,.2,.26],button2:[,,1107,.01,,.01,1,.14,,,,,,.5,31,.1,.44],button3:[,,313,,,.08,1,1.74,,,322,.66,,.1,-20,.1,.44],expl:[,,366,,.06,.28,3,2.51,-4.7,-.5,,,,.1,.1,.3,.06],getSpreadFire:[,,252,,,.23,2,.65,,,,,,1.6,-7.5,,.04],getCluster:[,,80,,,.41,2,2.53,1.3,-.8,,,,.7,.4,.1,.17],getPC:[,,1343,,.02,.23,1,.98,,,928,.06,.01],lobby:[,,531,.05,,.05,3,,,-.1,783,1.22,,1.4,,,.12],wormhole:[,,192,.01,.26,.01,,.56,,28,,,,.7,,,.16],playerDead:[,,385,,.1,.45,4,1.32,,,,,,.9,,.1,.11],playerDead2:[,,378,,.06,.97,1,3.63,.4,,,,,.5,-.4,.6],explPlanet:[,,814,.04,.23,1.86,4,1.78,,.3,,,,.9,-.9,.4],shootNorm:[,,528,.02,,.25,3,1.62,,-.6,,,,3.6,,.1,.01],shootNorm2:[,,223,,.07,.16,3,.92,,,,,,1.6,-.9,.3,.07],shootPC:[,,254,,,.48,3,.13,-1.1,,,,,2,,.1,.07],explLarge2:[,,997,.04,.06,.87,3,1.23,,100,,,,1.8,1,.8],explCluster:[,,273,,,.36,3,.01,,,,,,.2,.6,.3,.04],coin:[,,1250,,.04,.21,,1.56,,,706,.04,,,,,.05],start:[,,427,.01,.37,1.55,1,3.3,.4,.5,,,,.2,.2,.1,.36],win:[,,10,.22,.18,.93,2,.9,,-.9,150,.06,.09],lose:[,,31,.03,.24,.95,3,2.76,.1,,,,,.7,,.7],tie:[,,393,.03,.57,.11,1,1.65,,,4,.58,,.5,,.6],idk:[,,35,.5,.42,.34,,.49,,,258,.05,.25,,,,.13]},Ze={},Ke=e=>{ve()&&(Je=Ze[e]||.3,Ue(...Ve[e]||Ve.idk))};let Qe={},et=-1;const tt=()=>{let e=G("main").style,t=()=>{const{innerHeight:t}=window;e.height=t+"px"};addEventListener("resize",t),gt(ft()),t(),Qe=function(e,t){let n=(t=t||{}).minScale?t.minScale:.1,o=t.maxScale?t.maxScale:1,l=t.increment?t.increment:.2,s=!!t.liner&&t.liner;return function(e,t,n,o,l){const s=o,a=t,r=n,i=l;let c=!1,d=!1,p=0,y=0,u=0;e.style.transform="matrix(1, 0, 0, 1, 0, 0)";const h=()=>{let t=e.style.transform,n=t.indexOf("(")+1,o=t.indexOf(")"),l=t.slice(n,o).split(",");return{scale:+l[0],transX:+l[4],transY:+l[5]}},m=t=>{e.style.transform="matrix("+t.scale+", 0, 0, "+t.scale+", "+t.transX+", "+t.transY+")"},g=(e,t)=>{let n=h();n.transX+=e,n.transY+=t,m(n)},f=(t,n,o,l)=>{let s=l||h(),c=n-(e.width?e.width:e.offsetWidth)/2,d=o-(e.height?e.height:e.offsetHeight)/2;s.scale+=t=i?t:t*s.scale;let p=s.scale<=a||s.scale>=r;s.scale<a&&(s.scale=a),s.scale>r&&(s.scale=r),p||(g(c,d),m(s),g(-c*t,-d*t))},b=(e,t,n,o)=>Math.round(Math.sqrt(Math.pow(n-e,2)+Math.pow(o-t,2))),_=(e,t,n,o)=>({x:Math.min(e,n)+Math.abs(n-e)/2,y:Math.min(t,o)+Math.abs(o-t)/2}),x=e=>{const{clientX:t,clientY:n}=e[1],{clientX:o,clientY:l}=e[0];return{center:_(t,n,o,l),d:b(t,n,o,l)}};e.addEventListener("mousedown",e=>{0===e.button&&(e.preventDefault(),c=!0,p=e.clientX,y=e.clientY)}),e.addEventListener("touchstart",e=>{e.preventDefault();const t=e.touches,n=t.length;if(n)if(c=!0,n>=2){d=!0,$t=!0;const{center:{x:e,y:n},d:o}=x(t);u=o,p=e,y=n}else p=t[0].clientX,y=t[0].clientY}),e.addEventListener("mouseup",e=>{0===e.button&&(c=!1,d=!1,$t=!1)}),e.addEventListener("mouseleave",()=>{d=!1,c=!1,$t=!1}),e.addEventListener("touchend",e=>{0===e.touches.length&&(c=!1,d=!1,$t=!1)}),e.addEventListener("mousemove",e=>{c&&(g(e.clientX-p,e.clientY-y),p=e.clientX,y=e.clientY)}),e.addEventListener("touchmove",t=>{const n=t.touches;if(c||d){let o=0,l=0;if(n.length>=2){const{center:{x:t,y:s},d:a}=x(n);if(o=t-p,l=s-y,g(o,l),p=t,y=s,Math.abs(a-u)>2){const n=h(),o=e.getBoundingClientRect();f(a>u?.042:-.042,Math.round((t-o.left)/n.scale),Math.round((s-o.top)/n.scale)),u=a}}else if(!d){const e=t.touches[0];o=e.clientX-p,l=e.clientY-y,g(o,l),p=e.clientX,y=e.clientY}}});const v=e=>{f(Math.max(-1,Math.min(1,e.wheelDelta||-e.detail))<0?-s:s,e.offsetX,e.offsetY)};return e.addEventListener("DOMMouseScroll",v,!1),e.addEventListener("mousewheel",v,!1),{translateZoom:({x:t,y:n,scale:o})=>{f(o-1,t,n,{scale:1,transX:-(t-e.offsetWidth/2),transY:-(n-e.offsetWidth/2)}),p=t,y=n}}}(document.getElementById("cc"),n,o,l,s)}(0,[{minScale:.2,maxScale:1,increment:.1,linear:!0}])},nt=e=>{Ne(e),je({}),Me([]),ut("game"),Te(null);const{players:t,width:n,height:o}=e;((e,t)=>{const n=G("c");n.width=e,n.height=t})(2*n*G_SCALE,2*o*G_SCALE);const l=oe(e);Ae("Normal"),ke(G_action_shoot),J=l.color;const s=G("players");p(s,"");for(let e=0;e<t.length;e++){const{x:n,y:o,name:l,color:a}=t[e],r=document.createElement("div");p(r,l),r.className="player-name",r.id="pl-"+a;const{x:i,y:c}=v(n,o);r.style.left=i-100+"px",r.style.top=c-75+"px",r.style.color=g("light",a),s.appendChild(r)}we(!1),Se(!1),$e(!1),kt(e.resources),b(()=>{S(e)})},ot=e=>{const{resources:t}=e;for(let e=0;e<t;e++){const n=t[e];G("res-"+n.id)||At(n)}[...G("res").children].map(e=>{const t=e.children;return{resourceId:t[t.length-1].id.slice(4),child:e}}).forEach(({resourceId:e,child:n})=>{t.find(t=>t.id===e)||n.remove()})},lt=e=>{Ee(!0),Ye(!1),nt(e);const t=oe(e);G("particles").innerHTML="",Re([t.x,t.y+100]),yt(),Rt(e)},st=()=>{rt(he()),ut("menu"),Le(null),Ne(null),Ee(!1)},at=e=>{Ne(e),we(!1),Se(!0),G("particles").innerHTML="",Rt(e),w(e),Ke("shootNorm"),b(()=>{let e=he();G_applyGravity(e.projectiles,e.planets,e.players.concat(e.resources),o),w(e),it(e),ct(e)})},rt=e=>{if(clearInterval(-1),b(()=>{const e=he();S(e)}),Se(!1),Ae("Normal"),ke(G_action_shoot),e){Ne(e),ot(e);const t=oe(e);t.actions[de()]||ke(G_action_shoot),Rt(e);for(let t=0;t<e.projectiles.length;t++){const n=e.projectiles[t],{x:o,y:l,meta:s}=v(n.px,n.py);Tt(o,l,s&&"Move"===s.type?"mv":"sm"),Ke("expl")}e.projectiles=[],w(e),it(e);const{x:n,y:o}=v(t.x,t.y);if(!t.dead){const t=e.baseFundsPerRound;p(G("banner-message3"),`All players granted $${t} at completion of the round.`),setTimeout(()=>{Dt(n,o-30,"+$"+t,g("light",pe()))},500),setTimeout(()=>{p(G("banner-message3"),"")},3e3)}}},it=e=>{let t=e.collisions,n=t.length;const o=e=>{const t=(G("res-"+e)||{}).parentElement;return!!t&&(t.remove(),!0)};if(n)for(let l=0;l<n;l++){const[n,s]=t[l],{x:a,y:r}=v(n.px,n.py),i=ne(n.meta.player,e),c=g("light",i.color);switch(G_getEntityType(s)){case G_entity.player:{if(n.meta.player===s.id)continue;Ke("playerDead");const t=ne(s.id,e),{x:o,y:l}=v(s.x,s.y);t.dead=!0,Dt(o,l,"Eliminated!",c),Lt(t.x,t.y,G_AU/2,7);break}case G_entity.projectile:Ke("expl"),Tt(a,r);break;case G_entity.coin:{Ke("coin"),Tt(a,r),o(s.id);const{x:e,y:t}=v(s.x,s.y);Dt(e,t,"+$"+s.value,c);break}case G_entity.spray:{Ke("getSpreadFire"),Tt(a,r),o(s.id);const{x:e,y:t}=v(s.x,s.y);Dt(e,t,"+2 SpreadFire",c);break}case G_entity.planetCracker:{Ke("getPC"),Tt(a,r),o(s.id);const{x:e,y:t}=v(s.x,s.y);Dt(e,t,"+2 PlanetCracker",c);break}case G_entity.cluster:{Ke("getCluster"),Tt(a,r),o(s.id);const{x:e,y:t}=v(s.x,s.y);Dt(e,t,"+2 ClusterBomb",c);break}case G_entity.planet:n.meta.type===G_action_planetCracker?(Ke("explLarge2"),Lt(s.px,s.py,G_AU,30)):n.meta.type===G_action_move?(Ke("playerDead2"),i.dead=!0,Dt(a,r,"Eliminated!",c),Lt(i.x,i.y,G_AU/2,10)):(Ke("expl"),Tt(a,r));break;case G_entity.wormhole:{Ke("wormhole");const{x:e,y:t}=v(n.meta.prevX,n.meta.prevY);It(a,r),It(e,t);break}case G_entity.nothing:default:Ke("expl"),Tt(a,r)}}e.collisions=[]},ct=e=>{const t=e.projectiles;for(let n=0;n<t.length;n++){const{meta:o,px:l,py:s}=t[n];if(o.player&&o.type===G_action_move){const t=ne(o.player,e);t.x=l,t.y=s}}},dt=e=>{Ge(e),Rt(he())};let pt=-1;const yt=()=>{const e=oe(he()),{x:t,y:n}=v(e.x,e.y),o=G("cc").style;o.transition="transform 0.5s",Qe.translateZoom({x:t,y:n,scale:.65}),clearTimeout(pt),pt=setTimeout(()=>{o.transition=""},500)},ut=(e,t)=>{j=e,te.forEach(n=>{const o=G(n);let l="none";e===n&&(l="flex",t&&t()),o.style.display=l})},ht=e=>{O=j,ut("dialog"),G("dialog-text").innerHTML=e},mt=e=>{if(he()&&e.result){const t=ne(e.result,e);t?t===oe(e)?Ke("win"):Ke("lose"):Ke("tie"),Ee(!1),$e(!0),Ne(e),Rt(e),w(e)}},gt=e=>{G("player-name-input").value=e,q=e,localStorage.setItem("js13k2020_orbital_forts_u",e)},ft=()=>me()||localStorage.getItem("js13k2020_orbital_forts_u")||"Player",bt=e=>{st(),jt([]),ut("menu"),ht(e)},_t=e=>{let t=G("c");if(e.changedTouches){const n=e.changedTouches[0],o=t.parentElement.style.transform,{left:l,top:s}=t.getBoundingClientRect(),a=parseFloat(o.slice(7,o.indexOf(",")));let{x:r,y:i}=x((n.clientX-l)/a,(n.clientY-s)/a);Re([r,i])}else{const{offsetX:t,offsetY:n}=e;let{x:o,y:l}=x(t,n);Re([o,l])}be()?(Bt(he()),w(he())):(Rt(he()),w(he()))},xt=e=>{if(!e)throw Error("no replay provided to start");const{initialGameData:t}=e;Ye(!0),$e(!1),Be(0),V=e,Bt(e,t),nt(t);const n=oe(t);Re([n.x,n.y+100]),yt()},vt=()=>{const e=_e(),t=he();e&&t&&($e(!0),Bt(e,t))},Gt=()=>{const e=_e(),t=he();if(clearInterval(et),b(()=>{const e=he();S(e)}),Se(!1),t){Bt(e,t);for(let e=0;e<t.projectiles.length;e++){const n=t.projectiles[e],{x:o,y:l,meta:s}=v(n.px,n.py);Tt(o,l,s&&"Move"===s.type?"mv":"sm")}t.projectiles=[];const n=xe();if(n+1>e.rounds.length)t.result=e.result,vt();else{const o=e.rounds[n];if(o.partialGameData){const e={...t,...o.partialGameData};Ne(e),ot(e)}}}},wt=()=>{if(!be())return;const e=_e(),t=xe(),n=e.rounds[t];n&&(((e,t)=>{let n=he();e.partialGameData&&(Ne({...n,...e.partialGameData}),n=he()),we(!1),Se(!0),G("particles").innerHTML="",Bt(t,n),w(n),Me([n]),Ke("shootNorm");const o=oe(n);o&&e.actions[o.id]&&Re(e.actions[o.id].target);for(let t in e.actions){const o=e.actions[t],l=ne(t,n);G_applyAction(n,l,o)}let l,s=+new Date,a=+new Date,r=0,i=0;et=setInterval(()=>{let t=he(),n=+new Date;l=n-s,s=n,G_simulate(t,{startTime:a,nowDt:l,now:s}),Ne(t);let o,c=s-a;if(e.snapshots){let n=!1;o=e.snapshots[i];let l=e.snapshots[i+1];for(;l&&l.timestamp<=c;)o=l,l=e.snapshots[i+1],i+=1,n=!0;n&&(t.projectiles=o.snapshot.projectiles,t.collisions=o.snapshot.collisions)}let{collisions:d}=t;if(r++,r>=10||d.length){r=0;const e=ie();e.push(St(t)),e.length>500&&e.shift()}},G_FRAME_MS),b(()=>{let e=he();w(e),it(e),ct(e);let{projectiles:t}=e;0===t.length&&Gt()})})(n,e),Be(t+1))},St=e=>JSON.parse(JSON.stringify(e));let $t=!1;const Et={0:"#00f",1:"#00f",2:"red",3:"red",4:"yellow",5:"yellow",6:"cyan",7:"cyan",8:"orange",9:"orange",10:"green",11:"green"};let Ct=0;const Mt=(e,t,n,o,l,s,a)=>{a=a||{};const r={position:"absolute",left:o+"px",top:l+"px",...a},i=document.createElement("div");i.className=n,"string"==typeof t?p(i,t):i.appendChild(t),i.id=s;for(let e in r)i.style[e]=r[e];return e.appendChild(i),i},At=e=>{const t=G("res"),{x:n,y:o,id:l,type:s}=e;let{label:a,content:r,offsetTop:i,elem:c}=G_res_sprites[s]||{};const d=s===G_res_wormhole;let p="",y="";const{x:u,y:h}=v(n,o),m=document.createElement(c);m.innerHTML=a||"";const g=Mt(m,r||"","resource "+s,u-100,h-i,"res-"+l);if(d){const e=Et[Ct];p=e,y=`radial-gradient(circle at 50% 120%, ${e}, ${e} 10%, rgb(75, 26, 63) 80%, #062745 100%)`,g.children[0].style.background=`radial-gradient(circle at 50% 0px, ${e}, rgba(255, 255, 255, 0) 58%)`,Ct++}p&&(g.style.color=p),y&&(g.style.background=y),m.style.left=g.style.left,m.style.top=g.style.top,m.className="res2 centered",g.style.position="unset",t.appendChild(m)},kt=e=>{const t=G("res");p(t,""),Ct=0;for(let t=0;t<e.length;t++)At(e[t])},Lt=(e,t,n,o)=>{for(let l=0;l<o;l++){const{x:s,y:a}=G_getRandomLocInCircle(e,t,n),{x:r,y:i}=v(s,a);setTimeout(()=>{Tt(r,i)},l/o*800)}},Tt=(e,t)=>{const n=e+","+t;G(n)||Mt(G("particles"),"","expl",e-50,t-50,n)},Dt=(e,t,n,o)=>{const l="text,"+e+","+t;G(l)||Mt(G("particles"),n,"text-particle",e-100,t,l,{color:o})},It=(e,t)=>{for(let n=0;n<10;n++){const o=G_normalize(n,0,10,0,360),l=`worm${n},${e},${t}`;if(G(l))return;Mt(G("particles"),'<div class="worm"></div>',"",e,t,l,{transform:`rotateZ(${o}deg)`})}},Rt=e=>{if(!e)return;const t=oe(e),n=N,o=ae(),l=t.dead,s=le();G("controls").style.display=se()||s||o||l?"none":"flex",G("center-self").style.display="block",G("confirm-button").style.display="block",G("control-panel").style.display="flex",G("leave-game").style.display=o||l?"block":"none",G("view-last-replay").style.display=o?"block":"none";let a="";Object.keys(G_SPEEDS).forEach(e=>{let[,t]=G_SPEEDS[e],o=e===ce()?f(pe()):"";a+=`<div class="action-label" style="pointer-events:${n?"none":"all"}">\n<div>Cost $${t}</div>\n<div class="action" style="${o}" id="${e}" onclick="events.setSpeed('${e}')" onmousedown="events.setSpeed('${e}')">${e}\n</div>\n</div>`}),p(G("speed-buttons"),a),G("back-practice").style.display=1===he().players.length?"block":"none";let r="";G_actions.forEach(([e,n],o)=>{const l=t.actions[e];l&&(r=Pt(e+(l<99?` (${l})`:""),"$"+n,e,o>1)+r)}),p(G("action-buttons"),r);const i=G_getActionCost(de())+G_getSpeedCost(ce());G("confirm-button").disabled=i>t.funds,p(G("funds"),"Funds: $"+t.funds);let c=G("target");const d=ue(),{x:y,y:u}=v(d[0],d[1]);c.style.display=se()||o||l?"none":"flex",c.style.left=y-30+"px",c.style.top=u-30+"px",c.style.stroke=g("",pe()),c.className="target";const h=G("x").cloneNode(!0);h.id="x2",h.style.display="block",p(c,""),c.appendChild(h),Nt(e)},Nt=(e,t,n)=>{const o=oe(e),l=ae(),s=o.dead,a=le(),r=G("banner-message"),i=G("banner-message2");if(p(r,""),p(i,""),l){const t=ne(e.result,e);return p(r,"The Game is Over!"),void p(i,t?`The Victor is <span style="${f(t.color)}">${t.name}</span>!`:"The result is a DRAW!")}if(n)p(r,"Viewing replay: "+n.name);else if(s)p(r,"You have been eliminated!");else if(!se())if(a){const e=(t=t||U).playersNotReady||[];if(0===e.length)return;p(r,"Waiting for other players: "+e.map(({playerName:e,color:t})=>`<span style="${f(t)}">${e}</span>`).join(", "))}else p(r,`You are the <span style="${f(o.color)}border:1px solid;padding:2px;">${o.color}</span> player.`),p(i,`<span style="color:${g("light",o.color)}">[Right Click/Dbl Tap]</span> to set Target.<br /> <span style="color:${g("light",o.color)}">[Left Click/Tap]</span> to pan.`)},jt=e=>{const t=G("games");p(t,"");for(let n=0;n<e.length;n++){const{id:o,name:l}=e[n];t.innerHTML+=`<button class="join-button" onclick="events.join('${o}')">${n+1}. Join Game: ${l}</button>`}e.length||p(t,'<span style="color:lightblue"> There are no joinable games at the moment.</span>'),p(G("map-select-practice"),Yt({ownerId:ye()},"menu-map-select"))},Ot=e=>{const{players:t}=e,n=G("players-lobby");p(n,"");for(let e=0;e<t.length;e++){const{id:o,userName:l}=t[e];n.innerHTML+=`<div class="lobby-player">${e+1}. ${o===ye()?`<a class="lobby-name">${l}</a>`:l}</div>`}const o=t[0].id===ye(),l=t.length>1&&t.length<=4,s=G("map-select");s.parentElement.style.padding=o?"":"0.5rem 0",p(s,Yt(e,"lobby-map-select")),p(G("lobby-title"),L),p(G("player-count"),`<a style="color:${l?"#12a012":"red"}">${t.length} of 4</a> joined (at least 2 required to start)`);const a=G("start");a.style.display=o?"block":"none",a.disabled=!l},Pt=(e,t,n,o)=>`<div class="h-button-list">\n<button class="action" onclick="events.setAction('${n}')" onmousedown="events.setAction('${n}')"\nstyle="${de()===n?f(pe()):""};width:80%;margin:2px;animation:${o?"2s linear infinite border-color;":""}">${e}</button>\n<div>${t}</div>\n</div>`,Yt=(e,t)=>{const n=ye()===e.ownerId,o=n?ge():e.mapIndex,l=fe(),s=o>-1&&o<l.length?l[o].name:"Custom Map",a=fe().reduce((e,t,n)=>e+`<option ${o===n?"selected":""} value=${n}>${t.name}</option>`,"");return n?`<select id="${t}" value="${o}" onchange="events.setMapIndex(this.id)">${a}</select>`:`<span style="color:lightblue;">${s}</span>`},Bt=(e,t)=>{if(!e)return;const n=ae();G("controls").style.display=se()?"none":"flex",G("control-panel").style.display="none",G("center-self").style.display="none",G("leave-game").style.display="none",G("view-last-replay").style.display="none",G("back-practice").style.display="block",G("confirm-button").style.display="none",p(G("speed-buttons"),""),p(G("action-buttons"),n?'\n<button onclick="events.viewLastReplay()">Restart Replay</button>\n    ':'\n  <button onclick="events.replayNextRound()">Simulate Round</button>\n    ');const o=xe();p(G("funds"),"Current Round: "+Math.min(o+1,e.rounds.length)+"/"+e.rounds.length),G("target").style.display="none",Nt(t,null,e)},Ft=()=>{const e=ve(),t=G("sound");t.style.background="white",t.src=e?"sound.svg":"no-sound.svg"}})();