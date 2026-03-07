import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=Inter:wght@300;400;500;600;700&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --p0:#f0d0ff;--p1:#d49eff;--p2:#bc6cff;--p3:#9d4edd;
  --p4:#7b2cbf;--p5:#5a189a;--p6:#3c096c;--p7:#10002b;
  --dark:#07020f;--deep:#0a0118;
}
html{scroll-behavior:smooth}
body{font-family:'Inter',sans-serif;background:var(--dark);color:#fff;overflow-x:hidden;cursor:none}
::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:var(--p3);border-radius:4px}
::selection{background:var(--p2);color:#000}

/* CURSOR */
#cur{position:fixed;pointer-events:none;z-index:99999;mix-blend-mode:screen}
.c-dot{position:absolute;width:8px;height:8px;border-radius:50%;background:var(--p1);box-shadow:0 0 12px var(--p2);transform:translate(-50%,-50%)}
.c-ring{position:absolute;width:36px;height:36px;border-radius:50%;border:1.5px solid rgba(188,108,255,.5);transform:translate(-50%,-50%);transition:width .15s,height .15s,opacity .2s}
body:has(a:hover) .c-ring,body:has(button:hover) .c-ring{width:56px;height:56px;border-color:var(--p1);opacity:.7}

/* STARS */
#stars-canvas{position:fixed;inset:0;z-index:0;pointer-events:none}

/* NOISE */
body::before{content:'';position:fixed;inset:0;z-index:1;pointer-events:none;opacity:.025;
  background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size:128px}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:18px 40px;
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(to bottom,rgba(7,2,15,.85),transparent);backdrop-filter:blur(4px)}
.nav-logo{font-family:'Syne',sans-serif;font-weight:800;font-size:1.3rem;letter-spacing:-.02em;
  background:linear-gradient(135deg,var(--p1),var(--p3));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.nav-links{display:flex;gap:28px}
.nav-links a{color:rgba(255,255,255,.4);font-size:.78rem;font-weight:500;text-decoration:none;letter-spacing:.04em;transition:color .3s}
.nav-links a:hover{color:var(--p1)}
.nav-cta{padding:9px 22px;border-radius:999px;font-size:.78rem;font-weight:700;
  background:linear-gradient(135deg,var(--p3),var(--p4));color:#fff;border:none;cursor:none;
  box-shadow:0 0 20px rgba(157,78,221,.3);transition:box-shadow .3s,transform .2s}
.nav-cta:hover{box-shadow:0 0 36px rgba(188,108,255,.5);transform:scale(1.04)}

/* LOADER */
.loader{position:fixed;inset:0;z-index:10000;background:var(--dark);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  transition:opacity .8s ease,transform .8s ease}
.loader.out{opacity:0;transform:scale(1.08);pointer-events:none}
.loader-hex{width:90px;height:104px;position:relative;margin-bottom:28px}
.hex{position:absolute;inset:0;clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  border:2px solid transparent;animation:hexSpin 2s linear infinite}
.hex.h1{border-color:var(--p2);animation-duration:3s}
.hex.h2{inset:12px;border-color:var(--p3);animation-direction:reverse;animation-duration:2s}
.hex.h3{inset:24px;border-color:var(--p4);animation-duration:1.5s}
.hex-c{position:absolute;inset:34px;background:radial-gradient(circle,var(--p3),var(--p5));
  clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);
  animation:hexPulse 2s ease-in-out infinite}
@keyframes hexSpin{to{transform:rotate(360deg)}}
@keyframes hexPulse{0%,100%{opacity:.5}50%{opacity:1}}
.loader-word{font-family:'Syne',sans-serif;font-size:2rem;font-weight:800;letter-spacing:.5em;
  background:linear-gradient(90deg,var(--p1),var(--p3),var(--p1));background-size:200%;
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  animation:shimmer 1.8s linear infinite}
@keyframes shimmer{to{background-position:200% center}}
.loader-bar{width:180px;height:2px;background:rgba(255,255,255,.08);border-radius:999px;margin-top:18px;overflow:hidden}
.loader-fill{height:100%;background:linear-gradient(90deg,var(--p3),var(--p1));animation:loadFill 1.9s ease forwards}
@keyframes loadFill{from{width:0}to{width:100%}}

/* ── SCROLL REVEAL ── */
.reveal{opacity:0;transform:translateY(48px);transition:opacity .8s cubic-bezier(.23,1,.32,1),transform .8s cubic-bezier(.23,1,.32,1)}
.reveal.vis{opacity:1;transform:none}
.reveal-left{opacity:0;transform:translateX(-48px);transition:opacity .8s cubic-bezier(.23,1,.32,1),transform .8s cubic-bezier(.23,1,.32,1)}
.reveal-left.vis{opacity:1;transform:none}
.reveal-scale{opacity:0;transform:scale(.88);transition:opacity .7s cubic-bezier(.23,1,.32,1),transform .7s cubic-bezier(.23,1,.32,1)}
.reveal-scale.vis{opacity:1;transform:scale(1)}

/* HERO */
.hero{position:relative;min-height:100vh;display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;padding:120px 24px 80px;z-index:2;overflow:hidden}
.hero-glow{position:absolute;width:650px;height:650px;border-radius:50%;top:50%;left:50%;
  transform:translate(-50%,-62%);
  background:radial-gradient(circle,rgba(123,44,191,.35),transparent 70%);
  pointer-events:none;animation:glowPulse 5s ease-in-out infinite}
@keyframes glowPulse{0%,100%{transform:translate(-50%,-62%) scale(1)}50%{transform:translate(-50%,-62%) scale(1.12)}}

.hero-badge{display:inline-flex;align-items:center;gap:8px;padding:7px 18px;border-radius:999px;
  margin-bottom:24px;border:1px solid rgba(188,108,255,.3);background:rgba(188,108,255,.07);
  backdrop-filter:blur(8px);animation:fadeUp .8s ease both}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--p2);animation:blink 1.5s ease-in-out infinite}
.badge-text{font-size:.58rem;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:var(--p1)}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.15}}

.hero-title{font-family:'Syne',sans-serif;
  font-size:clamp(4rem,13vw,10rem);font-weight:800;line-height:.9;letter-spacing:-.04em;
  margin-bottom:20px;animation:titleReveal 1s cubic-bezier(.23,1,.32,1) .2s both}
