(()=>{function e(e){let t={"&":"&amp;",'"':"&quot;","<":"&lt;",">":"&gt;"};return e.replace(/[&"<>]/g,e=>t[e])}const t={},a=e=>e[0].id,n=e=>e[2],s=(e,t)=>e[2]=t,r=e=>e[1],o=(e,t)=>e[1]=t,i=e=>e[1]=null,l=e=>"No game for user: "+n(e),c=(e,t)=>[e,t],d=(e,t)=>JSON.stringify([e,t]),m=e=>async(t,a)=>{try{await e(t,a)}catch(e){console.error("ERROR",e.stack),a.send(d(null,"Error."))}},u=()=>{const e=[],a=t=>{for(let a=0;a<e.length;a++)if(e[a].id===t)return!0};for(const n in t){const s=r(t[n]);s&&(a(s.id)||e.push(s))}return e},p=()=>u().filter(e=>!e.isStarted()&&!e.isPractice()&&e.getPlayers().length<4),g=()=>{((e,a,n)=>{for(const n in t){if(void 0===n)continue;const[s]=t[n];s.emit(e,a)}})(G_S_LIST_UPDATED,c(p()))},y=(e,a,n)=>{const s=(e=>t[e])(e);return s?(e=>e[3])(s)!==a.headers.key?(n.send(d(null,"Unauthorized (invalid key): id="+e)),!1):s:(n.send(d(null,"No user: id="+e)),!1)},h={[G_R_CREATE+"/:id/:userName/:isPractice"]:m(async(t,a)=>{let{id:i,userName:l,isPractice:c}=t.params;const m=y(i,t,a);if(!m)return;if(l=e(l),!l)return void a.send(d(null,"No given userName."));if(r(m))return void a.send(d(null,(e=>"User in another game: "+n(e))(m)));if(u().length>=10)return void a.send(d(null,(e=>"Max games supported exceeded: "+n(e))(m)));s(m,l);const p=l+"'s Game",h=S(m,p);o(m,h),"true"===c&&await h.setPractice(),a.send(d({id:h.id,name:p,lobbyData:h.getLobbyData()})),g()}),[G_R_UPDATE_LOBBY+"/:id/:args"]:m(async(e,t)=>{const{id:a,args:n}=e.params,[s]=n.split(","),o=y(a,e,t);if(!o)return;const i=r(o);i?(await i.setMapIndex(s),i.updateLobbyData(),t.send(d({id:i.id,name:i.name,lobbyData:i.getLobbyData()}))):t.send(d(null,l(o)))}),[G_R_JOIN+"/:id/:args"]:m(async(t,a)=>{const{id:r,args:i}=t.params,c=i.indexOf(","),m=i.slice(0,c);let p=i.slice(c+1);const h=y(r,t,a);if(!h)return;p=e(p||"");const _=(e=>u().reduce((t,a)=>a.id===e?a:t,null))(m);_?(o(h,_),s(h,p),n(h),await _.join(h)?(a.send(d({id:_.id,name:_.name,lobbyData:_.getLobbyData()})),g()):a.send(d(null,"Cannot join."))):a.send(d(null,l(h)))}),[G_R_LEAVE+"/:id"]:m((e,t)=>{const{id:a}=e.params,s=y(a,e,t);if(!s)return;const o=r(s);o?(n(s),i(s),o.leave(s),t.send(d(o.id)),g()):t.send(d(null,l(s)))}),[G_R_START+"/:id/:mapIndex"]:m(async(e,t)=>{const{id:a,mapIndex:s}=e.params,o=y(a,e,t);if(!o)return;const i=r(o);i?i.canStart()?(n(o),t.send(d(!0)),await i.setMapIndex(+s),await i.start(),g()):t.send(d(null,"Cannot start yet.")):t.send(d(null,l(o)))}),[G_R_CONFIRM_ACTION+"/:id/:action/:args"]:m((e,t)=>{const{id:a,action:s,args:o}=e.params,i=y(a,e,t);if(!i)return;const c=r(i);c?c.isStarted()?c.confirmAction(s,o,i)?(n(i),t.send(d(!0))):t.send(d(null,"Cannot confirm.")):t.send(d(null,"Game not started.")):t.send(d(null,l(i)))}),io:async e=>{const a=G_randomId(),n=((e,t)=>[e,"","",t])(e,a);t[e.id]=n,e.on("disconnect",m(()=>{(e=>{const[a,n]=e;n&&n.leave(e),delete t[a]})(n)}));const s=await _();e.emit(G_S_CONNECTED,c({games:p(),maps:s.map(e=>({name:e.name})),id:e.id,key:a}))}};module.exports=h;const _=async()=>await storage.get("maps");let f=0;const G=async()=>{if(0===f){const e=await _();f=e.length}return f},S=(e,t)=>{let s,r,o,l,d=[e],m=0,u=!1,p=!1,y=null,h=1,f=0,S=25/G_SCALE,D=175,b=0,I={version:"1.0",date:+new Date,name:t,players:[],states:[],initialGameData:null,map:null};const R=["blue","red","green","yellow"],L=()=>{try{let e=+new Date;r=e-s,s=e,G_simulate(y,{startTime:m,nowDt:r,now:s});let{projectiles:t,collisions:a}=y;if(0===t.length)return void x();f++;const n=f>=10;(n||a.length)&&(((e,t,a)=>{k.emitAll(G_S_BROADCAST,c({i:e,col:t,timestamp:+new Date,gameData:a}))})(h++,a.length>0&&!n,y),w(I,s-m,y),n&&(f=0))}catch(e){console.error("error running simulation",e),x()}},v=()=>{m=s=+new Date,r=0,k.emitAll(G_S_START_SIMULATION,c(y)),l=setTimeout(x,y.maxRoundLength),o=setInterval(L,G_FRAME_MS)},x=()=>{try{if(u){k.emitAll(G_S_STOP_SIMULATION,c(y)),clearInterval(o),o=-1,clearTimeout(l),l=-1,y.projectiles=[],y.collisions=[];const e=O();e?(k.finished=!0,k.finish(e)):(y.players.forEach(e=>{e.ready=!1,e.funds+=25}),j(),E(I,y))}}catch(e){console.error("Error stopping game",e.stack)}},P=(e,t)=>{const n="string"==typeof e?e:a(e);return t.players.reduce((e,t)=>t.id===n?t:e,null)},M=()=>y.players.reduce((e,t)=>e&&(!!t.dead||t.ready),!0),O=()=>{if(p)return!1;let e=[];for(let t=0;t<y.players.length;t++){const a=y.players[t];a.dead||e.push(a)}return 0===e.length?"draw":1===e.length&&e[0].id},C=()=>{k.emitAll(G_S_LOBBY_DATA,c(k.getLobbyData()))},j=()=>{k.emitAll(G_S_GAME_METADATA,c(k.getGameMetadata()))},k={id:a(e),name:t,getPlayers:()=>d.map(e=>({id:a(e),userName:n(e)})),getLobbyData:()=>({mapIndex:b,ownerId:a(e),players:k.getPlayers()}),getGameMetadata:()=>({playersNotReady:y.players.filter(e=>!e.dead&&!e.ready).map(e=>({playerName:e.name,color:e.color})),timer:30}),updateLobbyData:C,updateGameMetadata:j,join:async e=>u||p?(console.error("Cannot join"),!1):d.length<4&&(d.push(e),C(),!0),leave(e){for(let t=0;t<d.length;t++){const a=d[t];if(a===e){if(d.splice(t,1),i(a),u){const e=P(a,y);return 0===d.length?k.stop():e.dead||(e.dead=!0),O()?k.stop():M()&&setTimeout(()=>{try{v()}catch(e){console.error("Error starting",e.stack)}},500),!0}return 0===t?k.stop():C(),!0}}return!1},async start(){u=!0;const e=await _();y=((e,s)=>{let r=(e=>{let t=e.length;e=[...e];const a=[];for(let n=0;n<t;n++){const t=Math.floor(Math.random()*e.length);a.push(e[t]),e.splice(t,1)}return a})(e);const{width:o,height:i,playerLocations:l}=s,c={name:t,mapName:s.name,width:o,height:i,mapIndex:b,players:[],planets:[],resources:[],projectiles:[],collisions:[],fields:[],result:!1,baseFundsPerRound:25,maxRoundLength:s.maxRoundLength};for(let e=0;e<r.length;e++){const t=r[e],{x:s,y:o,r:i}=l[e],d=G_getRandomLocInCircle(s,o,i);let m={};for(let e in G_actions)m[G_actions[e][0]]=e<=1?99:0;c.players.push({id:a(t),name:n(t),funds:D,actions:m,ready:!1,dead:!1,hp:1,color:R[e],r:S,...d,target:[d.x,d.y]})}return G_createEntities(c,s,{}),c})(d,e[b]),y.isPractice=p,I=A(y),E(I,y),k.emitAll(G_S_START,c({startTime:m,gameData:y})),j()},stop(){x(),k.emitAll(G_S_STOP,c("The game was stopped.")),d.forEach(e=>{i(e)}),g()},finish(e){y.result=e,I.result=e,k.emitAll(G_S_FINISHED,c({gameData:y,replay:I})),d.forEach(e=>{i(e)}),g(),p||N(I)},setPractice(){p=!0,D=1e5},async setMapIndex(e){const t=await G();e>=0&&e<t&&(b=e)},confirmAction(e,t,a){const n=P(a,y);if(!n||n.dead)return console.error("No player exists in game or player is dead.",a),!1;const[s,r,o]=t.split(","),i=G_getNormalizedVec([s-n.x,r-n.y]),l=G_SPEEDS[o]&&G_SPEEDS[o][0]||G_SPEEDS.normal[0],c=((e,t,a)=>{const n=G_getActionCost(e)+G_getSpeedCost(t);return P(a,y).funds>n&&n})(e,o,a);if(!1===c)return!1;const d={action:e,speed:l,vec:i,target:[s,r],cost:c};return T(I,n,d),G_applyAction(y,n,d),n.ready=!0,M()&&setTimeout(()=>{try{v()}catch(e){console.error("Error starting",e.stack)}},500),j(),!0},canStart:()=>!!p||d.length>1&&d.length<=4&&!u,isPractice:()=>p,isStarted:()=>u,getReplay:()=>I,emitAll(e,t){d.forEach(a=>{const[n]=a;n.emit(e,t)})}};return k},A=e=>{const t={version:1.2};return t.id=G_randomId(),t.date=+new Date,t.name=e.name,t.mapName=e.mapName,t.initialGameData=JSON.parse(JSON.stringify(e)),t.rounds=[],t.result=null,t},D=e=>({fields:e.fields.map(R),planets:e.planets.map(L),players:e.players.map(b),resources:e.resources.map(I)}),E=(e,t)=>{e.rounds.push({roundNumber:e.rounds.length,partialGameData:D(t),actions:{},snapshots:[]})},T=(e,t,{action:a,speed:n,vec:s,cost:r,target:o})=>{e.rounds[e.rounds.length-1].actions[t.id]={action:a,speed:n,vec:s,cost:r,target:o}},w=(e,t,a)=>{e.rounds[e.rounds.length-1].snapshots.push({timestamp:t,snapshot:{timestamp:t,projectiles:a.projectiles.map(L),collisions:a.collisions.map(v),fields:a.fields.map(R)}})},N=async e=>{try{let t=await storage.get("replays");t||(t=[]),t.length>25&&t.shift(),t.push(e),await storage.set("replays",t)}catch(e){console.error("error saving replay",e.stack)}},b=e=>({...e,actions:{...e.actions}}),I=e=>({...e}),R=e=>({...e}),L=e=>({...e,meta:{...e.meta}}),v=([e,t])=>[{...e,meta:{...e.meta}},t?{...t}:null]})();