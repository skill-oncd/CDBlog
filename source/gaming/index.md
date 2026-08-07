---
title: 游戏经历
date: 2026-08-07 12:00:00
description: 16年游戏经历全记录 — 涵盖 Soulslike、开放世界 RPG、类暗黑 ARPG、工厂模拟、刷宝射击、MOBA、JRPG 等十余个品类的深度体验与设计思考。
keywords: 游戏经历,game portfolio,gaming history,Soulslike,ARPG,开放世界,工厂模拟,刷宝射击,MOBA,游戏设计
comments: true
---

<style>
/* ===== Gaming Portfolio Page Styles ===== */
.gaming-page {
  --gp-bg: #f8f9fa;
  --gp-card: #ffffff;
  --gp-card-border: #e8ecf1;
  --gp-text: #2c3e50;
  --gp-text-secondary: #6b7c93;
  --gp-accent: #4a90d9;
  --gp-accent2: #e8874b;
  --gp-accent3: #50b86c;
  --gp-gradient: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  --gp-shadow: 0 1px 3px rgba(0,0,0,0.06);
  --gp-shadow-lg: 0 4px 16px rgba(0,0,0,0.08);
  max-width: 100%;
}

[data-theme="dark"] .gaming-page {
  --gp-bg: #1a1d24;
  --gp-card: #232730;
  --gp-card-border: #2d323e;
  --gp-text: #d4d8e0;
  --gp-text-secondary: #8b95a8;
  --gp-shadow: 0 1px 3px rgba(0,0,0,0.2);
  --gp-shadow-lg: 0 4px 16px rgba(0,0,0,0.3);
}

.gaming-page h2 {
  font-size: 1.6rem;
  margin: 2.4rem 0 1.2rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--gp-accent);
  color: var(--gp-text);
}

.gaming-page h3 {
  font-size: 1.25rem;
  margin: 1.8rem 0 0.8rem;
  color: var(--gp-text);
}

/* Hero Banner */
.gp-hero {
  background: var(--gp-gradient);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #e8ecf1;
  position: relative;
  overflow: hidden;
}
.gp-hero::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 30% 50%, rgba(255,255,255,0.04) 0%, transparent 50%),
              radial-gradient(circle at 70% 30%, rgba(255,255,255,0.03) 0%, transparent 40%);
  pointer-events: none;
}
.gp-hero-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  position: relative;
}
.gp-hero-sub {
  font-size: 1rem;
  opacity: 0.75;
  position: relative;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

/* Stat Cards Row */
.gp-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
  margin: -1rem 0 2rem 0;
  position: relative;
}
.gp-stat-card {
  background: var(--gp-card);
  border: 1px solid var(--gp-card-border);
  border-radius: 10px;
  padding: 1.2rem 1rem;
  text-align: center;
  box-shadow: var(--gp-shadow-lg);
  transition: transform 0.2s, box-shadow 0.2s;
}
.gp-stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}
.gp-stat-num {
  font-size: 2rem;
  font-weight: 800;
  background: linear-gradient(135deg, var(--gp-accent), var(--gp-accent2));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1.2;
}
.gp-stat-label {
  font-size: 0.85rem;
  color: var(--gp-text-secondary);
  margin-top: 0.3rem;
}

/* Chart Section */
.gp-chart-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin: 1.5rem 0;
}
.gp-chart-card {
  background: var(--gp-card);
  border: 1px solid var(--gp-card-border);
  border-radius: 10px;
  padding: 1rem;
  box-shadow: var(--gp-shadow);
}
.gp-chart-card.full {
  grid-column: 1 / -1;
}
.gp-chart-title {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gp-text);
  margin-bottom: 0.5rem;
  padding-left: 0.3rem;
}
.gp-chart {
  width: 100%;
}