.hero-title span{
  background:linear-gradient(135deg,#fff 0%,var(--p1) 35%,var(--p2) 65%,var(--p3) 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  filter:drop-shadow(0 0 50px rgba(188,108,255,.35))}
@keyframes titleReveal{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:none}}

.hero-sub{font-size:clamp(.95rem,2vw,1.35rem);color:rgba(255,255,255,.55);font-weight:300;
  max-width:480px;line-height:1.65;margin:0 auto 14px;animation:fadeUp .8s ease .4s both}
.hero-sub em{color:var(--p1);font-style:normal;font-weight:600}
.hero-desc{color:rgba(255,255,255,.28);font-size:.88rem;max-width:400px;
  margin:0 auto 44px;line-height:1.75;font-weight:300;animation:fadeUp .8s ease .6s both}
@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}

.hero-btns{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;animation:fadeUp .8s ease .8s both}
.btn-main{position:relative;overflow:hidden;padding:16px 38px;border-radius:999px;
  font-size:.92rem;font-weight:800;cursor:none;border:none;color:#fff;
  background:linear-gradient(135deg,var(--p3),var(--p4));
  box-shadow:0 0 36px rgba(157,78,221,.4),inset 0 1px 0 rgba(255,255,255,.18);
  transition:transform .2s,box-shadow .3s}
.btn-main:hover{transform:translateY(-3px) scale(1.03);box-shadow:0 8px 50px rgba(188,108,255,.5)}
.btn-ghost{padding:16px 38px;border-radius:999px;font-size:.92rem;font-weight:700;
  cursor:none;background:transparent;color:rgba(255,255,255,.6);
  border:1px solid rgba(188,108,255,.22);backdrop-filter:blur(8px);
  transition:border-color .3s,color .3s,background .3s,transform .2s}
.btn-ghost:hover{border-color:var(--p2);color:#fff;background:rgba(188,108,255,.07);transform:translateY(-3px)}

.hero-scroll{position:absolute;bottom:36px;left:50%;transform:translateX(-50%);
  display:flex;flex-direction:column;align-items:center;gap:7px;animation:fadeUp 1s ease 1.4s both}
.scroll-text{font-size:.44rem;font-weight:700;letter-spacing:.5em;text-transform:uppercase;color:rgba(255,255,255,.18)}
.scroll-line{width:1px;height:52px;background:linear-gradient(to bottom,rgba(188,108,255,.55),transparent);animation:scrollAnim 2.2s ease-in-out infinite}
@keyframes scrollAnim{0%,100%{opacity:1;transform:scaleY(1)}50%{opacity:.4;transform:scaleY(.5) translateY(10px)}}

/* TICKER */
.ticker{position:relative;z-index:2;padding:11px 0;overflow:hidden;
  background:rgba(7,2,15,.7);border-bottom:1px solid rgba(188,108,255,.07)}
.ticker-wrap{display:flex;width:max-content;animation:tick 28s linear infinite}
.ticker-item{display:flex;align-items:center;gap:10px;padding:0 36px;white-space:nowrap}
.t-dot{width:5px;height:5px;border-radius:50%;background:var(--p3)}
.t-txt{font-size:.54rem;font-weight:600;letter-spacing:.16em;text-transform:uppercase;color:rgba(255,255,255,.3)}
@keyframes tick{to{transform:translateX(-50%)}}

/* SECTION SKELETON */
.section{position:relative;z-index:2;padding:100px 40px}
.s-max{max-width:1180px;margin:0 auto}
.s-hd{text-align:center;margin-bottom:64px}
.s-eyebrow{display:inline-block;font-size:.54rem;font-weight:700;letter-spacing:.38em;
  text-transform:uppercase;color:var(--p2);margin-bottom:14px;padding:5px 14px;
  border:1px solid rgba(188,108,255,.18);border-radius:999px;background:rgba(188,108,255,.04)}
.s-title{font-family:'Syne',sans-serif;font-size:clamp(2rem,4.5vw,3.2rem);
  font-weight:800;letter-spacing:-.03em;line-height:1.1;margin-bottom:14px}
.grad{background:linear-gradient(135deg,var(--p1),var(--p3));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.s-sub{color:rgba(255,255,255,.38);font-weight:300;max-width:480px;margin:0 auto;line-height:1.7;font-size:.9rem}

/* FEATURES */
.feat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.feat-card{position:relative;overflow:hidden;padding:36px;border-radius:20px;
  background:rgba(188,108,255,.04);border:1px solid rgba(188,108,255,.12);
  backdrop-filter:blur(12px);cursor:none;
  transition:transform .4s cubic-bezier(.23,1,.32,1),border-color .3s,box-shadow .4s}
.feat-card::before{content:'';position:absolute;inset:0;border-radius:20px;opacity:0;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(188,108,255,.1),transparent 60%);
  transition:opacity .4s;pointer-events:none}
.feat-card:hover{transform:translateY(-8px);border-color:rgba(188,108,255,.3);box-shadow:0 16px 48px rgba(123,44,191,.18)}
.feat-card:hover::before{opacity:1}
.feat-card::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;
  background:linear-gradient(90deg,var(--p2),var(--p3),var(--p4));
  transform:scaleX(0);transform-origin:left;transition:transform .45s cubic-bezier(.23,1,.32,1)}
.feat-card:hover::after{transform:scaleX(1)}
.feat-icon{width:50px;height:50px;border-radius:14px;display:flex;align-items:center;justify-content:center;
  font-size:1.35rem;margin-bottom:20px;
  background:linear-gradient(135deg,rgba(188,108,255,.12),rgba(123,44,191,.08));
  border:1px solid rgba(188,108,255,.18);transition:transform .3s,box-shadow .3s}
.feat-card:hover .feat-icon{transform:scale(1.1) rotate(-5deg);box-shadow:0 6px 20px rgba(188,108,255,.25)}
.feat-title{font-family:'Syne',sans-serif;font-size:1.15rem;font-weight:700;margin-bottom:9px;transition:color .3s}
.feat-card:hover .feat-title{color:var(--p1)}
.feat-desc{color:rgba(255,255,255,.42);font-size:.84rem;line-height:1.68;font-weight:300}
.feat-divider{height:1px;background:rgba(255,255,255,.05);margin:20px 0}
.feat-preview{font-size:.44rem;font-weight:900;letter-spacing:.3em;text-transform:uppercase;color:rgba(255,255,255,.18);margin-bottom:16px}

