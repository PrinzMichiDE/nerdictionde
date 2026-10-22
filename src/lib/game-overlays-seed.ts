// Lizenzfreie, self-contained HTML-Overlays (Original-Code, CC0).
// Werden in die GameOverlay-Tabelle gespiegelt und per OBS-Browser-Quelle eingebettet.

export interface GameOverlaySeed {
  name: string;
  slug: string;
  category: string;
  description: string;
  htmlCode: string;
  config: Record<string, unknown>;
  license: string;
  author: string;
  downloads: number;
}

const PARTICLE_BRB = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>BRB – Partikel</title>
<style>
  html,body{margin:0;height:100%;background:#0a0a0a;overflow:hidden;font-family:system-ui,sans-serif;}
  canvas{display:block;}
  .brb{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;color:#fff;text-shadow:0 2px 24px rgba(59,130,246,.7);pointer-events:none;}
  .brb h1{font-size:clamp(2.5rem,8vw,6rem);margin:0;letter-spacing:.05em;font-weight:800;}
  .brb p{opacity:.7;margin-top:.5rem;font-size:clamp(.9rem,2.5vw,1.4rem);}
</style>
</head>
<body>
<canvas id="c"></canvas>
<div class="brb"><h1>BE RIGHT BACK</h1><p>Stream pausiert – gleich geht's weiter</p></div>
<script>
const cv=document.getElementById('c'),x=cv.getContext('2d');
let w,h,ps;
function rs(){w=cv.width=innerWidth;h=cv.height=innerHeight;ps=Array.from({length:120},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,r:Math.random()*2.5+1,h:Math.random()*360}));}
rs();addEventListener('resize',rs);
(function loop(){x.clearRect(0,0,w,h);for(const p of ps){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=w;if(p.x>w)p.x=0;if(p.y<0)p.y=h;if(p.y>h)p.y=0;x.beginPath();x.fillStyle='hsl('+p.h+',80%,60%)';x.arc(p.x,p.y,p.r,0,7);x.fill();}requestAnimationFrame(loop);})();
</script>
</body>
</html>`;

const SNAKE = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Snake Overlay</title>
<style>
  html,body{margin:0;height:100%;background:transparent;overflow:hidden;font-family:system-ui,sans-serif;}
  #wrap{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;}
  canvas{background:rgba(10,10,10,.35);border:2px solid rgba(59,130,246,.5);border-radius:12px;max-width:90vmin;max-height:90vmin;touch-action:none;}
  #s{position:fixed;top:8px;left:12px;color:#fff;font-size:14px;text-shadow:0 1px 4px #000;}
</style>
</head>
<body>
<div id="wrap"><canvas id="g" width="400" height="400"></canvas></div>
<div id="s">Score: <b>0</b> · Pfeiltasten / WASD</div>
<script>
const cv=document.getElementById('g'),x=cv.getContext('2d');
const G=20,cw=cv.width/G,ch=cv.height/G;
let s=[{x:10,y:10}],d={x:1,y:0},f={x:15,y:15},sc=0;
const ky={(e)=>{const k=e.key.toLowerCase();if(k=='arrowup'||k=='w')d={x:0,y:-1};if(k=='arrowdown'||k=='s')d={x:0,y:1};if(k=='arrowleft'||k=='a')d={x:-1,y:0};if(k=='arrowright'||k=='d')d={x:1,y:0};}};
addEventListener('keydown',ky);
function step(){const h={x:s[0].x+d.x,y:s[0].y+d.y};if(h.x<0||h.y<0||h.x>=G||h.y>=G||s.some(p=>p.x==h.x&&p.y==h.y)){s=[{x:10,y:10}];d={x:1,y:0};sc=0;document.querySelector('#s b').textContent=0;return;}s.unshift(h);if(h.x==f.x&&h.y==f.y){sc++;document.querySelector('#s b').textContent=sc;f={x:Math.floor(Math.random()*G),y:Math.floor(Math.random()*G)};}else s.pop();}
function draw(){x.clearRect(0,0,cv.width,cv.height);x.fillStyle='#3b82f6';x.fillRect(f.x*cw,f.y*ch,cw-1,ch-1);x.fillStyle='#fff';for(const p of s)x.fillRect(p.x*cw,p.y*ch,cw-1,ch-1);}
setInterval(()=>{step();draw();},110);
</script>
</body>
</html>`;