/* Genre Analysis Cards */
.gp-genre-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1.2rem;
  margin: 1.5rem 0;
}
.gp-genre-card {
  background: var(--gp-card);
  border: 1px solid var(--gp-card-border);
  border-radius: 10px;
  padding: 1.3rem;
  box-shadow: var(--gp-shadow);
  border-left: 4px solid var(--gp-accent);
  transition: transform 0.2s;
}
.gp-genre-card:hover {
  transform: translateY(-1px);
}
.gp-genre-card:nth-child(2) { border-left-color: var(--gp-accent2); }
.gp-genre-card:nth-child(3) { border-left-color: var(--gp-accent3); }
.gp-genre-card:nth-child(4) { border-left-color: #9b59b6; }
.gp-genre-card:nth-child(5) { border-left-color: #e74c3c; }
.gp-genre-card:nth-child(6) { border-left-color: #1abc9c; }
.gp-genre-card:nth-child(7) { border-left-color: #f39c12; }
.gp-genre-card h4 {
  font-size: 1.05rem;
  margin: 0 0 0.5rem 0;
  color: var(--gp-text);
}
.gp-genre-card p {
  font-size: 0.9rem;
  color: var(--gp-text-secondary);
  line-height: 1.65;
  margin: 0;
}

/* Game list table style */
.gp-game-list {
  margin: 1rem 0;
}
.gp-game-list h4 {
  font-size: 1rem;
  color: var(--gp-text);
  margin: 1rem 0 0.5rem;
}
.gp-game-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.45rem 0.6rem;
  margin: 0.15rem 0;
  border-radius: 6px;
  background: var(--gp-bg);
  transition: background 0.15s;
}
.gp-game-item:hover {
  background: var(--gp-card-border);
}
.gp-game-name {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--gp-text);
  letter-spacing: 0.01em;
}
.gp-game-meta {
  color: var(--gp-text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
  margin-left: 1rem;
  background: var(--gp-card);
  padding: 0.15rem 0.55rem;
  border-radius: 10px;
  border: 1px solid var(--gp-card-border);
}

/* TL;DR At-a-Glance */
.gp-tldr {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 0.7rem;
  margin: 1.5rem 0;
}
.gp-tldr-card {
  background: var(--gp-card);
  border: 1px solid var(--gp-card-border);
  border-radius: 8px;
  padding: 0.7rem 0.9rem;
  box-shadow: var(--gp-shadow);
  display: flex;
  align-items: center;
  gap: 0.65rem;
  transition: transform 0.15s, box-shadow 0.15s;
}
.gp-tldr-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--gp-shadow-lg);
}
.gp-tldr-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
  width: 2.2rem;
  text-align: center;
}
.gp-tldr-body {
  min-width: 0;
}
.gp-tldr-genre {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gp-accent);
  letter-spacing: 0.03em;
  margin-bottom: 0.15rem;
}
.gp-tldr-highlight {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--gp-text);
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .gp-chart-grid {
    grid-template-columns: 1fr;
  }
  .gp-stats {
    grid-template-columns: repeat(3, 1fr);
  }
  .gp-genre-cards {
    grid-template-columns: 1fr;
  }
  .gp-hero-title { font-size: 1.5rem; }
}
@media (max-width: 480px) {
  .gp-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>

<div class="gaming-page">

<!-- ===== Hero Banner ===== -->
<div class="gp-hero">
  <div class="gp-hero-title">🎮 个人游戏经历</div>
  <div class="gp-hero-sub">
    16 年 · 5 个平台 · 12+ 品类 · 20,000+ 小时<br>
    从玩家视角到设计意识的自然演化
  </div>
</div>

<!-- ===== Stat Cards ===== -->
<div class="gp-stats">
  <div class="gp-stat-card">
    <div class="gp-stat-num">16<span style="font-size:1rem"> 年</span></div>
    <div class="gp-stat-label">游戏年龄</div>
  </div>
  <div class="gp-stat-card">
    <div class="gp-stat-num">20,000<span style="font-size:1rem">h+</span></div>
    <div class="gp-stat-label">总游戏时长</div>
  </div>
  <div class="gp-stat-card">
    <div class="gp-stat-num">5</div>
    <div class="gp-stat-label">游戏平台</div>
  </div>
  <div class="gp-stat-card">
    <div class="gp-stat-num">8</div>
    <div class="gp-stat-label">全成就 / 白金</div>
  </div>
  <div class="gp-stat-card">
    <div class="gp-stat-num">¥30K<span style="font-size:1rem">+</span></div>
    <div class="gp-stat-label">累计付费</div>
  </div>
</div>

<!-- ===== TL;DR At-a-Glance ===== -->
<div class="gp-tldr">
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🗡️</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">魂Like · ACT</div>
      <div class="gp-tldr-highlight">全系列全成就 · 法环 326h 四周目 · 血源白金</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">⚔️</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">暗黑Like</div>
      <div class="gp-tldr-highlight">D4 深塔 106 层 · POE2 ~30d 锐眼速刷 · LE 开荒</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🔫</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">刷宝射击</div>
      <div class="gp-tldr-highlight">Warframe 19 段 · 全境 600h+ 多 Build · 无主全系列</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🏭</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">工厂模拟</div>
      <div class="gp-tldr-highlight">Factorio 262h · 幸福工厂核电 + 全图空运 · 戴森球</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">♟️</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">策略卡牌 · 自走棋</div>
      <div class="gp-tldr-highlight">金铲铲王者 · 炉石 8 年传说 · 酒馆战棋 8000 分</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🌍</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">开放世界</div>
      <div class="gp-tldr-highlight">赛博朋克全成就 · 巫师 3 全支线 · 英灵殿 265h</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🐉</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">怪物猎人</div>
      <div class="gp-tldr-highlight">世界黑龙 · 崛起怪异化 70 · 累计 500h+ 共斗</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">⚡</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">MOBA</div>
      <div class="gp-tldr-highlight">LOL S2–S14 白金 · 中下两路 · 付费 ¥4,500</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🌟</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">二次元 · 长线运营</div>
      <div class="gp-tldr-highlight">原神 3 年 · 崩铁 3 年 · 鸣潮 1 年 · 累计 ¥15K+</div>
    </div>
  </div>
  <div class="gp-tldr-card">
    <div class="gp-tldr-icon">🎌</div>
    <div class="gp-tldr-body">
      <div class="gp-tldr-genre">JRPG</div>
      <div class="gp-tldr-highlight">P5R 全成就 254h · 八方旅人 350h · 33 号远征队</div>
    </div>
  </div>
</div>

<!-- ===== Word Cloud ===== -->
<div class="gp-chart-card full" style="margin-bottom:1.5rem;">
  <div class="gp-chart-title">🎯 游戏成分词云 <span style="font-weight:400;font-size:0.8rem;color:var(--gp-text-secondary);">— 移动鼠标与词云互动</span></div>
  <canvas id="canvas-wordcloud" style="width:100%;height:380px;display:block;cursor:grab;"></canvas>
</div>

<!-- ===== Charts Row 1: Single-Player Hours + Online Spending ===== -->
<div class="gp-chart-grid">
  <div class="gp-chart-card">
    <div class="gp-chart-title">🎮 单机游戏时长 Top 15</div>
    <div id="chart-top-games" class="gp-chart" style="height:500px;"></div>
  </div>
  <div class="gp-chart-card">
    <div class="gp-chart-title">💳 线上游戏付费排行</div>
    <div id="chart-online-spending" class="gp-chart" style="height:500px;"></div>
  </div>
</div>

<!-- ===== Charts Row 2: Platform + Genre Hours ===== -->
<div class="gp-chart-grid" style="grid-template-columns: 1fr 2fr;">
  <div class="gp-chart-card">
    <div class="gp-chart-title">🖥️ 平台时长分布</div>
    <div id="chart-platform" class="gp-chart" style="height:360px;"></div>
  </div>
  <div class="gp-chart-card">
    <div class="gp-chart-title">📊 品类时长分布（可统计部分）</div>
    <div id="chart-genre-hours" class="gp-chart" style="height:360px;"></div>
  </div>
</div>

---

## 📖 游戏经历概述

游戏年龄 **16 年**（自小学一年级开始接触电脑游戏）。除格斗与部分体育模拟游戏外，**全面且深入地体验过各大游戏品类**。主要游戏平台为 **PC**，游戏总时长超 **13,000 小时**；**PS5** 平台和掌机平台（**NS** 为主、**Steam Deck** 为辅）游戏体验时长均超 **1,000 小时**；移动平台（iOS、Android）深度游玩头部二游、卡牌类游戏（《炉石传说》）、自走棋类（酒馆战棋、《金铲铲之战》）超 **5,000 小时**。

游戏不仅是日常生活的重要组成部分。长期且深入的游戏游玩经验，使我逐步建立**资深玩家视角**的同时，也从持续体验中自然产生了**设计意识**和强烈的**游戏开发兴趣**。以下基于不同游戏品类，简要介绍各品类中印象最深刻的代表性作品。

---

## 🗡️ 一、Soulslike 与 ACT

<div class="gp-game-list">

### FromSoftware 魂系列
<div class="gp-game-item"><span class="gp-game-name">① 艾尔登法环</span><span class="gp-game-meta">326h · 四周目 · 全成就全收集</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 黑暗之魂 3</span><span class="gp-game-meta">232h · 三周目 · 全成就</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 黑暗之魂 重制版</span><span class="gp-game-meta">140h · 二周目 · 全成就</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ Bloodborne</span><span class="gp-game-meta">165h · 三周目 · 白金</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑤ 恶魔之魂 重制版</span><span class="gp-game-meta">85h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑥ 黑暗之魂 2</span><span class="gp-game-meta">65h · 一周目通关</span></div>

### 类魂 & ACT
<div class="gp-game-item"><span class="gp-game-name">⑦ Lies of P</span><span class="gp-game-meta">73h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑧ 怪物猎人 世界+冰原</span><span class="gp-game-meta">235h · 太刀通关黑龙</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑨ 怪物猎人 崛起+曙光</span><span class="gp-game-meta">265h · 大锤解禁 · 怪异化 70 级</span></div>

</div>

---

## 🌍 二、开放世界 RPG

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 赛博朋克 2077</span><span class="gp-game-meta">236h · 二周目 · 全成就全支线</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 巫师 3：狂猎</span><span class="gp-game-meta">260h · 二周目 · 全支线</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 刺客信条：奥德赛</span><span class="gp-game-meta">182h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ 刺客信条：英灵殿</span><span class="gp-game-meta">265h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑤ 荒野大镖客 2</span><span class="gp-game-meta">72h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑥ 孤岛惊魂 6</span><span class="gp-game-meta">85h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑦ 孤岛惊魂 5</span><span class="gp-game-meta">92h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑧ 原神</span><span class="gp-game-meta">在线 3 年 · 付费 ¥6,000+</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑨ 鸣潮</span><span class="gp-game-meta">在线 1 年 · 付费 ¥1,200+</span></div>

</div>

---

## ⚔️ 三、类暗黑 ARPG

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 暗黑破坏神 4</span><span class="gp-game-meta">432h（国服+国际服）· 多赛季深塔 106 层 · 付费 ¥1,200+</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 暗黑破坏神 3</span><span class="gp-game-meta">75h · 本体+ DLC 剧情通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 暗黑破坏神 2：重制版</span><span class="gp-game-meta">85h · 法师剧情通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ Path of Exile 2</span><span class="gp-game-meta">133h · 锐眼速刷 · ~30d 造价</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑤ Last Epoch</span><span class="gp-game-meta">82h · 一周目剧情通关</span></div>

</div>

---

## 🎯 四、类吃鸡

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 艾尔登法环：黑夜君临</span><span class="gp-game-meta">120h · 深度 5 · 9999 分</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 和平精英（手游）</span><span class="gp-game-meta">82h · 白金段位</span></div>

</div>

---

## 🏰 五、RTS

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 帝国时代 4</span><span class="gp-game-meta">252h · 单排 1v1 白金 · 1100 分</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 钢铁指挥官</span><span class="gp-game-meta">62h · 单排 1v1 · ~900 分</span></div>

</div>

---

## 🃏 六、策略卡牌

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 金铲铲之战</span><span class="gp-game-meta">~3,400h · 付费 ¥13,000 · 多赛季大师/宗师 · 一赛季王者</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 炉石传说</span><span class="gp-game-meta">活跃 8 年+ · 多赛季传说 · 酒馆战棋 8000 分</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 杀戮尖塔 2</span><span class="gp-game-meta">62h · 铁甲战士通关</span></div>

</div>

---

## 🏭 七、工厂模拟

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 幸福工厂</span><span class="gp-game-meta">188h · 单人核电 + 全图分布式空运</span></div>
<div class="gp-game-item"><span class="gp-game-name">② Factorio</span><span class="gp-game-meta">262h · 一周目通关 + DLC 开荒一星球</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 戴森球计划</span><span class="gp-game-meta">165h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ 明日方舟：终末地</span><span class="gp-game-meta">开服活跃至今 · 付费 ¥170 · 基建毕业</span></div>

</div>

---

## 🔫 八、命运 Like 刷宝射击

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 全境封锁系列</span><span class="gp-game-meta">600h+ · 多 Build 毕业</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 无主之地 3+4</span><span class="gp-game-meta">262h · 一周目通关本体+ DLC</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ Warframe</span><span class="gp-game-meta">750h+ · 国服 16 段 · 国际服 19 段 · 多战甲毕业</span></div>

</div>

---

## ⚡ 九、MOBA

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 英雄联盟</span><span class="gp-game-meta">S2 活跃至 S14 · 白金段位（中/下）· 付费 ¥4,500+</span></div>

</div>

---

## 🎌 十、JRPG

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① Persona 5 Royal</span><span class="gp-game-meta">254h · 全成就通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 八方旅人 1+2</span><span class="gp-game-meta">350h · 全剧情通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 宝可梦 朱</span><span class="gp-game-meta">62h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ 33 号远征队</span><span class="gp-game-meta">65h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">⑤ 崩坏：星穹铁道</span><span class="gp-game-meta">持续活跃 3 年 · 付费 ¥4,500+</span></div>

</div>

---

## 📝 十一、文字冒险

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① 极限脱出：九人游戏</span><span class="gp-game-meta">35h（1+2）· 全结局通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 人狼村之谜</span><span class="gp-game-meta">61h · 全结局通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 十三机兵防卫圈</span><span class="gp-game-meta">62h · 真结局通关</span></div>

</div>

---

## 🎮 十二、其它

<div class="gp-game-list">

<div class="gp-game-item"><span class="gp-game-name">① Hitman：暗杀世界</span><span class="gp-game-meta">800h+ · 全地图满等级</span></div>
<div class="gp-game-item"><span class="gp-game-name">② 死亡循环</span><span class="gp-game-meta">65h · 一周目通关</span></div>
<div class="gp-game-item"><span class="gp-game-name">③ 漫威蜘蛛侠：重制版</span><span class="gp-game-meta">83h · 白金</span></div>
<div class="gp-game-item"><span class="gp-game-name">④ 漫威蜘蛛侠：迈尔斯·莫拉莱斯</span><span class="gp-game-meta">62h · 白金</span></div>

</div>

---

## 🔬 品类深度体验阐发

<div class="gp-genre-cards">

<div class="gp-genre-card">
<h4>🗡️ Soulslike ARPG</h4>
<p>自《恶魔之魂》后宫崎英高魂 Like 系列全成就收集者。首部接触的作品是《艾尔登法环》，体验最为深入，随后花费约两年时间通关并全收集了剩余魂系列作品，《Lies of P》推出后也第一时间通关。魂系列的艺术风格、背景设定、碎片化叙事设计、精妙的 3D 恶魔城箱庭结构、战斗系统（动作模组、技能组合、异常状态、打击反馈）以及 UI/UX 设计，都对游戏世界观乃至设计观构成了深远影响。</p>
</div>

<div class="gp-genre-card">
<h4>⚔️ 暗黑 Like ARPG</h4>
<p>首次深度游玩是在 NS 平台体验《D3》离线版本，《D4》上市后第一时间进入并持续游玩多个赛季，同时也是《无主之地 3、4》的深度体验者。后尝试了《POE2》《Last Epoch》等同品类竞品。这类游戏的 Build 构成、数值系统设计、刷宝战斗的爽快感（海量敌人割草）、极具深度的终局系统设计，提供了大量灵感和参考。拓展阅读了 D2 设计的反拆文档，下载并研究过 D2 系列的民间 Go 语言重制项目（主要研究游戏架构）。类集换式卡牌的线上道具交易系统也非常值得借鉴。</p>
</div>

<div class="gp-genre-card">
<h4>🔫 多人在线刷宝 TPS</h4>
<p>代表作品为《Warframe》《全境封锁》系列和《命运》系列。《Warframe》的运营整体而言更加成功，深度体验超 500 小时。这一品类游戏的共同特征在于多次重复刷本构成的终局体验——Build 是角色强度的主要组成，区别于通常意义上的 RPG 数值成长系统。Raid 团本机制借鉴自《魔兽世界》，又与 TPS/FPS 的即时射击有机结合，开辟了一条独特的竞争赛道。</p>
</div>

<div class="gp-genre-card">
<h4>🏭 工厂模拟</h4>
<p>这一品类的奠基作品是《Factorio》和《像素工厂》，后续细分赛道推出的《戴森球计划》《幸福工厂》乃至《明日方舟：终末地》等均有深入体验。尤其深度游玩了《幸福工厂》，实现了产线高度复杂的核电产线以及全图分布式物流的组建。工厂模拟类游戏的核心魅力在于系统自洽性——每一条传送带、每一个分拣器都是玩家亲手设计的逻辑节点，最终涌现出远超预期的复杂行为。</p>
</div>

<div class="gp-genre-card">
<h4>🌟 二次元游戏</h4>
<p>这类游戏难以从玩法层面做精确划分，但基本都体现为"米池"为核心的商业化模式设计 + 某个经典单机品类的二次元 RPG 化改款，是一系列复杂玩法和 IP 的组合。深度体验过《原神》和《鸣潮》的大世界解密探索（部分区域全收集），也借助互联网资源研究了这类游戏常见的数值系统和核心玩法循环。由于玩法高度复合、玩家受众广泛、商业模式成熟，这类游戏留下了较为深刻的印象。</p>
</div>

<div class="gp-genre-card">
<h4>🐉 怪物猎人系列</h4>
<p>深度体验过《冰原》《崛起》和《荒野》三部作品（均 200–300 小时）。其多人共斗 ACT 体验独树一帜，独特的怪物生态与复杂的环境令人印象深刻，怪物素材制作武器装备的模式与游戏玩法和世界观高度自洽。从设计角度看，怪物猎人的每场狩猎都是一次"Boss Rush"式的精密战斗设计——怪物动作的可读性、硬直窗口的节奏控制、以及环境交互的涌现式玩法，构成了一套几乎无法复制的战斗语言。</p>
</div>

<div class="gp-genre-card">
<h4>♟️ 自走棋类</h4>
<p>这类游戏可以理解为经典麻将玩法的 IP 向重构。曾深度体验过《炉石传说》酒馆战棋（8000 分左右）和《金铲铲之战》（王者、宗师水平）。熟悉自走棋类游戏的玩法、机制和博弈点，对这类游戏的核心机制有较为深入的理解。自走棋的设计精髓在于"有限信息下的概率决策"——每回合的刷新、站位、经济运营都是在不完全信息下做出的连续博弈，这与传统棋牌游戏的决策树结构高度同构。</p>
</div>

</div>

---

## 🎯 总结

从 7 岁第一次打开电脑游戏，到如今积累 **20,000+ 小时**的游玩经验，游戏早已超越了"娱乐"的范畴。它是一扇窗——透过它看到了叙事艺术的边界、系统设计的优雅、以及交互体验的无限可能。每一个全成就、每一次白金、每一个赛季的传说段位，背后都是对"好游戏为什么好"这个问题的持续追问。

**从玩家到设计者**，这条路没有捷径——唯有大量地玩、深度地玩、带有审视意识地玩。而这段旅程，才刚刚开始。

</div>