/* MODE VIZ */
.mode-row{display:flex;align-items:center;justify-content:center;gap:18px;margin:10px 0}
.m-team{display:flex;align-items:center}
.m-av{width:38px;height:38px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:.58rem;font-weight:800}
.m-you{border-color:var(--p2);background:rgba(188,108,255,.1);color:var(--p1);animation:mPulse 2.2s ease-in-out infinite;box-shadow:0 0 10px rgba(188,108,255,.25)}
.m-ai{border-color:var(--p4);background:rgba(123,44,191,.1);color:var(--p1)}
.m-comp{border-color:var(--p3);background:rgba(157,78,221,.08);margin-left:-7px;animation:cBob 2.5s ease-in-out infinite}
@keyframes mPulse{0%,100%{box-shadow:0 0 10px rgba(188,108,255,.25)}50%{box-shadow:0 0 20px rgba(188,108,255,.5)}}
@keyframes cBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
.m-vs{font-size:.55rem;font-weight:900;letter-spacing:.25em;color:rgba(255,255,255,.15)}
.m-label{font-size:.43rem;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.22);text-align:center;margin-top:7px}

/* DEBATE SIM */
.sim-card{max-width:860px;margin:0 auto;border-radius:24px;overflow:hidden;
  border:1px solid rgba(188,108,255,.18);
  background:linear-gradient(135deg,rgba(10,1,24,.96),rgba(16,0,43,.92));
  box-shadow:0 32px 100px rgba(123,44,191,.22)}
.sim-bar{display:flex;align-items:center;gap:7px;padding:14px 22px;
  background:rgba(188,108,255,.04);border-bottom:1px solid rgba(188,108,255,.09)}
.sim-d{width:9px;height:9px;border-radius:50%}
.sim-bar-txt{margin-left:8px;font-size:.54rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:rgba(255,255,255,.25)}
.sim-body{display:flex;min-height:360px}
.sim-left{width:180px;min-width:180px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:24px;padding:28px 20px;
  border-right:1px solid rgba(188,108,255,.09);background:rgba(188,108,255,.02)}
.spk{width:74px;height:74px;border-radius:50%;border:2px solid;display:flex;align-items:center;justify-content:center;font-size:1.6rem;transition:all .4s}
.spk.on-you{border-color:var(--p2);box-shadow:0 0 0 5px rgba(188,108,255,.12),0 0 26px rgba(188,108,255,.35);animation:spkP 1.5s ease-in-out infinite}
.spk.off{border-color:rgba(255,255,255,.07);opacity:.35}
.spk.on-ai{border-color:var(--p3);box-shadow:0 0 0 5px rgba(157,78,221,.12),0 0 26px rgba(157,78,221,.35);animation:spkP 1.5s ease-in-out infinite}
@keyframes spkP{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
.spk-lbl{font-size:.5rem;font-weight:700;letter-spacing:.25em;text-transform:uppercase;margin-top:5px}
.wave{display:flex;align-items:center;gap:3px;height:28px}
.wv{width:3px;border-radius:999px;background:linear-gradient(to top,var(--p4),var(--p2));animation:wvA .5s ease-in-out infinite alternate}
.wv.off{height:3px!important;animation:none;opacity:.25}
@keyframes wvA{from{height:3px}to{height:24px}}
.sim-right{flex:1;display:flex;flex-direction:column;padding:24px 28px}
.sim-rh{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
.sim-rl{font-size:.48rem;font-weight:700;letter-spacing:.28em;text-transform:uppercase;color:rgba(255,255,255,.22)}
.rec-wrap{display:flex;align-items:center;gap:6px}
.rec-d{width:6px;height:6px;border-radius:50%;background:#ff4d6d;animation:blink 1.1s ease-in-out infinite}
.rec-t{font-size:.48rem;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#ff4d6d}
.msgs{display:flex;flex-direction:column;gap:11px;height:240px;overflow-y:auto;padding-right:4px}
.msg{padding:12px 16px;border-radius:14px;font-size:.82rem;line-height:1.6;animation:msgIn .4s ease;max-width:88%}
@keyframes msgIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.msg.ai{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);align-self:flex-start;border-bottom-left-radius:3px}
.msg.user{background:linear-gradient(135deg,rgba(188,108,255,.1),rgba(123,44,191,.08));border:1px solid rgba(188,108,255,.18);align-self:flex-end;border-bottom-right-radius:3px}
.typing{display:flex;gap:5px;align-items:center;padding:6px 0}
.td{width:5px;height:5px;border-radius:50%;background:rgba(188,108,255,.45);animation:td 1.4s ease-in-out infinite}
.td:nth-child(2){animation-delay:.18s}.td:nth-child(3){animation-delay:.36s}
@keyframes td{0%,60%,100%{opacity:.3;transform:scale(.8)}30%{opacity:1;transform:scale(1.2)}}

/* ── CINEMATIC ── */
.cinematic{position:relative;z-index:2;padding:130px 40px;text-align:center;overflow:hidden}
.cin-bg{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:700px;height:700px;border-radius:50%;
  background:radial-gradient(circle,rgba(90,24,154,.22),transparent 70%);pointer-events:none}
.cin-phrase{font-family:'Syne',sans-serif;font-size:clamp(1.8rem,5.5vw,4rem);
  font-weight:800;font-style:italic;letter-spacing:-.03em;margin-bottom:28px;
  opacity:0;transform:translateY(45px) skewY(2deg);
  transition:opacity .85s cubic-bezier(.23,1,.32,1),transform .85s cubic-bezier(.23,1,.32,1)}
.cin-phrase.vis{opacity:1;transform:translateY(0) skewY(0)}
.cin-foot{margin-top:64px;font-size:.78rem;font-weight:300;letter-spacing:.45em;
  text-transform:uppercase;color:rgba(255,255,255,.14);
  opacity:0;transition:opacity 1.1s ease .3s}
.cin-foot.vis{opacity:1}

/* HOW */
.how-wrap{max-width:720px;margin:0 auto;position:relative}
.how-spine{position:absolute;left:39px;top:40px;bottom:40px;width:2px;
  background:linear-gradient(to bottom,var(--p2),var(--p4),transparent)}
.how-steps{display:flex;flex-direction:column;gap:56px}
.how-step{display:flex;gap:36px;align-items:flex-start}
.how-num{width:80px;height:80px;min-width:80px;border-radius:18px;
  background:linear-gradient(135deg,var(--p4),var(--p6));
  border:1px solid rgba(188,108,255,.28);display:flex;align-items:center;justify-content:center;
  font-family:'Syne',sans-serif;font-size:1.9rem;font-weight:800;color:var(--p1);
  box-shadow:0 0 26px rgba(123,44,191,.18);position:relative;z-index:1;
  transition:transform .4s cubic-bezier(.23,1,.32,1),box-shadow .4s}
.how-step:hover .how-num{transform:scale(1.08) rotate(7deg);box-shadow:0 0 44px rgba(188,108,255,.38)}
.how-body{padding-top:16px}
.how-title{font-family:'Syne',sans-serif;font-size:1.45rem;font-weight:700;margin-bottom:9px;transition:color .3s}
.how-step:hover .how-title{color:var(--p1)}
.how-desc{color:rgba(255,255,255,.38);line-height:1.75;font-weight:300;font-size:.88rem;max-width:480px}

/* CASE PREP */
.case-card{max-width:860px;margin:0 auto;height:400px;position:relative;overflow:hidden;
  border-radius:24px;border:1px solid rgba(188,108,255,.14);
  background:linear-gradient(135deg,rgba(10,1,24,.92),rgba(28,0,60,.8))}
.case-card svg{position:absolute;inset:0;width:100%;height:100%}
.c-line{stroke-dasharray:200;stroke-dashoffset:200;transition:stroke-dashoffset 1.4s cubic-bezier(.23,1,.32,1)}
.c-line.vis{stroke-dashoffset:0}
.c-node{position:absolute;transform:translate(-50%,-50%);
  display:flex;align-items:center;gap:7px;padding:8px 16px;border-radius:10px;
  border:1px solid rgba(255,255,255,.09);background:rgba(10,1,24,.75);backdrop-filter:blur(10px);
  font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  opacity:0;transform:translate(-50%,-50%) scale(0);
  transition:opacity .5s cubic-bezier(.23,1,.32,1),transform .5s cubic-bezier(.23,1,.32,1),box-shadow .3s,border-color .3s;
  cursor:none}
.c-node.vis{opacity:1;transform:translate(-50%,-50%) scale(1)}
.c-node:hover{box-shadow:0 6px 20px rgba(123,44,191,.28);border-color:rgba(188,108,255,.35)}
.n-dot{width:7px;height:7px;border-radius:50%;animation:blink 2s ease-in-out infinite}
.case-foot{position:absolute;bottom:22px;left:22px;display:flex;align-items:center;gap:11px}
.case-bi{width:34px;height:34px;border-radius:50%;background:rgba(188,108,255,.12);display:flex;align-items:center;justify-content:center;font-size:.85rem}
.case-bt{font-size:.48rem;font-weight:900;letter-spacing:.18em;text-transform:uppercase;color:var(--p2)}
.case-bs{font-size:.38rem;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.28)}

/* ══════════════ FOUNDERS ══════════════ */
.founders-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:36px;max-width:780px;margin:0 auto}
.f-card{position:relative;border-radius:24px;overflow:hidden;cursor:none;
  transition:transform .5s cubic-bezier(.23,1,.32,1)}
.f-card:hover{transform:translateY(-14px)}
.f-border{position:absolute;inset:0;border-radius:24px;padding:1.5px;
  background:conic-gradient(from 0deg,var(--p3),var(--p5),var(--p2),var(--p4),var(--p3));
  background-size:200%;
  -webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);
  -webkit-mask-composite:destination-out;mask-composite:exclude;
  animation:borderSpin 4s linear infinite;opacity:.45;transition:opacity .4s;pointer-events:none}
