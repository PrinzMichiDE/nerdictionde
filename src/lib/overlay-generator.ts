// Generates self-contained HTML overlays for OBS from a simple config.
// All output is dependency-free, transparent background where useful, CC0.

export type OverlayTemplate =
  | "brb"
  | "starting"
  | "alert"
  | "countdown"
  | "chatbox";

export interface OverlayConfig {
  template: OverlayTemplate;
  title: string;
  subtitle?: string;
  color1: string; // primary
  color2: string; // accent
  textColor?: string;
  targetDate?: string; // ISO for countdown
  font?: string;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string)
  );
}

function baseStyles(c: OverlayConfig): string {
  const font = c.font || "system-ui, -apple-system, Segoe UI, Roboto, sans-serif";
  const text = c.textColor || "#ffffff";
  return `html,body{margin:0;height:100%;background:transparent;overflow:hidden;font-family:${font};color:${text};}*::selection{background:transparent;}`;
}

export function buildOverlayHtml(config: OverlayConfig): string {
  const { template, color1, color2 } = config;

  if (template === "brb") {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>BRB</title><style>${baseStyles(
      config
    )}
    .wrap{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:radial-gradient(circle at 50% 40%, ${color1}22, transparent 60%);}
    h1{font-size:clamp(3rem,10vw,8rem);font-weight:900;letter-spacing:.04em;margin:0;background:linear-gradient(90deg,${color1},${color2});-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 4px 40px ${color1}55;}
    p{font-size:clamp(1rem,3vw,2rem);opacity:.85;margin-top:1rem;}
    .dots{margin-top:2rem;display:flex;gap:10px}.dots i{width:14px;height:14px;border-radius:50%;background:${color1};animation:b 1.2s infinite}.dots i:nth-child(2){animation-delay:.2s}.dots i:nth-child(3){animation-delay:.4s}
    @keyframes b{0%,80%,100%{transform:scale(.4);opacity:.4}40%{transform:scale(1);opacity:1}}</style></head>
    <body><div class="wrap"><h1>${esc(config.title || "BE RIGHT BACK")}</h1><p>${esc(
      config.subtitle || "Bin gleich wieder da"
    )}</p><div class="dots"><i></i><i></i><i></i></div></div></body></html>`;
  }

  if (template === "starting") {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Starting Soon</title><style>${baseStyles(
      config
    )}
    .wrap{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;background:linear-gradient(135deg,${color1}1a,${color2}1a);}
    .ring{width:160px;height:160px;border-radius:50%;border:6px solid ${color1}33;border-top-color:${color1};animation:spin 1.4s linear infinite;margin-bottom:2rem}
    h1{font-size:clamp(2.5rem,8vw,6rem);font-weight:900;margin:0;background:linear-gradient(90deg,${color1},${color2});-webkit-background-clip:text;background-clip:text;color:transparent}
    p{font-size:clamp(1rem,3vw,1.6rem);opacity:.8;margin-top:1rem}
    @keyframes spin{to{transform:rotate(360deg)}}</style></head>
    <body><div class="wrap"><div class="ring"></div><h1>${esc(
      config.title || "STARTING SOON"
    )}</h1><p>${esc(config.subtitle || "Der Stream beginnt in Kürze")}</p></div></body></html>`;
  }

  if (template === "alert") {
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Alert</title><style>${baseStyles(
      config
    )}
    .box{position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);min-width:380px;max-width:80vw;padding:28px 40px;border-radius:18px;background:linear-gradient(135deg,${color1}cc,${color2}cc);box-shadow:0 20px 80px ${color1}66;text-align:center;animation:pop .5s ease}
    .t{font-size:1rem;text-transform:uppercase;letter-spacing:.2em;opacity:.9}
    .n{font-size:clamp(1.6rem,5vw,3rem);font-weight:900;margin-top:6px}
    @keyframes pop{0%{transform:translate(-50%,-50%) scale(.6);opacity:0}100%{transform:translate(-50%,-50%) scale(1);opacity:1}}</style></head>
    <body><div class="box"><div class="t">${esc(
      config.subtitle || "Neuer Follower"
    )}</div><div class="n">${esc(config.title || "Nerdiction")}</div></div></body></html>`;
  }

  if (template === "countdown") {
    const target = config.targetDate ? new Date(config.targetDate).getTime() : Date.now() + 3600000;
    return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Countdown</title><style>${baseStyles(
      config
    )}
    .wrap{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center}
    h2{font-size:clamp(1.2rem,4vw,2.4rem);font-weight:700;opacity:.85;margin:0 0 1rem}
    #c{font-size:clamp(3rem,14vw,11rem);font-weight:900;font-variant-numeric:tabular-nums;background:linear-gradient(90deg,${color1},${color2});-webkit-background-clip:text;background-clip:text;color:transparent}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.55}}</style></head>
    <body><div class="wrap"><h2>${esc(
      config.title || "Stream startet in"
    )}</h2><div id="c">--:--:--</div></div>
    <script>const T=${target};function t(){const d=T-Date.now();if(d<0){document.getElementById('c').textContent='LIVE';return;}const h=Math.floor(d/3.6e6),m=Math.floor(d%3.6e6/6e4),s=Math.floor(d%6e4/1e3);document.getElementById('c').textContent=[h,m,s].map(n=>String(n).padStart(2,'0')).join(':');}setInterval(t,1000);t();</script></body></html>`;
  }

  // chatbox
  return `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><title>Chatbox</title><style>${baseStyles(
    config
  )}
  .chat{position:fixed;left:24px;bottom:24px;width:340px;max-width:80vw;display:flex;flex-direction:column;gap:8px}
  .msg{background:${color1}22;border-left:3px solid ${color1};padding:8px 12px;border-radius:8px;backdrop-filter:blur(6px)}
  .msg b{color:${color2}}
  @keyframes in{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .msg{animation:in .3s ease}</style></head>
  <body><div class="chat" id="c">
  <div class="msg"><b>Nerdiction:</b> Willkommen im Chat! 🎮</div>
  </div></body></html>`;
}