const CLICKER = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Click Target</title>
<style>
  html,body{margin:0;height:100%;background:transparent;overflow:hidden;font-family:system-ui,sans-serif;cursor:crosshair;}
  #t{position:fixed;width:64px;height:64px;border-radius:50%;background:radial-gradient(circle at 30% 30%,#60a5fa,#1d4ed8);box-shadow:0 0 30px rgba(59,130,246,.8);transition:transform .08s;cursor:pointer;}
  #s{position:fixed;top:8px;left:12px;color:#fff;font-size:14px;text-shadow:0 1px 4px #000;}
</style>
</head>
<body>
<div id="s">Treffer: <b>0</b></div>
<script>
let sc=0,nx,ny;
function place(){nx=Math.random()*(innerWidth-80)+10;ny=Math.random()*(innerHeight-120)+60;const t=document.getElementById('t');t.style.left=nx+'px';t.style.top=ny+'px';}
const t=document.createElement('div');t.id='t';document.body.appendChild(t);
t.onclick=()=>{sc++;document.querySelector('#s b').textContent=sc;t.style.transform='scale(.7)';setTimeout(()=>t.style.transform='scale(1)',90);place();};
place();
</script>
</body>
</html>`;

const PONG = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<title>Pong Overlay</title>
<style>
  html,body{margin:0;height:100%;background:#0a0a0a;overflow:hidden;font-family:system-ui,sans-serif;}
  canvas{display:block;margin:auto;}
</style>
</head>
<body>
<canvas id="g" width="600" height="400"></canvas>
<script>
const cv=document.getElementById('g'),x=cv.getContext('2d');
let p={y:160},a={y:160},b={x:300,y:200,vx:4,vy:3},sc={p:0,a:0};
addEventListener('mousemove',e=>{const r=cv.getBoundingClientRect();p.y=(e.clientY-r.top)-40;});
addEventListener('touchmove',e=>{const r=cv.getBoundingClientRect();p.y=(e.touches[0].clientY-r.top)-40;e.preventDefault();},{passive:false});
function loop(){a.y+=(b.y-20-a.y)*0.08;if(a.y<0)a.y=0;if(a.y>320)a.y=320;
b.x+=b.vx;b.y+=b.vy;if(b.y<0||b.y>380)b.vy*=-1;
if(b.x<20&&b.y>p.y&&b.y<p.y+80){b.vx*=-1.05;b.vx=Math.min(b.vx,9);}
if(b.x>580&&b.y>a.y&&b.y<a.y+80){b.vx*=-1.05;b.vx=Math.max(b.vx,-9);}
if(b.x<0){sc.a++;b={x:300,y:200,vx:4,vy:3};}if(b.x>600){sc.p++;b={x:300,y:200,vx:-4,vy:3};}
x.fillStyle='#0a0a0a';x.fillRect(0,0,600,400);x.fillStyle='#3b82f6';x.fillRect(10,p.y,10,80);x.fillStyle='#fff';x.fillRect(580,a.y,10,80);x.fillStyle='rgba(255,255,255,.6)';x.beginPath();x.arc(b.x,b.y,8,0,7);x.fill();
x.fillStyle='#fff';x.font='20px sans-serif';x.fillText(sc.p,260,30);x.fillText(sc.a,320,30);
requestAnimationFrame(loop);}loop();
</script>
</body>
</html>`;

export const GAME_OVERLAY_SEED: GameOverlaySeed[] = [
  {
    name: "BRB – Partikel-Hintergrund",
    slug: "brb-particle",
    category: "animated",
    description: "Animierter Partikel-Hintergrund für 'Be Right Back'-Szenen. Keine Interaktion nötig.",
    htmlCode: PARTICLE_BRB,
    config: {},
    license: "CC0",
    author: "Nerdiction",
    downloads: 0,
  },
  {
    name: "Snake (BRB-Minispiel)",
    slug: "snake",
    category: "minigame",
    description: "Klassisches Snake als lizenzfreies Minispiel für die Webcam-Lücke. Steuerung per Pfeiltasten/WASD.",
    htmlCode: SNAKE,
    config: {},
    license: "CC0",
    author: "Nerdiction",
    downloads: 0,
  },
  {
    name: "Click-Target",
    slug: "click-target",
    category: "chat-game",
    description: "Klick-Spiel für Streamer: Zuschauer-Voting via Chat steuert die Maus. Reiner Klick-Score.",
    htmlCode: CLICKER,
    config: {},
    license: "CC0",
    author: "Nerdiction",
    downloads: 0,
  },
  {
    name: "Pong (Duel)",
    slug: "pong",
    category: "minigame",
    description: "Pong gegen die KI – Maus/Touch steuert den linken Schläger. Perfekt für Stream-Duelle.",
    htmlCode: PONG,
    config: {},
    license: "CC0",
    author: "Nerdiction",
    downloads: 0,
  },
];