.f-card:hover .f-border{opacity:1;animation-duration:2s}
@keyframes borderSpin{to{transform:rotate(360deg)}}
.f-inner{position:relative;padding:44px 32px;
  background:linear-gradient(160deg,rgba(16,0,43,.97),rgba(7,2,15,.99));
  border-radius:24px;display:flex;flex-direction:column;align-items:center;text-align:center;z-index:1}
.f-glow{position:absolute;width:260px;height:260px;border-radius:50%;
  background:radial-gradient(circle,rgba(188,108,255,.18),transparent 70%);
  pointer-events:none;opacity:0;transform:translate(-50%,-50%);transition:opacity .3s;z-index:0}
.f-card:hover .f-glow{opacity:1}
/* avatar */
.f-av-wrap{position:relative;width:148px;height:148px;margin-bottom:24px;z-index:1}
.f-av-wrap::before{content:'';position:absolute;inset:-3px;border-radius:50%;
  background:conic-gradient(var(--p2),var(--p4),var(--p5),var(--p2));
  animation:spinRing 5s linear infinite;opacity:.6;transition:opacity .4s,inset .3s}
.f-card:hover .f-av-wrap::before{opacity:1;inset:-5px}
@keyframes spinRing{to{transform:rotate(360deg)}}
.f-av-wrap::after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--dark)}
.f-img{position:relative;z-index:1;width:100%;height:100%;border-radius:50%;
  object-fit:cover;filter:grayscale(.55) brightness(.9);transition:filter .5s;display:block}
.f-card:hover .f-img{filter:grayscale(0) brightness(1.05)}
/* particles */
.f-pts{position:absolute;inset:0;pointer-events:none;z-index:2}
.f-p{position:absolute;top:50%;left:50%;width:4px;height:4px;border-radius:50%;
  background:var(--p2);opacity:0;animation:fPart 3s ease-in-out infinite}
.f-card:hover .f-p{opacity:1}
@keyframes fPart{
  0%{transform:rotate(var(--r)) translateX(88px) scale(0);opacity:0}
  20%{opacity:.9}80%{opacity:.35}
  100%{transform:rotate(calc(var(--r) + 360deg)) translateX(88px) scale(0);opacity:0}}
