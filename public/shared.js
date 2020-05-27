const G_R_CREATE="create",G_R_JOIN="join",G_R_LEAVE="leave",G_R_START="start",G_R_UPDATE_LOBBY="update-lobby",G_R_CONFIRM_ACTION="confirm",G_R_GET_REPLAYS_LIST="replays",G_R_GET_REPLAY="replay",G_S_CONNECTED="s-connected",G_S_LIST_UPDATED="s-game-list",G_S_CREATE="s-create",G_S_START="s-start",G_S_LOBBY_DATA="s-lobby-data",G_S_GAME_METADATA="s-game-meta",G_S_LEAVE="s-leave",G_S_JOIN="s-join",G_S_STOP="s-stop",G_S_BROADCAST="s-broadcast",G_S_START_SIMULATION="s-simulate-start",G_S_STOP_SIMULATION="s-simulate-stop",G_S_FINISHED="s-finished",G_G=667428e-16,G_AU=1496e8,G_SCALE=75/G_AU,G_FRAME_MS=13.3333;let G_SPEEDS={Normal:[55e3,0],Super:[125e3,75]};const G_action_move="Move",G_action_shoot="Shoot",G_action_spread="Spread Fire",G_action_planetCracker="Planet Crkr.",G_action_cluster="Cluster Bomb",G_action_clusterSpawn="Cluster Spawn",G_res_coin="coin",G_res_spray="spread",G_res_planetCracker="planet-cracker",G_res_cluster="cluster",G_res_wormhole="wormhole",G_res_sprites={coin:{elem:"div",label:"",offsetTop:25,content:"$"},spread:{elem:"div",label:"Spread Fire",offsetTop:45,content:"!"},"planet-cracker":{elem:"div",label:"Planet Crkr.",offsetTop:45,content:"!"},cluster:{elem:"div",label:"Cluster Bomb",offsetTop:45,content:"!"},wormhole:{elem:"div",label:"",offsetTop:32,content:"<div></div>"}};let G_actions=[["Move",50],["Shoot",0],["Spread Fire",100],["Planet Crkr.",200],["Cluster Bomb",150]];const G_entity={nothing:"ent_nothing",player:"ent_player",planet:"ent_planet",projectile:"ent_projectile",coin:"ent_res_coin",planetCracker:"ent_res_planet_cracker",spray:"ent_res_spread",cluster:"ent_res_cluster",wormhole:"ent_res_wormhole"},G_randomId=()=>(+new Date*Math.random()).toString(16),G_normalize=(e,t,r,a,o)=>a+(e-t)*(o-a)/(r-t);let G_getActionCost=e=>G_actions.reduce((t,[r,a])=>r===e?a:t,0),G_getSpeedCost=e=>G_SPEEDS[e][1];const G_getRandomLocInCircle=(e,t,r)=>{let a=2*Math.PI*Math.random(),o=Math.sqrt(Math.random())*r;return{x:e+o*Math.cos(a),y:t+o*Math.sin(a)}},G_getNormalizedVec=([e,t])=>{const r=Math.sqrt(e*e+t*t);return[e/r,t/r]},getPlayerByPlayerId=(e,t)=>{const r=e;return t.players.reduce((e,t)=>t.id===r?t:e,null)},G_Body=(e,t,r,a,o,s,n,l,c)=>({meta:e,mass:t,color:r,r:a,vx:o,vy:s,px:n,py:l,t:c}),G_createEntities=(e,t,{createPlanets:r=!0}={})=>{const{planetLocations:a,resourceLocations:o}=t;if(r)for(let t=0;t<a.length;t++){const r=a[t],{x:o,y:s,mass:n,color:l,r:c,posR:_}=r,p=G_getRandomLocInCircle(o,s,_);e.planets.push(G_Body({color:l,type:"planet"},n,l,c,0,0,p.x,p.y))}for(let t=0;t<o.length;t++){const r=o[t],{x:a,y:s,posR:n}=r;e.resources.push({...r,id:G_randomId(),...G_getRandomLocInCircle(a,s,n)})}},G_getEntityType=e=>{switch(!0){case!e:return"ent_nothing";case!(!e.color||!e.name):return"ent_player";case(e=>e.meta&&e.meta.proj)(e):return"ent_projectile";case(e=>"coin"===e.type)(e):return G_entity.coin;case(e=>"spread"===e.type)(e):return G_entity.spray;case(e=>"planet-cracker"===e.type)(e):return G_entity.planetCracker;case(e=>!!e.color)(e):return"ent_planet";case(e=>"cluster"===e.type)(e):return G_entity.cluster;case(e=>"wormhole"===e.type)(e):return G_entity.wormhole;default:return"ent_nothing"}},G_applyGravity=(e,t,r,a)=>{const o=(e,t)=>Math.sqrt(e**2+t**2),s=(e,t,r,a)=>o(e,t)<=r+a,n=(e,t)=>{let{px:r,py:a,mass:n,r:l}=e,{px:c,py:_,mass:p,r:i}=t,y=c-r,m=_-a,G=Math.max(o(y,m),.001),d=s(y,m,l,i),u=G_G*n*p/G**2,h=Math.atan2(m,y);return{fx:Math.cos(h)*u,fy:Math.sin(h)*u,c:d}};let l=[],c=172800*a/13.3333;for(let a=0;a<e.length;a++){let o=e[a],_=0,p=0;for(let e=0;e<t.length;e++){let r=t[e];if(o===r)continue;let{fx:a,fy:s,c:c}=n(o,r);c?l.push([o,r]):(_+=a,p+=s)}for(let e=0;e<r.length;e++){let t=r[e],{x:a,y:n,r:c}=t;s(a-o.px,n-o.py,c,o.r)&&o.meta.player!==t.id&&l.push([o,t])}o.vx+=_/o.mass*c,o.vy+=p/o.mass*c,o.px+=o.vx*c,o.py+=o.vy*c}return l},G_applyAction=(e,t,r)=>{const{action:a,speed:o,target:[s,n],vec:l,cost:c}=r,_=G_createProjectiles({type:a,speed:o,normalizedVec:l,player:t},e);e.projectiles=e.projectiles.concat(_),t.target=[s,n],t.funds-=c,t.cost=c,t.actions[a]-=t.actions[a]<99?1:0,t.action=a},G_createProjectiles=({type:e,speed:t,normalizedVec:r,player:a,pos:o},s)=>{const n=(e,t)=>{const{round:r,cos:a,sin:o,PI:s}=Math,n=a(t*=s/180),l=o(t);return[r(1e4*(e[0]*n-e[1]*l))/1e4,r(1e4*(e[0]*l+e[1]*n))/1e4]},l=[];let c=1,_=5/G_SCALE,p=s.maxRoundLength,i=r[0],y=r[1],{color:m,x:G,y:d}=a;o&&(G=o.x,d=o.y);const u=(r,o)=>G_Body({proj:!0,type:e,id:G_randomId(),player:a.id,speed:t,color:a.color},c,m,_,r*t,o*t,G,d,p);switch(e){case"Spread Fire":for(let e=-5;e<=5;e+=5){let[t,a]=n(r,e);l.push(u(t,a))}break;case"Planet Crkr.":_=20/G_SCALE,c=10,l.push(u(i,y));break;case"Cluster Bomb":p=2e3,_=10/G_SCALE,l.push(u(i,y));break;case"Cluster Spawn":_=5/G_SCALE,p=4500;for(let e=0;e<360;e+=10){let[t,a]=n(r,e);l.push(u(t,a)),p+=50}break;case"Move":p=1e3,_=15/G_SCALE;default:l.push(u(i,y))}return l},G_handleCollision=(e,t)=>{const r=(e,t)=>{const r=((e,t)=>t.resources.reduce((t,r,a)=>r.id===e?a:t,-1))(e,t);r>-1&&t.resources.splice(r,1)},a=(e,t,r)=>()=>{r.projectiles=[...r.projectiles,...G_createProjectiles({type:"Cluster Spawn",speed:G_SPEEDS.Normal[0],normalizedVec:[0,1],player:t,pos:{x:e.px,y:e.py}},r)]},[o,s]=e;let n=getPlayerByPlayerId(o.meta.player,t),l=o.meta.type;switch(G_getEntityType(s)){case"ent_player":if(n=getPlayerByPlayerId(s.id,t),n.dead=!0,o.meta.remove=!0,"Cluster Bomb"===l)return{cb:a(o,n,t)};break;case"ent_projectile":if(s.meta.player===o.meta.player)return{remove:!0};const e=o.meta.speed*o.mass,c=s.meta.speed*s.mass;if(e>=c&&(s.meta.remove=!0),c>=e&&(o.meta.remove=!0),"Cluster Bomb"===l)return{cb:a(o,n,t)};break;case G_entity.coin:n.funds+=s.value,r(s.id,t);break;case G_entity.spray:n.actions["Spread Fire"]+=2,r(s.id,t);break;case G_entity.planetCracker:n.actions["Planet Crkr."]+=2,r(s.id,t);break;case G_entity.cluster:n.actions["Cluster Bomb"]+=2,r(s.id,t);break;case"ent_planet":if(o.meta.remove=!0,"Move"===l)n.dead=!0;else if("Planet Crkr."===l)s.meta.remove=!0;else if("Cluster Bomb"===l)return{cb:a(o,n,t)};break;case G_entity.wormhole:const{px:_,py:p,r:i}=o,{x:y,y:m,r:G}=s,d=y-_,u=m-p,[h,S]=G_getNormalizedVec([d,u]),C=G_getCorrespondingWormhole(s,t),f=h*(G+i+1)+C.x,g=S*(G+i+1)+C.y;o.meta.prevX=o.px,o.meta.prevY=o.py,o.px=f,o.py=g;break;case"ent_nothing":if("Cluster Bomb"===l)return{cb:a(o,n,t)}}return{}},G_simulate=(e,{now:t,nowDt:r,startTime:a})=>{const o=(e,t,r)=>{const{width:a,height:o}=r;return e>=-a&&e<=a&&t>=-o&&t<=o},s=(e,t,r,a)=>{const s=getPlayerByPlayerId(e,a);o(t,r,a)&&(s.x=t,s.y=r)};let n=e,{projectiles:l,planets:c,players:_,resources:p}=n,i=[],y=G_applyGravity(l,l.concat(c),_.filter(e=>!e.dead).concat(p),r);e.collisions=y;for(let t=0;t<y.length;t++){const{remove:r,cb:a}=G_handleCollision(y[t],e);r&&(y.splice(t,1),t--),a&&i.push(a)}for(let r=0;r<l.length;r++){const n=l[r];if("Move"===n.meta.type&&(getPlayerByPlayerId(n.meta.player,e).dead?n.meta.remove=!0:s(n.meta.player,n.px,n.py,e)),n.meta.remove)l.splice(r,1),r--;else if(t-a>=n.t||!o(n.px,n.py,e)){const t=[n,null];o(n.px,n.py,e);const{remove:a,cb:s}=G_handleCollision(t,e);"Move"===n.meta.type||a||y.push(t),s&&i.push(s),l.splice(r,1),r--}}for(let e=0;e<c.length;e++)c[e].meta.remove&&(c.splice(e,1),e--);for(let e=0;e<i.length;e++)i[e]()},G_getCorrespondingWormhole=(e,t)=>{const r=t.resources.filter(e=>"wormhole"===e.type),a=r.indexOf(e);return a%2==0?r[a+1]:r[a-1]};