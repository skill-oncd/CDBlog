/**
 * Gaming page charts — loaded globally, activates only when chart containers exist.
 * Uses a visibility gate to defer init until after hexo-blog-encrypt decrypts the page.
 */
(function() {
  // Only run on gaming page
  if (!document.getElementById('canvas-wordcloud') &&
      !document.getElementById('chart-top-games')) return;

  // Wait for ECharts to be available (injected via CDN in theme config)
  function waitForECharts(cb) {
    if (typeof echarts !== 'undefined') { cb(); return; }
    var check = setInterval(function() {
      if (typeof echarts !== 'undefined') { clearInterval(check); cb(); }
    }, 50);
  }

  function isDark() {
    return document.documentElement.getAttribute('data-theme') === 'dark';
  }
  function textColor() { return isDark() ? '#c9d1d9' : '#2c3e50'; }
  function textColorSec() { return isDark() ? '#8b949e' : '#6b7c93'; }

  // ---- Animated Floating Word Cloud ----
  var initWordCloud_called = false;
  function initWordCloud() {
    if (initWordCloud_called) return;
    initWordCloud_called = true;
    var canvas = document.getElementById('canvas-wordcloud');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var words = [];
    var mouse = { x: -9999, y: -9999 };
    var animationId = null;
    var dpr = window.devicePixelRatio || 1;
    var W, H;

    // Word data
    var wordData = [
      // 品类标签
      { text: 'Soulslike', weight: 68 },
      { text: '开放世界', weight: 60 },
      { text: '暗黑Like', weight: 52 },
      { text: '工厂模拟', weight: 42 },
      { text: '刷宝射击', weight: 65 },
      { text: 'MOBA', weight: 82 },
      { text: '策略卡牌', weight: 88 },
      { text: 'JRPG', weight: 38 },
      { text: 'RTS', weight: 28 },
      { text: '自走棋', weight: 58 },
      { text: '怪物猎人', weight: 44 },
      { text: '二次元', weight: 50 },
      { text: '文字冒险', weight: 18 },
      { text: '类吃鸡', weight: 22 },
      { text: '潜行暗杀', weight: 48 },
      // 魂系梗
      { text: '赞美太阳', weight: 32 },
      { text: '你死了', weight: 38 },
      { text: '毒沼', weight: 24 },
      { text: '古神低语', weight: 20 },
      { text: '老贼', weight: 26 },
      { text: '跌落神坛', weight: 18 },
      { text: '帕奇', weight: 16 },
      { text: '防火女', weight: 22 },
      { text: '弹反', weight: 28 },
      // 暗黑/刷宝梗
      { text: '刷刷刷', weight: 40 },
      { text: '赛季开荒', weight: 30 },
      { text: '爆肝', weight: 32 },
      { text: '太古', weight: 18 },
      { text: 'Build', weight: 36 },
      { text: '深坑', weight: 16 },
      // 通用游戏梗
      { text: '全成就', weight: 42 },
      { text: '白金', weight: 34 },
      { text: '二周目', weight: 38 },
      { text: '速通', weight: 20 },
      { text: '坐牢', weight: 28 },
      { text: '肝帝', weight: 24 },
      { text: '毕业', weight: 32 },
      { text: '开荒', weight: 36 },
      { text: '逃课', weight: 22 },
      { text: '轮椅', weight: 20 },
      { text: '版本答案', weight: 24 },
      // MOBA/竞技梗
      { text: '快乐风男', weight: 16 },
      { text: '上分', weight: 28 },
      { text: '补刀', weight: 14 },
      { text: 'GGWP', weight: 15 },
      // 卡牌/自走棋梗
      { text: '三星五费', weight: 22 },
      { text: '天胡', weight: 18 },
      { text: '速八', weight: 16 },
      { text: '吃鸡', weight: 26 },
      { text: '锁血', weight: 15 },
      // 怪猎梗
      { text: '猫车', weight: 24 },
      { text: '太刀侠', weight: 20 },
      { text: '登龙', weight: 16 },
      { text: '肉质', weight: 12 },
      // 工厂梗
      { text: '传送带地狱', weight: 20 },
      { text: '产线重构', weight: 16 },
      { text: '核电', weight: 18 },
      // 开放世界梗
      { text: '昆特牌', weight: 18 },
      { text: '清问号', weight: 16 },
      { text: '赛博疯子', weight: 14 },
      // 刷宝/Farm梗
      { text: '仓鼠', weight: 24 },
      { text: 'Forma', weight: 14 },
      { text: '天命', weight: 16 },
      { text: '奇特', weight: 12 }
    ];

    var darkColors = ['#58a6ff','#f78166','#7ee787','#d2a8ff','#f0c062','#79c0ff','#ffa198','#a5d6ff','#56d4dd','#e3b341'];
    var lightColors = ['#4a90d9','#e8874b','#50b86c','#9b59b6','#f39c12','#3498db','#e74c3c','#2980b9','#16a085','#d35400'];

    function getColors() {
      return isDark() ? darkColors : lightColors;
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      W = rect.width;
      H = 380;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
    }

    function initWords(W, H) {
      var colors = getColors();
      // Scale weights to font sizes (12px - 48px)
      var minW = 12, maxW = 88;
      var minS = 13, maxS = 46;

      var items = wordData.map(function(d) {
        var size = minS + (d.weight - minW) / (maxW - minW) * (maxS - minS);
        return {
          text: d.text,
          size: size,
          color: colors[Math.floor(Math.random() * colors.length)],
          weight: d.weight
        };
      });

      // Sort by size descending for spiral placement
      items.sort(function(a, b) { return b.size - a.size; });

      // Spiral placement
      var placed = [];
      var cx = W / 2, cy = H / 2;
      var maxAttempts = 3000;

      ctx.font = 'bold 16px "PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif';

      items.forEach(function(item) {
        ctx.font = 'bold ' + item.size + 'px "PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif';
        var metrics = ctx.measureText(item.text);
        var tw = metrics.width + 8;
        var th = item.size + 6;

        var angle = Math.random() * Math.PI * 2;
        var radius = 0;
        var placed_flag = false;

        for (var attempt = 0; attempt < maxAttempts; attempt++) {
          var x = cx + radius * Math.cos(angle);
          var y = cy + radius * Math.sin(angle);

          // Bounds check
          if (x - tw/2 < 4 || x + tw/2 > W - 4 || y - th/2 < 4 || y + th/2 > H - 4) {
            angle += 0.35;
            radius += 0.35;
            continue;
          }

          // Collision check
          var collides = false;
          for (var j = 0; j < placed.length; j++) {
            var p = placed[j];
            if (Math.abs(x - p.homeX) < (tw + p.tw) / 2 + 3 &&
                Math.abs(y - p.homeY) < (th + p.th) / 2 + 3) {
              collides = true;
              break;
            }
          }

          if (!collides) {
            placed.push({ text: item.text, size: item.size, color: item.color, tw: tw, th: th,
              homeX: x, homeY: y,
              offsetX: 0, offsetY: 0, offsetVX: 0, offsetVY: 0,
              dFreqX: 0.2 + Math.random() * 0.5, dFreqY: 0.2 + Math.random() * 0.5,
              dPhaseX: Math.random() * Math.PI * 2, dPhaseY: Math.random() * Math.PI * 2 });
            placed_flag = true;
            break;
          }

          angle += 0.35;
          radius += 0.35;
        }

        if (!placed_flag) {
          // Fallback: random position
          var rx = tw/2 + Math.random() * (W - tw);
          var ry = th/2 + Math.random() * (H - th);
          placed.push({ text: item.text, size: item.size, color: item.color, tw: tw, th: th,
            homeX: rx, homeY: ry,
            offsetX: 0, offsetY: 0, offsetVX: 0, offsetVY: 0,
            dFreqX: 0.2 + Math.random() * 0.5, dFreqY: 0.2 + Math.random() * 0.5,
            dPhaseX: Math.random() * Math.PI * 2, dPhaseY: Math.random() * Math.PI * 2 });
        }
      });

      // Pre-render sprites
      for (var k = 0; k < placed.length; k++) {
        var spr = prerenderWord(placed[k]);
        placed[k].sprite = spr.canvas;
        placed[k].sw = spr.w;
        placed[k].sh = spr.h;
      }

      return placed;
    }

    // Pre-render each word to an offscreen canvas for fast blitting
    function prerenderWord(item) {
      var c = document.createElement('canvas');
      var font = 'bold ' + item.size + 'px "PingFang SC","Microsoft YaHei","Helvetica Neue",sans-serif';
      var ctx2 = c.getContext('2d');
      ctx2.font = font;
      var m = ctx2.measureText(item.text);
      var pw = Math.ceil(m.width) + 4;
      var ph = Math.ceil(item.size * 1.5);
      c.width = pw * dpr;
      c.height = ph * dpr;
      c.style.width = pw + 'px';
      c.style.height = ph + 'px';
      ctx2.setTransform(1, 0, 0, 1, 0, 0);
      ctx2.scale(dpr, dpr);
      ctx2.font = font;
      ctx2.fillStyle = item.color;
      ctx2.textAlign = 'center';
      ctx2.textBaseline = 'middle';
      ctx2.fillText(item.text, pw/2, ph/2);
      return { canvas: c, w: pw, h: ph };
    }

    function draw(timestamp) {
      ctx.clearRect(0, 0, W, H);

      var mx = mouse.x, my = mouse.y;
      var cx = W / 2, cy = H / 2;
      var t = timestamp * 0.001;

      for (var i = 0; i < words.length; i++) {
        var w = words[i];

        // Smooth sinusoidal drift
        var rDist = Math.sqrt((w.homeX-cx)*(w.homeX-cx) + (w.homeY-cy)*(w.homeY-cy));
        var maxR = Math.max(W, H) / 2;
        var ampScale = 3 + (rDist / maxR) * 22;
        var driftX = w.homeX + Math.sin(t * w.dFreqX + w.dPhaseX) * ampScale * 0.7;
        var driftY = w.homeY + Math.cos(t * w.dFreqY + w.dPhaseY) * ampScale;

        // Mouse repulsion → accumulates in offsetX/Y with physics
        var dx = (driftX + w.offsetX) - mx;
        var dy = (driftY + w.offsetY) - my;
        var dist = Math.sqrt(dx*dx + dy*dy);
        var repelRadius = 90;
        if (dist < repelRadius && dist > 0.1) {
          var force = (1 - dist / repelRadius) * 1.5;
          w.offsetVX += (dx / dist) * force;
          w.offsetVY += (dy / dist) * force;
        }

        // Spring offset back to zero
        w.offsetVX += (0 - w.offsetX) * 0.04;
        w.offsetVY += (0 - w.offsetY) * 0.04;

        // Apply offset physics
        w.offsetX += w.offsetVX;
        w.offsetY += w.offsetVY;
        w.offsetVX *= 0.85;
        w.offsetVY *= 0.85;

        // Final position
        var fx = driftX + w.offsetX;
        var fy = driftY + w.offsetY;

        // Blit pre-rendered sprite
        ctx.drawImage(w.sprite, fx - w.sw/2, fy - w.sh/2, w.sw, w.sh);
      }
    }

    function animate(timestamp) {
      draw(timestamp);
      animationId = requestAnimationFrame(animate);
    }

    // Init
    resize();
    words = initWords(W, H);
    animationId = requestAnimationFrame(animate);

    // Mouse tracking
    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });
    canvas.addEventListener('mouseleave', function() {
      mouse.x = -9999;
      mouse.y = -9999;
    });
    // Touch support
    canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      mouse.x = e.touches[0].clientX - rect.left;
      mouse.y = e.touches[0].clientY - rect.top;
    }, { passive: false });
    canvas.addEventListener('touchend', function() {
      mouse.x = -9999;
      mouse.y = -9999;
    });

    // Resize handler
    var resizeTimeout;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function() {
        resize();
        words = initWords(W, H);
      }, 300);
    });

    // Dark mode observer
    new MutationObserver(function() {
      resize();
      words = initWords(W, H);
    }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  }

  // ---- Top Games Bar Chart ----
  function initTopGamesChart() {
    var dom = document.getElementById('chart-top-games');
    if (!dom) return;
    var chart = echarts.init(dom);
    var games = [
      'Hitman：暗杀世界', '八方旅人 1+2', '艾尔登法环', '怪物猎人 崛起+曙光',
      '刺客信条：英灵殿', 'Factorio', '无主之地系列', '巫师 3：狂猎',
      'Persona 5 Royal', '帝国时代 4', '赛博朋克 2077', '怪物猎人 世界+冰原',
      '黑暗之魂 3', '幸福工厂', '刺客信条：奥德赛'
    ];
    var hours = [800,350,326,265,265,262,262,260,254,252,236,235,232,188,182];
    var option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(p) { return p[0].name + '<br/>🎮 ' + p[0].value + ' 小时'; }
      },
      grid: { left: 130, right: 40, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        name: '小时',
        nameTextStyle: { color: textColorSec(), fontSize: 12 },
        axisLabel: { color: textColorSec(), fontSize: 11 },
        splitLine: { lineStyle: { color: isDark() ? '#2d323e' : '#eee' } }
      },
      yAxis: {
        type: 'category',
        data: games.reverse(),
        axisLabel: { color: textColor(), fontSize: 11, width: 120, overflow: 'truncate' },
        axisLine: { lineStyle: { color: isDark() ? '#30363d' : '#ddd' } }
      },
      series: [{
        type: 'bar',
        data: hours.reverse().map(function(v, i) {
          var alpha = 0.55 + (i / hours.length) * 0.45;
          return {
            value: v,
            itemStyle: {
              color: 'rgba(74,144,217,' + alpha + ')',
              borderRadius: [0, 4, 4, 0]
            }
          };
        }),
        barMaxWidth: 28,
        label: {
          show: true,
          position: 'right',
          color: textColorSec(),
          fontSize: 10,
          formatter: '{c}h'
        },
        emphasis: {
          itemStyle: { color: '#e8874b' }
        }
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
    new MutationObserver(function() { chart.setOption(option); }).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }
    );
  }

  // ---- Platform Donut ----
  function initPlatformChart() {
    var dom = document.getElementById('chart-platform');
    if (!dom) return;
    var chart = echarts.init(dom);
    var option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c} 小时 ({d}%)' },
      legend: {
        bottom: 0,
        textStyle: { color: textColor(), fontSize: 11 },
        data: ['PC', '移动端', 'PS5', '掌机(NS+SD)']
      },
      series: [{
        type: 'pie',
        radius: ['50%', '75%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 4,
          borderColor: isDark() ? '#1a1d24' : '#fff',
          borderWidth: 2
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 12, fontWeight: 'bold' },
          scaleSize: 8
        },
        data: [
          { value: 13000, name: 'PC', itemStyle: { color: '#4a90d9' } },
          { value: 5000, name: '移动端', itemStyle: { color: '#50b86c' } },
          { value: 1000, name: 'PS5', itemStyle: { color: '#3498db' } },
          { value: 1000, name: '掌机(NS+SD)', itemStyle: { color: '#e8874b' } }
        ]
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
    new MutationObserver(function() { chart.setOption(option); }).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }
    );
  }

  // ---- Online Spending Bar Chart ----
  function initOnlineSpendingChart() {
    var dom = document.getElementById('chart-online-spending');
    if (!dom) return;
    var chart = echarts.init(dom);
    var games = [
      '金铲铲之战', '原神', '英雄联盟', '崩坏：星穹铁道',
      '暗黑破坏神 4', '鸣潮', '明日方舟：终末地'
    ];
    var spending = [13000, 6000, 4500, 4500, 1200, 1200, 170];
    var hours = [3400, '3年+', 'S2-S14', '3年+', 432, '1年+', '开服至今'];
    var option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: function(p) { return p[0].name + '<br/>💳 ¥' + p[0].value.toLocaleString(); }
      },
      grid: { left: 125, right: 50, top: 10, bottom: 20 },
      xAxis: {
        type: 'value',
        name: '¥',
        nameTextStyle: { color: textColorSec(), fontSize: 12 },
        axisLabel: { color: textColorSec(), fontSize: 10, formatter: function(v) { return '¥' + (v/1000) + 'k'; } },
        splitLine: { lineStyle: { color: isDark() ? '#2d323e' : '#eee' } }
      },
      yAxis: {
        type: 'category',
        data: games.reverse(),
        axisLabel: { color: textColor(), fontSize: 11, width: 115, overflow: 'truncate' },
        axisLine: { lineStyle: { color: isDark() ? '#30363d' : '#ddd' } }
      },
      series: [{
        type: 'bar',
        data: spending.reverse().map(function(v, i) {
          var alpha = 0.55 + (i / spending.length) * 0.45;
          return {
            value: v,
            itemStyle: {
              color: 'rgba(232,135,75,' + alpha + ')',
              borderRadius: [0, 4, 4, 0]
            }
          };
        }),
        barMaxWidth: 24,
        label: {
          show: true,
          position: 'right',
          color: textColorSec(),
          fontSize: 10,
          formatter: function(p) { return '¥' + (p.value/1000).toFixed(1) + 'k'; }
        },
        emphasis: {
          itemStyle: { color: '#4a90d9' }
        }
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
    new MutationObserver(function() { chart.setOption(option); }).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }
    );
  }

  // ---- Genre Hours Treemap ----
  function initGenreHoursChart() {
    var dom = document.getElementById('chart-genre-hours');
    if (!dom) return;
    var chart = echarts.init(dom);
    var genreData = [
      { name: '策略卡牌\n3,460h+', value: 3460 },
      { name: '刷宝射击\n1,612h', value: 1612 },
      { name: 'Soulslike\n& ACT\n1,586h', value: 1586 },
      { name: '开放世界\nRPG\n1,192h', value: 1192 },
      { name: '潜行暗杀\n1,010h', value: 1010 },
      { name: '类暗黑\nARPG\n807h', value: 807 },
      { name: 'JRPG\n731h', value: 731 },
      { name: '工厂模拟\n615h', value: 615 },
      { name: 'RTS\n314h', value: 314 },
      { name: '类吃鸡\n202h', value: 202 },
      { name: '文字冒险\n158h', value: 158 },
      { name: 'MOBA\n~3,000h', value: 3000 }
    ];
    var option = {
      tooltip: {
        formatter: function(info) {
          return info.name.replace(/\n/g, ' ') + '<br/>可统计时长: ' + info.value + 'h';
        }
      },
      series: [{
        type: 'treemap',
        roam: false,
        width: '96%',
        height: '90%',
        left: 'center',
        top: 'center',
        breadcrumb: { show: false },
        label: {
          show: true,
          fontSize: 13,
          fontWeight: 'bold',
          color: '#fff',
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowBlur: 4,
          formatter: function(p) { return p.name; }
        },
        itemStyle: {
          borderColor: isDark() ? '#1a1d24' : '#fff',
          borderWidth: 3,
          borderRadius: 4
        },
        color: ['#4a90d9','#50b86c','#e8874b','#9b59b6','#f39c12','#3498db','#e74c3c','#1abc9c','#2ecc71','#95a5a6','#7f8c8d','#c0392b'],
        data: genreData
      }]
    };
    chart.setOption(option);
    window.addEventListener('resize', function() { chart.resize(); });
    new MutationObserver(function() { chart.setOption(option); }).observe(
      document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }
    );
  }

  // ---- Visibility gate: wait until encrypt container is removed (decrypt success) ----
  function initAllCharts() {
    initWordCloud();
    initTopGamesChart();
    initPlatformChart();
    initOnlineSpendingChart();
    initGenreHoursChart();
  }

  var _chartsInited = false;
  function tryBoot() {
    if (_chartsInited) return;
    var el = document.getElementById('chart-top-games') || document.getElementById('canvas-wordcloud');
    if (el && el.offsetWidth > 0 && el.offsetHeight > 0) {
      _chartsInited = true;
      initAllCharts();
    }
  }

  function bootCharts() {
    // 1. Try immediately (page without encryption, or content already decrypted via saved password)
    tryBoot();
    if (_chartsInited) return;

    // 2. Watch for #hexo-blog-encrypt removal — the exact same signal the encrypt plugin uses
    var container = document.getElementById('hexo-blog-encrypt');
    if (container && container.parentNode) {
      var obs = new MutationObserver(function(ms) {
        for (var m = 0; m < ms.length; m++) {
          for (var n = 0; n < ms[m].removedNodes.length; n++) {
            if (ms[m].removedNodes[n].id === 'hexo-blog-encrypt') {
              // Decryption successful — give the DOM a tick to lay out, then init
              setTimeout(tryBoot, 50);
              obs.disconnect();
              return;
            }
          }
        }
      });
      obs.observe(container.parentNode, { childList: true });
    }

    // 3. Fallback poll (in case the removal signal is missed)
    var polls = 0;
    var pollId = setInterval(function() {
      tryBoot();
      polls++;
      if (_chartsInited || polls > 120) clearInterval(pollId);
    }, 250);
  }

  // Start: wait for ECharts CDN to load, then boot
  waitForECharts(bootCharts);


})();