.f-name{font-family:'Syne',sans-serif;font-size:1.7rem;font-weight:800;letter-spacing:-.02em;
  margin-bottom:6px;z-index:1;position:relative;
  background:linear-gradient(135deg,#fff,var(--p1));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.f-role{font-size:.58rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;
  color:rgba(188,108,255,.55);margin-bottom:18px;z-index:1;position:relative}
.f-tags{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;margin-bottom:24px;z-index:1;position:relative}
.f-tag{padding:4px 12px;border-radius:999px;font-size:.58rem;font-weight:600;
  border:1px solid rgba(188,108,255,.18);background:rgba(188,108,255,.05);color:rgba(255,255,255,.55);
  transition:background .3s,border-color .3s,color .3s}
.f-card:hover .f-tag{background:rgba(188,108,255,.1);border-color:rgba(188,108,255,.3);color:var(--p1)}
.f-social{display:inline-flex;align-items:center;gap:7px;padding:9px 20px;border-radius:999px;
  border:1px solid rgba(188,108,255,.18);background:rgba(188,108,255,.04);
  color:rgba(255,255,255,.55);text-decoration:none;font-size:.66rem;font-weight:700;
  letter-spacing:.08em;text-transform:uppercase;z-index:1;position:relative;
  opacity:0;transform:translateY(10px);
  transition:opacity .4s,transform .4s,background .3s,border-color .3s,color .3s,box-shadow .3s}
.f-card:hover .f-social{opacity:1;transform:none}
.f-social:hover{background:linear-gradient(135deg,var(--p3),var(--p4));border-color:transparent;color:#fff;box-shadow:0 5px 18px rgba(157,78,221,.38);transform:translateY(-2px)}
.f-quote{margin-top:20px;padding:14px 18px;border-radius:10px;
  border-left:3px solid var(--p4);background:rgba(188,108,255,.04);
  font-size:.78rem;font-style:italic;color:rgba(255,255,255,.35);line-height:1.6;
  z-index:1;position:relative;text-align:left;
  opacity:0;transform:translateY(10px);transition:opacity .45s .08s,transform .45s .08s}
.f-card:hover .f-quote{opacity:1;transform:none}
.f-num{position:absolute;top:20px;right:24px;font-family:'Syne',sans-serif;
  font-size:4.5rem;font-weight:800;color:rgba(188,108,255,.05);
  line-height:1;z-index:0;pointer-events:none;transition:color .4s}
.f-card:hover .f-num{color:rgba(188,108,255,.09)}

/* TECH */
.tech-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px}
.tech-cat{font-size:.48rem;font-weight:700;letter-spacing:.45em;text-transform:uppercase;
  color:rgba(188,108,255,.48);margin-bottom:18px;padding-bottom:10px;border-bottom:1px solid rgba(188,108,255,.08)}
.tech-items{display:flex;flex-direction:column;gap:9px}
.tech-item{display:flex;align-items:center;gap:13px;padding:13px 17px;border-radius:13px;
  border:1px solid rgba(255,255,255,.04);background:rgba(255,255,255,.01);cursor:none;
  transition:transform .3s,background .3s,border-color .3s}
.tech-item:hover{transform:translateX(8px);background:rgba(188,108,255,.05);border-color:rgba(188,108,255,.18)}
.tech-icon{font-size:1rem}.tech-name{font-size:.82rem;font-weight:600;color:rgba(255,255,255,.72)}
.tech-item:hover .tech-name{color:#fff}

/* CTA */
.cta-sec{position:relative;z-index:2;padding:140px 40px;text-align:center;overflow:hidden}
.cta-glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:560px;height:560px;border-radius:50%;
  background:radial-gradient(circle,rgba(90,24,154,.28),transparent 70%);
  pointer-events:none;animation:glowPulse 4.5s ease-in-out infinite}
.cta-title{font-family:'Syne',sans-serif;font-size:clamp(2.2rem,6.5vw,5rem);
  font-weight:800;letter-spacing:-.04em;line-height:1;margin-bottom:44px}
.btn-cta{display:inline-flex;align-items:center;gap:10px;
  padding:20px 52px;border-radius:999px;font-size:1.05rem;font-weight:800;cursor:none;
  background:#fff;color:var(--dark);border:none;
  box-shadow:0 0 0 0 rgba(255,255,255,.15);
  transition:transform .2s,box-shadow .3s;animation:ctaP 2.8s ease-in-out infinite}
@keyframes ctaP{0%,100%{box-shadow:0 0 0 0 rgba(255,255,255,.12)}50%{box-shadow:0 0 0 18px rgba(255,255,255,0)}}
.btn-cta:hover{transform:scale(1.05);animation:none;box-shadow:0 8px 44px rgba(255,255,255,.22)}

/* FOOTER */
footer{position:relative;z-index:2;padding:56px 40px;
  border-top:1px solid rgba(188,108,255,.07);
  background:linear-gradient(to bottom,transparent,rgba(7,2,15,.85))}
.foot-inner{max-width:1180px;margin:0 auto;display:flex;flex-wrap:wrap;gap:36px;justify-content:space-between;align-items:center}
.foot-logo{font-family:'Syne',sans-serif;font-size:1.6rem;font-weight:800;
  background:linear-gradient(135deg,var(--p1),var(--p3));
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.foot-tag{font-size:.48rem;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:rgba(255,255,255,.22);margin-top:5px}
.foot-icons{display:flex;gap:16px}
.foot-icon{width:38px;height:38px;border-radius:50%;border:1px solid rgba(188,108,255,.13);
  display:flex;align-items:center;justify-content:center;font-size:.9rem;
  color:rgba(255,255,255,.35);text-decoration:none;
  transition:border-color .3s,color .3s,transform .3s,background .3s}
.foot-icon:hover{border-color:var(--p2);color:var(--p1);transform:translateY(-4px);background:rgba(188,108,255,.07)}
.foot-copy{font-size:.46rem;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.18);line-height:2}

@media(max-width:640px){
  nav{padding:14px 18px}.nav-links{display:none}
  .section{padding:80px 20px}
  .sim-body{flex-direction:column}.sim-left{width:100%;min-width:unset;flex-direction:row;border-right:none;border-bottom:1px solid rgba(188,108,255,.09)}
  .how-spine{display:none}
  .foot-inner{flex-direction:column;text-align:center}.foot-copy{text-align:center}
}
`;

/* ── Stars ── */
const StarField = () => {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current, ctx = c.getContext("2d");
    let W, H, stars = [], raf;
    const init = () => {
      W = c.width = window.innerWidth; H = c.height = window.innerHeight;
      stars = Array.from({ length: 200 }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 1.1 + .2, o: Math.random(),
        s: Math.random() * .003 + .001, t: Math.random() * Math.PI * 2,
      }));
    };
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        s.t += s.s;
        const o = s.o * (.4 + .6 * Math.sin(s.t));
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,165,255,${o})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    init(); draw();
    window.addEventListener("resize", init);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", init); };
  }, []);
  return <canvas ref={ref} id="stars-canvas" />;
};

/* ── Cursor ── */
const Cursor = () => {
  const dot = useRef(null), ring = useRef(null);
  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0;
    const mv = e => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) { dot.current.style.left = mx + "px"; dot.current.style.top = my + "px"; }
    };
    const loop = () => {
      rx += (mx - rx) * .11; ry += (my - ry) * .11;
      if (ring.current) { ring.current.style.left = rx + "px"; ring.current.style.top = ry + "px"; }
      requestAnimationFrame(loop);
    };
    window.addEventListener("mousemove", mv); loop();
    return () => window.removeEventListener("mousemove", mv);
  }, []);
  return <div id="cur"><div ref={dot} className="c-dot" /><div ref={ring} className="c-ring" /></div>;
};

/* ── Loader ── */
const Loader = ({ done }) => (
  <div className={`loader${done ? " out" : ""}`}>
    <div className="loader-hex">
      <div className="hex h1" /><div className="hex h2" /><div className="hex h3" />
      <div className="hex-c" />
    </div>
    <div className="loader-word">DEBATTLEX</div>
    <div className="loader-bar"><div className="loader-fill" /></div>
  </div>
);

/* ── useReveal hook ── */
const useReveal = (threshold = 0.15) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, vis];
};

/* ── Reveal wrapper ── */
const Reveal = ({ children, type = "reveal", delay = 0, threshold = 0.15 }) => {
  const [ref, vis] = useReveal(threshold);
  return (
    <div ref={ref} className={`${type}${vis ? " vis" : ""}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </div>
  );
};

