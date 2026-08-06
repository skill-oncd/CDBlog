---
title: Welcome to CoolDownSpace — 欢迎来到我的战斗设计自留地
date: 2026-08-04 15:30:00
top: true
tags:
  - portfolio
  - game-design
  - career
categories:
  - Career
description: CoolDownSpace is live! A game dev blog by CD, combat designer working on ARPG across Unreal and Unity. Here I share combat design breakdowns, ability system deep dives, frame data stories, and the journey of breaking into the game industry.
---

## 为什么是 CoolDownSpace？

🎮 我是 CD，一个正在游戏行业摸爬滚打的 **Combat Designer**（战斗策划）。

这个博客的名字是个双关：
- **CoolDown** — 技能冷却。我每天的工作就是调整技能的 CD 时间，直到战斗手感*对了*为止
- **CountDown** — 倒计时。因为项目的 ship date 永远在倒数

```cpp
// 我的人生状态机
while (Alive)
{
    DesignCombat();
    Skill.OnCooldown = true; // 暂时的——下次迭代又不一样了
}
```

## 这里会有什么？

| 栏目 | 内容 |
|------|------|
| ⚔️ **战斗设计拆解** | 拆经典 ARPG 的战斗系统——技能机制、受击反馈、帧数据 |
| 🛠️ **工程实践** | Unreal GAS / Unity 技能系统踩坑记录 |
| 💡 **设计思考** | 为什么有些战斗"爽"，有些就是不对味 |
| 🎯 **求职复盘** | 面试题、作品集思路、行业洞察 |

没有通稿式的"技术分享"，只有一线开发者的真实记录——如果你也在做类似的事情，希望这些内容对你有用。

## 当前进度

> **正在做：** 一款 ARPG 的战斗 & 技能系统
>
> **引擎：** Unreal (C++ / Blueprint) · Unity (C#)
>
> **日常关键词：** 技能配置表 → GAS → 受击框 → 帧数据对齐 → 数值调优 → 开会 → 重做 → 继续调

## Why write?

三个原因：

1. **记录成长。** 踩过的坑、想通的道理，写下来才不容易忘
2. **建立信号。** 对于招聘方来说，公开的技术博客是最诚实的简历
3. **连接同类。** 如果你也在做类似的事情，希望这些内容对你有用

> `skill.cooldown = 0` — CD 转好了，开始干活 🚀