/* ── Debate Sim ── */
const Sim = () => {
  const [active, setActive] = useState(0);
  const msgs = [
    { role: "ai", text: "Welcome to Debattlex. Today's topic: Is AI the ultimate tool for human evolution?" },
    { role: "user", text: "AI acts as a cognitive exoskeleton — it amplifies, not replaces, our natural abilities." },
    { role: "ai", text: "Compelling framing. Yet, does cognitive outsourcing not atrophy the very faculties it claims to enhance?" },
  ];
  useEffect(() => { const t = setInterval(() => setActive(p => p === 0 ? 1 : 0), 3200); return () => clearInterval(t); }, []);
  return (
    <div className="sim-card">
      <div className="sim-bar">
        <div className="sim-d" style={{ background: "#ff5f57" }} />
        <div className="sim-d" style={{ background: "#ffbd2e" }} />
        <div className="sim-d" style={{ background: "#28c840" }} />
        <span className="sim-bar-txt">Live Session — Room Alpha</span>
      </div>
      <div className="sim-body">
        <div className="sim-left">
          <div style={{ textAlign: "center" }}>
            <div className={`spk ${active === 0 ? "on-you" : "off"}`}>🎤</div>
            <div className="spk-lbl" style={{ color: active === 0 ? "var(--p1)" : "rgba(255,255,255,.2)" }}>You</div>
          </div>
          <div className="wave">
            {[...Array(9)].map((_, i) => (
              <div key={i} className={`wv${active !== 0 ? " off" : ""}`}
                style={{ animationDelay: `${i * .06}s`, animationDuration: `${.38 + (i % 3) * .14}s` }} />
            ))}
          </div>
          <div style={{ textAlign: "center" }}>
            <div className={`spk ${active === 1 ? "on-ai" : "off"}`}>🤖</div>
            <div className="spk-lbl" style={{ color: active === 1 ? "var(--p2)" : "rgba(255,255,255,.2)" }}>AI Agent</div>
          </div>
        </div>
        <div className="sim-right">
          <div className="sim-rh">
            <span className="sim-rl">Live Transcript</span>
            <div className="rec-wrap"><div className="rec-d" /><span className="rec-t">Recording</span></div>
          </div>
          <div className="msgs">
            {msgs.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.text}</div>)}
            <div className="typing"><div className="td" /><div className="td" /><div className="td" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Mode Viz ── */
const ModeViz = ({ mode }) => {
  const ais = mode === "1v1" ? 1 : 3, comps = mode === "3v3" ? 2 : 0;
  return (
    <div>
      <div className="mode-row">
        <div className="m-team">
          <div className="m-av m-you">YOU</div>
          {[...Array(comps)].map((_, i) => <div key={i} className="m-av m-comp" style={{ animationDelay: `${i * .5}s` }}>🤖</div>)}
        </div>
        <div className="m-vs">VS</div>
        <div className="m-team">
          {[...Array(ais)].map((_, i) => <div key={i} className="m-av m-ai" style={{ marginLeft: i ? -7 : 0 }}>🤖</div>)}
        </div>
      </div>
      <div className="m-label">{mode === "1v1" ? "1 Human vs 1 AI Agent" : "1 Human + 2 Companions vs 3 AI Agents"}</div>
    </div>
  );
};

/* ── Feature Card ── */
const features = [
  { icon: "🎤", title: "Real-Time Speech", desc: "Zero-latency voice recognition with noise-cancellation and speaker diarization." },
  { icon: "🤖", title: "AI Debate Agents", desc: "Go head-to-head with AI trained on the world's greatest rhetoricians and debaters." },
  { icon: "⚖️", title: "AI Judge Feedback", desc: "Instant multi-dimensional scoring: logic strength, delivery clarity, fallacy detection." },
  { icon: "🧠", title: "Case Preparation", desc: "AI researches, structures and stress-tests your arguments before you step into the arena." },
  { icon: "⚔️", title: "AP Debate Modes", desc: "Full 1v1 & 3v3 competitive formats following Lincoln-Douglas and World Schools standards.", special: true },
  { icon: "📊", title: "Performance Analytics", desc: "Deep-learning dashboards track your Elo rating, argument patterns, and growth trajectory." },
];

const FeatCard = ({ f, i }) => {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold: 0.1 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  const onMove = useCallback(e => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
  }, []);
  return (
    <div ref={ref} className="feat-card reveal" style={{ transitionDelay: `${i * .08}s` }}
      data-vis={vis} onMouseMove={onMove}
      // trigger vis class via direct DOM
      ref={el => { ref.current = el; if (el && vis) el.classList.add("vis"); }}>
      <div className="feat-icon">{f.icon}</div>
      <div className="feat-title">{f.title}</div>
      <div className="feat-desc">{f.desc}</div>
      {f.special && (<>
        <div className="feat-divider" />
        <div className="feat-preview">Live Preview</div>
        <ModeViz mode="1v1" />
        <div style={{ height: 1, background: "rgba(255,255,255,.04)", margin: "14px 0" }} />
        <ModeViz mode="3v3" />
      </>)}
    </div>
  );
};

/* ── Case Prep ── */
const cNodes = [
  { label: "Core Argument", x: 50, y: 50, color: "#bc6cff" },
  { label: "Evidence A", x: 22, y: 26, color: "#9d4edd" },
  { label: "Evidence B", x: 78, y: 26, color: "#9d4edd" },
  { label: "Counter-Point", x: 50, y: 80, color: "#7b2cbf" },
  { label: "Rebuttal", x: 18, y: 68, color: "#bc6cff" },
  { label: "Impact", x: 82, y: 68, color: "#5a189a" },
];

const CasePrep = () => {
  const [ref, vis] = useReveal(0.2);
  return (
    <div ref={ref} className="case-card">
      <svg>
        {cNodes.slice(1).map((n, i) => (
          <line key={i}
            x1={`${cNodes[0].x}%`} y1={`${cNodes[0].y}%`}
            x2={`${n.x}%`} y2={`${n.y}%`}
            stroke={n.color} strokeWidth="1" strokeOpacity=".28"
            strokeDasharray="4 4"
            className={`c-line${vis ? " vis" : ""}`}
            style={{ transitionDelay: `${i * .15 + .2}s` }} />
        ))}
      </svg>
      {cNodes.map((n, i) => (
        <div key={i} className={`c-node${vis ? " vis" : ""}`}
          style={{ left: `${n.x}%`, top: `${n.y}%`, transitionDelay: `${i * .12}s` }}>
          <div className="n-dot" style={{ background: n.color }} />
          {n.label}
        </div>
      ))}
      <div className="case-foot">
        <div className="case-bi">🧠</div>
        <div><div className="case-bt">AI Case Prep</div><div className="case-bs">Structuring logic tree…</div></div>
      </div>
    </div>
  );
};

/* ── Cinematic ── */
const Cinematic = () => {
  const phrases = [
    { t: "Debating is not arguing.", g: false },
    { t: "It is structured intelligence.", g: true },
    { t: "It is clarity under pressure.", g: false },
    { t: "It is how leaders are born.", g: true },
  ];
  const [ref, vis] = useReveal(0.05);
  return (
    <section className="cinematic" ref={ref}>
      <div className="cin-bg" />
      {phrases.map((p, i) => (
        <div key={i} className={`cin-phrase${vis ? " vis" : ""}`} style={{ transitionDelay: `${i * .22}s` }}>
          {p.g ? <span className="grad">{p.t}</span> : p.t}
        </div>
      ))}
      <div className={`cin-foot${vis ? " vis" : ""}`}>Debating is the future of leadership</div>
    </section>
  );
};

/* ── Founders ── */
const founders = [
  { name: "Bhushan VS", role: "Founder ", img: "https://media.licdn.com/dms/image/v2/D5603AQHwU1ROz1lsgQ/profile-displayphoto-scale_400_400/B56ZkeK1HqH8Ag-/0/1757147780493?e=1773878400&v=beta&t=5wTDPkX4m4Y60x7ZkioTu6oZ04yks9K9-ZHC2pQDS90", linkedin: "https://www.linkedin.com/in/bhushanvhavle", tags: ["Ai-ML", "Python", "System Design"], quote: '"The best debates aren\'t won by the loudest voice — they\'re won by the clearest mind."', num: "01" },
  { name: "Aniket Sonone", role: "Founder ", img: "https://media.licdn.com/dms/image/v2/D5603AQHqZejn2uGL6A/profile-displayphoto-scale_400_400/B56ZtVr.NEJIAg-/0/1766669149733?e=1773878400&v=beta&t=IphytMwcBIyNjftio6qSiPqojlT8FGIqNBI_mWZ4C8s", linkedin: "https://www.linkedin.com/in/aniket-sonone", tags: ["Machine Learning", "Full-Stack", "Python"], quote: '"Every argument has a flaw. AI helps you find yours before your opponent does."', num: "02" },
];

const FounderCard = ({ f }) => {
  const glowRef = useRef(null), cardRef = useRef(null);
  const onMove = e => {
    const g = glowRef.current, el = cardRef.current;
    if (!g || !el) return;
    const r = el.getBoundingClientRect();
    g.style.left = (e.clientX - r.left) + "px";
    g.style.top = (e.clientY - r.top) + "px";
  };
  return (
    <div className="f-card" ref={cardRef} onMouseMove={onMove}>
      <div className="f-border" />
      <div className="f-inner">
        <div ref={glowRef} className="f-glow" />
        <div className="f-num">{f.num}</div>
        <div className="f-av-wrap">
          <img className="f-img" src={f.img} alt={f.name} referrerPolicy="no-referrer" />
          <div className="f-pts">
            {[0, 60, 120, 180, 240, 300].map((a, i) => (
              <div key={i} className="f-p" style={{ "--r": a + "deg", animationDelay: `${i * .5}s`, animationDuration: `${2.5 + i * .35}s` }} />
            ))}
          </div>
        </div>
        <div className="f-name">{f.name}</div>
        <div className="f-role">{f.role}</div>
        <div className="f-tags">{f.tags.map((t, i) => <span key={i} className="f-tag">{t}</span>)}</div>
        <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="f-social">🔗 LinkedIn</a>
        <div className="f-quote">{f.quote}</div>
      </div>
    </div>
  );
};

/* ── Tech ── */
const tech = [
  { cat: "Frontend", items: [{ n: "React.js", i: "⚛️" }, { n: "CSS / Motion", i: "🎨" }, { n: "Web Speech API", i: "🎤" }] },
  { cat: "Backend", items: [{ n: "Node.js", i: "🟩" }, { n: "Express.js", i: "🚂" }, { n: "MongoDB Atlas", i: "🍃" }] },
  { cat: "AI / ML", items: [{ n: "Sarvam AI", i: "🧠" }, { n: "Speech-to-Text", i: "🎙️" }, { n: "Text-to-Speech", i: "🔊" }] },
  { cat: "Hosting", items: [{ n: "Render", i: "☁️" }, { n: "GitHub", i: "🐙" }] },
];

/* ── Steps ── */
const steps = [
  { title: "Choose Topic & Role", desc: "Browse curated global issues or enter a custom motion. Pick your stance — affirmative or negative." },
  { title: "Debate in Real-Time", desc: "Engage in structured verbal exchanges with AI agents. Our engine listens, processes, and responds in milliseconds." },
  { title: "Get Deep Feedback", desc: "Receive a full post-debate report: argument strength, logical fallacies, delivery score, and your updated Elo rating." },
];

/* ── APP ── */
export default function App() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const s = document.createElement("style");
    s.textContent = STYLES;
    document.head.appendChild(s);
    const t = setTimeout(() => setLoaded(true), 2200);
    return () => { document.head.removeChild(s); clearTimeout(t); };
  }, []);
  const navigate = useNavigate("");
  // attach reveal observer globally after mount
  useEffect(() => {
    if (!loaded) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("vis"); });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal,.reveal-left,.reveal-scale").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [loaded]);

  const acts = ["User #4292 started a debate on 'Climate Ethics'", "AI Judge awarded 'Clarity' badge to User #1029", "New 3v3 AP Debate starting in Room 'Alpha'", "User #8821 climbed to 'Diamond' rank", "AI Agent 'Socrates' updated with new logic models"];
  const tItems = [...acts, ...acts];

  return (
    <>
      <StarField />
      <Cursor />
      <Loader done={loaded} />

      {/* NAV */}
      <nav>
        <div className="nav-logo">DEBATTLEX</div>
        <div className="nav-links">
          <a href="#features">Features</a>
          <a href="#how">How It Works</a>
          <a href="#founders">Team</a>
        </div>
        <button
  className="nav-cta"
  onClick={() => navigate("/login")}
>
  Get Started now
</button>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-badge"><div className="badge-dot" /><span className="badge-text">Next-Gen AI Debate Platform</span></div>
        <h1 className="hero-title"><span>Debattlex</span></h1>
        <p className="hero-sub">The Future of Debate. <em>Powered by AI.</em></p>
        <p className="hero-desc">Structured, intelligent debates in real-time. Train your mind. Sharpen your voice. Evolve your thinking.</p>
        <div className="hero-btns">
          <button
  className="btn-main"
  onClick={() => navigate("/login")}
>
  🔥 Start Debating →
</button>
          <button className="btn-ghost">🎥 Watch Demo</button>
        </div>
        <div className="hero-scroll"><span className="scroll-text">Scroll</span><div className="scroll-line" /></div>
      </section>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-wrap">
          {tItems.map((a, i) => <div key={i} className="ticker-item"><div className="t-dot" /><span className="t-txt">{a}</span></div>)}
        </div>
      </div>

      {/* FEATURES */}
      <section className="section" id="features">
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">Why Debattlex</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">Everything to debate <span className="grad">smarter</span></h2></Reveal>
            <Reveal delay={0.14}><p className="s-sub">We fuse cutting-edge AI with classical rhetoric to build the ultimate arena for tomorrow's leaders.</p></Reveal>
          </div>
          <div className="feat-grid">
            {features.map((f, i) => <FeatCard key={i} f={f} i={i} />)}
          </div>
        </div>
      </section>

      {/* SIM */}
      <section className="section">
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">Live Preview</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">Watch <span className="grad">intelligence debate</span></h2></Reveal>
            <Reveal delay={0.14}><p className="s-sub">Real-time exchanges between humans and AI with zero latency.</p></Reveal>
          </div>
          <Reveal type="reveal-scale"><Sim /></Reveal>
        </div>
      </section>

      {/* CINEMATIC */}
      <Cinematic />

      {/* HOW */}
      <section className="section" id="how">
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">The Process</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">How it <span className="grad">works</span></h2></Reveal>
          </div>
          <div className="how-wrap">
            <div className="how-spine" />
            <div className="how-steps">
              {steps.map((s, i) => (
                <Reveal key={i} type="reveal-left" delay={i * 0.15}>
                  <div className="how-step">
                    <div className="how-num">{i + 1}</div>
                    <div className="how-body">
                      <div className="how-title">{s.title}</div>
                      <div className="how-desc">{s.desc}</div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CASE PREP */}
      <section className="section">
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">AI Tools</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">AI <span className="grad">Case Preparation</span></h2></Reveal>
            <Reveal delay={0.14}><p className="s-sub">Map your arguments visually. Let AI stress-test your logic before the debate.</p></Reveal>
          </div>
          <CasePrep />
        </div>
      </section>

      {/* FOUNDERS */}
      <section className="section" id="founders">
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">The Team</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">Meet the <span className="grad">Founders</span></h2></Reveal>
            <Reveal delay={0.14}><p className="s-sub">Two builders on a mission to make every person a better thinker and communicator.</p></Reveal>
          </div>
          <div className="founders-grid">
            {founders.map((f, i) => (
              <Reveal key={i} type="reveal-scale" delay={i * 0.18}>
                <FounderCard f={f} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TECH */}
      <section className="section" style={{ background: "rgba(10,1,24,.45)" }}>
        <div className="s-max">
          <div className="s-hd">
            <Reveal><div className="s-eyebrow">Built With</div></Reveal>
            <Reveal delay={0.08}><h2 className="s-title">The <span className="grad">Tech Stack</span></h2></Reveal>
          </div>
          <div className="tech-grid">
            {tech.map((g, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="tech-cat">{g.cat}</div>
                <div className="tech-items">
                  {g.items.map((it, j) => (
                    <div key={j} className="tech-item">
                      <span className="tech-icon">{it.i}</span>
                      <span className="tech-name">{it.n}</span>
                    </div>
                  ))}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-sec">
        <div className="cta-glow" />
        <Reveal><h2 className="cta-title">Ready to evolve your<br /><span className="grad">intelligence?</span></h2></Reveal>
        <Reveal delay={0.18}>
  <button
    className="btn-cta"
    onClick={() => navigate("/login")}
  >
    🔥 Get Started Now
  </button>
</Reveal>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="foot-inner">
          <div><div className="foot-logo">DEBATTLEX</div><div className="foot-tag">Train Your Voice. Build Your Power.</div></div>
          <div className="foot-icons">
            <a href="#" className="foot-icon">💼</a>
            <a href="#" className="foot-icon">🐙</a>
            <a href="#" className="foot-icon">🌐</a>
          </div>
          <div className="foot-copy">
            <div>© {new Date().getFullYear()} Debattlex. All rights reserved.</div>
            <div>Designed for the future of communication.</div>
          </div>
        </div>
      </footer>
    </>
  );
}