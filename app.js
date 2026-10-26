(function(){
  /* ── plain mode: ?plain=1 keeps the graph paper, drops the motion ── */
  var PLAIN = false;
  try {
    var q = new URLSearchParams(location.search).get('plain');
    if (q === '1') sessionStorage.setItem('pf-plain', '1');
    else if (q === '0') sessionStorage.removeItem('pf-plain');
    PLAIN = sessionStorage.getItem('pf-plain') === '1';
  } catch (e) {}
  if (PLAIN) document.documentElement.setAttribute('data-plain', '1');
  (function () {
    var b = document.getElementById('pl');
    if (!b) return;
    b.setAttribute('aria-pressed', String(PLAIN));
    b.addEventListener('click', function () {
      var on = document.documentElement.getAttribute('data-plain') === '1';
      try { if (on) sessionStorage.removeItem('pf-plain'); else sessionStorage.setItem('pf-plain', '1'); } catch (e) {}
      location.search = (function () {
        var u = new URLSearchParams(location.search);
        u.set('plain', on ? '0' : '1');
        return '?' + u.toString();
      })();
    });
  })();

  /* theme — white by default, dark on demand */
  var root = document.documentElement, btn = document.getElementById('tt');
  try { if (localStorage.getItem('pf-theme') === 'dark') root.setAttribute('data-theme','dark'); } catch(e) {}
  btn.addEventListener('click', function(){
    var dark = root.getAttribute('data-theme') === 'dark';
    if (dark) root.removeAttribute('data-theme'); else root.setAttribute('data-theme','dark');
    try { localStorage.setItem('pf-theme', dark ? 'light' : 'dark'); } catch(e) {}
    readColours(); paint();
  });

  /* ── graph paper that bends around the pointer ── */
  var cv = document.getElementById('bg-grid');
  if (PLAIN || !cv) { if (cv) cv.remove(); } else {
  var cx = cv.getContext('2d');
  var W = 0, H = 0, minor = '#16161A', major = '#22222A';
  /* 점 격자. 선이던 시절의 STEP 은 58 이었는데, 점은 그만큼 벌리면
     듬성해 보여서 절반으로 좁혔다. SEG(선을 잘라 그리던 간격)는 필요 없다. */
  var STEP = 28, MAJOR = 4, R = 300, STRENGTH = 0.42;   /* R/STRENGTH are damped below when reduce-motion is on */
  var mx = -1e5, my = -1e5, tx = -1e5, ty = -1e5, raf = null;
  var still = matchMedia('(prefers-reduced-motion: reduce)');

  function readColours(){
    var s = getComputedStyle(root);
    minor = (s.getPropertyValue('--grid') || '#16161A').trim();
    major = (s.getPropertyValue('--grid-hi') || '#22222A').trim();
  }
  function size(){
    var d = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * d); cv.height = Math.round(H * d);
    cv.style.width = W + 'px'; cv.style.height = H + 'px';
    cx.setTransform(d, 0, 0, d, 0, 0);
  }
  /* push points away from the cursor — a lens bulging over the paper */
  function wx(x, y){
    var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return x;
    var k = 1 - Math.sqrt(d2) / R;
    return x + dx * k * k * STRENGTH;
  }
  function wy(x, y){
    var dx = x - mx, dy = y - my, d2 = dx * dx + dy * dy;
    if (d2 >= R * R) return y;
    var k = 1 - Math.sqrt(d2) / R;
    return y + dy * k * k * STRENGTH;
  }
  /* 모눈이 아니라 점. 격자가 만나던 자리에만 점을 찍는다 — 글자 뒤로
     선이 지나가지 않아 본문이 훨씬 덜 어지럽다. 커서 렌즈는 그대로라
     점들이 커서를 피해 밀려난다. */
  var TAU = Math.PI * 2;
  function paint(){
    if (!W) return;
    cx.clearRect(0, 0, W, H);
    var i, j, x, y, big;
    for (j = 0, y = 0; y <= H + STEP; y += STEP, j++){
      for (i = 0, x = 0; x <= W + STEP; x += STEP, i++){
        big = (i % MAJOR === 0 && j % MAJOR === 0);
        cx.fillStyle = big ? major : minor;
        cx.beginPath();
        cx.arc(wx(x, y), wy(x, y), big ? 1.6 : 1.05, 0, TAU);
        cx.fill();
      }
    }
  }
  function tick(){
    mx += (tx - mx) * 0.14; my += (ty - my) * 0.14;
    paint();
    raf = (Math.abs(tx - mx) > 0.4 || Math.abs(ty - my) > 0.4) ? requestAnimationFrame(tick) : null;
  }
  readColours(); size(); paint();
  window.addEventListener('resize', function(){ size(); paint(); }, { passive: true });
  /* the warp used to be switched off entirely here, which left the page dead
     still for anyone with reduce-motion on. it follows the pointer rather than
     playing on its own, so a damped version is fine to keep. */
  if (still.matches){ STRENGTH *= 0.34; R *= 0.7; }
  {
    window.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      tx = e.clientX; ty = e.clientY;
      if (mx < -1e4){ mx = tx; my = ty; }
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
    window.addEventListener('pointerleave', function(){
      tx = -1e5; ty = -1e5;
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: true });
  }

  /* folders — all closed at rest; click one and its files come out below */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.folder[role="tab"]'));
  var hint = document.getElementById('folder-hint');
  function open(tab, focus){
    tabs.forEach(function(t){
      var on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.setAttribute('aria-expanded', String(on));
      t.querySelector('.folder-state').textContent = on ? '닫기 ×' : '폴더 열기 →';
      document.getElementById(t.getAttribute('aria-controls')).hidden = !on;
    });
    if (hint) hint.hidden = !!tab;
    if (focus && tab) tab.focus();
  }
  tabs.forEach(function(t, i){
    t.addEventListener('click', function(){
      open(t.getAttribute('aria-selected') === 'true' ? null : t);
    });
    t.addEventListener('keydown', function(e){
      var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!d) return;
      e.preventDefault();
      open(tabs[(i + d + tabs.length) % tabs.length], true);
    });
  });
  if (tabs.length) open(null);
  } /* end grid module */


  /* stickers peel off the profile card, then open the link */
  Array.prototype.forEach.call(document.querySelectorAll('.sticker'), function(s){
    s.addEventListener('click', function(e){
      if (e.metaKey || e.ctrlKey || e.shiftKey) return;              // let people open in a new tab
      if (PLAIN) return;
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (s.classList.contains('peel')) return;
      e.preventDefault();
      s.classList.add('peel');
      var go = function(){ window.open(s.href, '_blank', 'noopener'); s.classList.remove('peel'); };
      s.addEventListener('animationend', go, { once: true });
      setTimeout(function(){ if (s.classList.contains('peel')) go(); }, 700);   // fallback
    });
  });

  /* bookmark tabs inside each project folder */
  var SEC = [['overview','개요'],['scope','나의 활동'],['decision','기술 의사결정'],
             ['flow','User Flow'],['arch','아키텍처'],['trouble','트러블슈팅'],['retro','회고']];
  var BMC = ['var(--c-blue)','var(--c-green)','var(--c-yellow)','var(--c-pink)'];

  Array.prototype.forEach.call(document.querySelectorAll('.panel'), function(panel){
    var els = Array.prototype.slice.call(panel.querySelectorAll('[data-sec]'));
    if (!els.length) return;
    var body = panel.querySelector('.deep-body');
    var present = SEC.filter(function(s){
      return els.some(function(e){ return e.getAttribute('data-sec') === s[0]; });
    });
    var strip = document.createElement('div');
    strip.className = 'bm';
    strip.setAttribute('role', 'tablist');
    strip.setAttribute('aria-label', '프로젝트 내용 구분');

    function pick(key){
      els.forEach(function(e){ e.hidden = e.getAttribute('data-sec') !== key; });
      if (body) body.hidden = !Array.prototype.some.call(
        body.querySelectorAll('[data-sec]'), function(e){ return !e.hidden; });
      Array.prototype.forEach.call(strip.children, function(b, i){
        b.setAttribute('aria-selected', String(present[i][0] === key));
      });
    }

    present.forEach(function(s, i){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = s[1];
      b.setAttribute('role', 'tab');
      b.style.setProperty('--bmc', BMC[i % BMC.length]);
      b.style.zIndex = String(20 - i);
      b.addEventListener('click', function(){ pick(s[0]); });
      strip.appendChild(b);
    });

    panel.querySelector('.panel-hd').insertAdjacentElement('afterend', strip);
    pick(present[0][0]);
  });

  /* filters */
  var bar = document.getElementById('filters');
  if (bar) {
  var cards = Array.prototype.slice.call(document.querySelectorAll('#grid .card'));
  bar.addEventListener('click', function(e){
    var b = e.target.closest('button[data-f]');
    if (!b) return;
    Array.prototype.forEach.call(bar.querySelectorAll('button'), function(x){ x.setAttribute('aria-pressed', String(x === b)); });
    var f = b.getAttribute('data-f');
    cards.forEach(function(c){
      c.hidden = !(f === 'all' || (c.getAttribute('data-tags') || '').split(' ').indexOf(f) > -1);
    });
  });
  }
  /* ── timeline: edge-hover scrolling + click-to-preview ── */
  (function(){
    var wrap = document.querySelector('.tlx-wrap');
    var lane = document.querySelector('.tlx');
    if (!wrap || !lane) return;

    /* edge auto-scroll: the closer to an edge, the faster it flows */
    var EDGE = 110, MAX = 15, vel = 0, raf = null;
    function step(){
      if (vel === 0) { raf = null; return; }
      lane.scrollLeft += vel;
      follow();
      raf = requestAnimationFrame(step);
    }
    function setVel(v){
      vel = v;
      if (vel !== 0 && !raf) raf = requestAnimationFrame(step);
    }
    lane.addEventListener('pointermove', function(e){
      if (e.pointerType === 'touch') return;
      var r = lane.getBoundingClientRect();
      var dl = e.clientX - r.left, dr = r.right - e.clientX;
      if (dl < EDGE)      setVel(-MAX * (1 - dl / EDGE));
      else if (dr < EDGE) setVel( MAX * (1 - dr / EDGE));
      else                setVel(0);
    }, { passive: true });
    lane.addEventListener('pointerleave', function(){ setVel(0); }, { passive: true });

    /* The board leans, so travelling along it has to move diagonally. Scroll
       alone slides the rule off the top of the frame; pinning the rule to the
       middle of the view and letting the scroll carry the eye down-left /
       up-right makes the board hold still while you move along it.

       It also pays for itself: once the view follows the rule, only the
       VISIBLE window's rise (laneW * tan) has to fit, not the whole rule's
       (railW * tan), so the section gets a few hundred pixels shorter. */
    var rail = lane.querySelector('.tlx-rail');
    var k = 0, laneW = 0, railW = 0;

    function follow(){
      if (!rail) return;
      if (k <= 0.001) { rail.style.setProperty('--ty', '0px'); return; }
      var cx = lane.scrollLeft + laneW / 2;
      rail.style.setProperty('--ty', ((cx - railW / 2) * k).toFixed(1) + 'px');
    }
    function measure(){
      if (!rail) return;
      /* flat on phones and under prefers-reduced-motion, where --sk is 0 */
      k = -Math.tan((parseFloat(getComputedStyle(lane).getPropertyValue('--sk')) || 0) * Math.PI / 180);
      laneW = lane.clientWidth;
      railW = rail.offsetWidth;
      var card = lane.querySelector('.tlx-card');
      var lean = card ? card.offsetWidth / 2 * k : 0;
      if (k > 0.001 && railW > 0) lane.style.paddingBlock = Math.ceil(laneW / 2 * k + lean + 13) + 'px';
      else lane.style.paddingBlock = '';
      follow();
    }

    function edges(){
      wrap.classList.toggle('can-l', lane.scrollLeft > 4);
      wrap.classList.toggle('can-r', lane.scrollLeft < lane.scrollWidth - lane.clientWidth - 4);
      follow();
    }
    lane.addEventListener('scroll', edges, { passive: true });
    window.addEventListener('resize', function(){ measure(); edges(); }, { passive: true });
    measure();
    edges();
    /* card images settle after load and can change the rail's width */
    window.addEventListener('load', measure);

    /* click a card -> short overview, with a link into the detail page */
    var peek = document.getElementById('tl-peek');
    if (!peek) return;
    var pWhen = peek.querySelector('.tlx-peek-when'),
        pT    = peek.querySelector('.tlx-peek-t'),
        pS    = peek.querySelector('.tlx-peek-s'),
        pGo   = peek.querySelector('.tlx-peek-go');

    function close(){
      peek.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.tlx-item.sel'), function(i){ i.classList.remove('sel'); });
    }
    document.getElementById('tl-peek-x').addEventListener('click', close);

    Array.prototype.forEach.call(document.querySelectorAll('.tlx-card'), function(card){
      card.addEventListener('click', function(){
        var item = card.closest('.tlx-item');
        if (item.classList.contains('sel')) { close(); return; }
        close();
        item.classList.add('sel');
        peek.style.setProperty('--tc', getComputedStyle(item).getPropertyValue('--tc'));
        pWhen.textContent = card.querySelector('.tlx-when').textContent;
        pT.textContent    = card.querySelector('h4').textContent;
        pS.textContent    = card.getAttribute('data-sum') || card.querySelector('p').textContent;
        pGo.setAttribute('href', card.getAttribute('data-href'));
        peek.hidden = false;
        peek.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      });
    });
  })();

  /* ══════════ role view — ?role=fe | infra | data | pm ══════════ */
  (function () {
    var P = {
      derobm:   { n: 'DERO 비즈니스 모델',  y: '2026.07 – 08', c: 'c-pink',   p: ['수익화 4단계', '규칙 vs AI', '피치덱 20장'],
                  b: [['문제 정의', '만든 시뮬레이터를 <b>어떻게 돈이 되게 할 것인가</b>'],
                       ['나의 역할', '가치 분석 · <b>수익 모델 설계</b> · <b>디지털 마케팅</b> · 인터뷰 설계'],
                       ['핵심 경험', '앞 단계가 다음을 여는 <b>수익화 4단계</b>로 순서를 묶음'],
                       ['기술 성과', '피치덱 <b>20장</b> · 검증 못 한 가정을 따로 명시']] },
      vimp:     { n: 'Bimp',               y: '2024.03 – 06', c: 'c-blue',   p: ['YOLO 인식', '추천 알고리즘', '재고 정합성'],
                  b: [['문제 정의', '추천이 아니라 <b>등록의 불편</b>이 진짜 병목이었다'],
                       ['나의 역할', '인식 모델 · 추천 로직 · 재고 관리 설계'],
                       ['핵심 경험', '서비스 문제를 <b>재정의</b>해 기능 범위를 다시 그림'],
                       ['기술 성과', 'YOLO 기반 식재료 인식 · <b>대한산업공학회 장려상</b>']] },
      dero:     { n: 'DERO',               y: '2026.07 – 08', c: 'c-green',  p: ['blue-green', 'Three.js', '38MB → 378KB'],
                  b: [['문제 정의', '구매 전 “내 책상에 맞을까”를 확인할 수단 없음 (<b>77명 조사</b>)'],
                       ['나의 역할', '<b>프로젝트 기획(PM) · 프로젝트 관리</b> · 백엔드 · 인프라'],
                       ['핵심 경험', '6주·5인 조건을 먼저 적고 <b>뺄 기능부터</b> 정함'],
                       ['기술 성과', '요구 <b>3개→6개</b>에도 일정 지연 <b>0</b> · 경진대회 우수상']] },
      aws:      { n: 'AWS 예약 서비스',     y: '2024.11 – 12', c: 'c-yellow', p: ['멀티 리전', '−20%', 'OpenSearch'],
                  b: [['문제 정의', '“안정성을 얼마나 살 것인가”를 <b>기준 문제</b>로 전환'],
                       ['나의 역할', '<b>팀장</b> · 클라우드 아키텍처 · 백엔드'],
                       ['핵심 경험', '비용을 항목별로 분해해 최대 항목(NAT Gateway) 특정'],
                       ['기술 성과', '멀티 리전 설계 · 비용 <b>−20%</b> · <b>최우수상</b>']] },
      lumiere:  { n: 'Lumière',            y: '2026.05 – 06', c: 'c-pink',   p: ['Cloudflare Tunnel', '데이터 계약', 'FastAPI'],
                  b: [['문제 정의', '진단이 <b>구매로 이어지지 않는</b> 빈 칸'],
                       ['나의 역할', 'AI 설계 · 클라우드 아키텍처 · 배포'],
                       ['핵심 경험', '코드보다 <b>주고받을 데이터 양식</b>을 먼저 확정'],
                       ['기술 성과', '설계 문서 <b>7종</b> · 배포 시 수정 지점 <b>3곳 → 0곳</b>']] },
      pawlice:  { n: '멍경찰과 냥도둑',      y: '2026.01 – 06', c: 'c-yellow', p: ['STT 5종', '비대칭 설계', 'Unity'],
                  b: [['문제 정의', '역할이 다른 두 편이 <b>서로에게 영향</b>을 주게 하는 규칙'],
                       ['나의 역할', '게임 기획 · 규칙 설계 · 구현 · 검증 (1인)'],
                       ['핵심 경험', '손이 묶인 상황이라 <b>음성이 유일한 입력 채널</b>'],
                       ['기술 성과', '음성 명령 <b>5종</b> 실동작 · 비대칭 구조 완성']] },
      quiz:     { n: '실시간 노션 퀴즈 쇼',  y: '2026.03 – 04', c: 'c-blue',   p: ['Notion API', 'WebSocket', '3~4h → 2h'],
                  b: [['문제 정의', '스터디 시간의 대부분이 공부가 아니라 <b>운영</b>'],
                       ['나의 역할', '문제 정의 · 기획 · 개발 · 운영 적용 (1인)'],
                       ['핵심 경험', '새 도구를 배우게 하지 않고 <b>쓰던 노션을 그대로</b> 읽음'],
                       ['기술 성과', '회차당 준비시간 <b>3~4시간 → 2시간</b>']] },
      cafe:     { n: '인천 카페 창업 분석',  y: '2025',         c: 'c-green',  p: ['150개 행정동', 'SHAP', 'BERT'],
                  b: [['문제 정의', '창업자에게 필요한 건 점수가 아니라 <b>점수의 이유</b>'],
                       ['나의 역할', '데이터 수집 · 변수 설계 · 분석 · 해석'],
                       ['핵심 경험', '목표를 정확도에서 <b>설명 가능성</b>으로 옮김'],
                       ['기술 성과', '행정동 <b>150개</b> 수집 · 매출 상관 <b>상위 9개 변수</b> 특정']] },
      movierec: { n: '영화 추천 (NCF)',     y: '2025',         c: 'c-pink',   p: ['GMF vs NNMF', '과적합 판정', 'PyTorch'],
                  b: [['문제 정의', '어떤 모델이 좋은지 판단할 <b>기준</b>부터 필요'],
                       ['나의 역할', '모델 구현 · 비교 실험 · 보고서'],
                       ['핵심 경험', '학습 성능이 아니라 <b>일반화 성능</b>으로 선택'],
                       ['기술 성과', 'GMF vs NNMF 비교 · 과적합 판정']] }
    };

    var ROLES = {
      fe: {
        label: 'Frontend · UI/UX', cls: 'ax-fe',
        pill: 'Portfolio 2026 · Frontend · UI/UX',
        head: '화면에서 사람이 할 수 있는 일을 설계합니다.',
        sub: '입력 채널과 성능 예산을 먼저 정하고 시작합니다. 와이어프레임·스토리보드부터 3D 시뮬레이터와 게임 인터랙션까지 만들었습니다.',
        top: ['dero', 'lumiere', 'pawlice']
      },
      infra: {
        label: 'Infra', cls: 'ax-infra',
        pill: 'Portfolio 2026 · Cloud · Infra',
        head: '한정된 자원 안에서 끊기지 않게 만듭니다.',
        sub: 'EC2 한 대의 무중단 배포부터 멀티 리전 설계와 비용 구조 분해까지. 무엇을 감수했는지 함께 적습니다.',
        top: ['aws', 'dero', 'vimp']
      },
      data: {
        label: 'Data · AI', cls: 'ax-data',
        pill: 'Portfolio 2026 · Data · AI',
        head: '모델의 출력을 믿을 수 있는 데이터로 바꿉니다.',
        sub: '인식은 틀린다는 전제에서 검증 규칙과 보정 흐름을 함께 설계합니다. 지표는 무엇 대비인지와 같이 적습니다.',
        top: ['vimp', 'cafe', 'aws']
      },
      product: {
        label: 'Product Engineer', cls: 'ax-pm',
        pill: 'Portfolio 2026 · Product Engineer',
        head: '제품의 문제를 기술로 풉니다.',
        sub: '기획부터 배포·운영까지 한 줄로 가져갑니다. 선택할 때마다 기준과 트레이드오프를 남겼습니다.',
        top: ['dero', 'vimp', 'lumiere']
      },
      pm: {
        label: 'PM · 기획', cls: 'ax-pm',
        pill: 'Portfolio 2026 · PM · Product',
        head: '문제를 다시 정의하고, 만들지 않을 것부터 정합니다.',
        sub: '사용자 조사로 문제를 특정하고, 기간·인원 조건 안에서 범위를 자릅니다. 기각한 선택과 그 근거를 함께 남깁니다.',
        top: ['dero', 'lumiere', 'derobm']
      }
    };

    /* The URL is the only source of truth. This used to fall back to a
       sessionStorage copy when the address had no ?role=, which meant the
       plain link kept showing whichever role had been opened earlier in the
       tab. The role still follows internal navigation: every internal link
       gets the parameter appended a few lines down. */
    var role = null;
    try {
      role = new URLSearchParams(location.search).get('role');
      if (role && !ROLES[role]) role = null;
    } catch (e) { role = null; }
    if (!role) return;

    var R = ROLES[role];
    document.documentElement.setAttribute('data-role', role);

    /* carry the role through internal navigation */
    Array.prototype.forEach.call(document.querySelectorAll('a[href^="/"]'), function (a) {
      var h = a.getAttribute('href');
      if (h.indexOf('role=') > -1 || h.indexOf('#') === 0) return;
      a.setAttribute('href', h + (h.indexOf('?') > -1 ? '&' : '?') + 'role=' + role);
    });

    /* hero copy — data-fixed 가 붙은 문단은 건드리지 않는다.
       사진을 이력 쪽으로 옮기면서 그 페이지에도 .hero-lede 가 생겼는데,
       거기 적힌 전공 설명까지 직무 문구로 덮어써 버리고 있었다. */
    var pill = document.querySelector('.hero .pill');
    if (pill) pill.textContent = R.pill;
    var lede = document.querySelector('.hero-lede:not([data-fixed])');
    if (lede) {
      var big = lede.querySelector('.big');
      if (big) big.textContent = R.head;
      var en = lede.querySelector('.en');
      if (en) en.textContent = R.sub;
    }

    /* featured folders → this role's top three */
    var row = document.querySelector('.folders');
    if (row && document.querySelector('.hero')) {
      /* three folders, three different colours - a role's top three can share
         a project colour, so a collision falls through to the next free hue */
      var PAL = ['c-green', 'c-blue', 'c-yellow', 'c-pink'];
      var want = R.top.map(function (id) { return P[id].c; });
      var claims = {};
      want.forEach(function (c) { claims[c] = (claims[c] || 0) + 1; });
      var used = {}, cols = [];
      want.forEach(function (c, i) { if (claims[c] === 1) { used[c] = 1; cols[i] = c; } });
      want.forEach(function (c, i) {
        if (cols[i]) return;
        if (!used[c]) { used[c] = 1; cols[i] = c; return; }
        for (var k = 0; k < PAL.length; k++) {
          if (!used[PAL[k]]) { used[PAL[k]] = 1; cols[i] = PAL[k]; return; }
        }
        cols[i] = c;
      });
      row.innerHTML = R.top.map(function (id, i) {
        var x = P[id];
        return '<a class="folder" style="--fc:var(--' + cols[i] + ')" href="/projects/' + (id === 'derobm' ? 'dero-bm' : id) + '?role=' + role + '">' +
          '<span class="folder-art" aria-hidden="true"><span class="fb"></span><span class="papers">' +
          x.p.map(function (t, k) { return '<span class="paper p' + (k + 1) + '">' + t + '</span>'; }).join('') +
          '</span><span class="ff"><span class="mark">0' + (i + 1) + '</span></span></span>' +
          '<span class="folder-cap"><span class="nm">' + x.n + '</span><span class="yr">' + x.y + '</span></span>' +
          '<span class="folder-desc">' + x.b.map(function (r) {
            return '<span class="fd-k">' + r[0] + '</span>'
                 + '<span class="fd-v">' + r[1] + '</span>';
          }).join('') + '</span>' +
          '<span class="folder-state">자세히 보기 →</span></a>';
      }).join('');

    }

    /* ── achievements: this role's evidence first ──
       The switcher used to change only which projects were featured, so a PM
       opening DERO — the project four roles lead with — still met three
       engineering numbers, and the scope decision that is the PM evidence sat
       folded away. Each <li> carries data-axis; the ones that speak to this
       role move to the front, the first three stay visible and the rest go
       back into the fold.

       The written order is the fallback: no ?role=, no JS, or an untagged
       item, and the page reads exactly as authored. */
    (function () {
      var vis = document.querySelector('.block[data-sec="overview"] > ul.kpi');
      if (!vis) return;
      var more = document.querySelector('.kpi-more');
      var hid = more && more.querySelector('ul.kpi');

      var items = [].slice.call(vis.children);
      if (hid) items = items.concat([].slice.call(hid.children));
      if (items.length < 2) return;

      /* stable: only items tagged for this role move, and only past untagged
         ones — two matches keep the order the author gave them */
      var rank = items.map(function (li, i) {
        var ax = (li.getAttribute('data-axis') || '').split(/\s+/);
        return { li: li, hit: ax.indexOf(role) > -1 ? 0 : 1, i: i };
      });
      rank.sort(function (a, b) { return a.hit - b.hit || a.i - b.i; });
      if (!rank.some(function (r) { return r.hit === 0; })) return;

      var KEEP = Math.min(3, items.length);
      rank.forEach(function (r, i) { (i < KEEP ? vis : hid || vis).appendChild(r.li); });

      if (more && hid) {
        var left = hid.children.length;
        if (!left) { more.hidden = true; return; }
        more.hidden = false;
        var sum = more.querySelector('summary');
        if (sum) sum.textContent = '성과 ' + left + '건 더 보기';
      }
    })();

    /* ── timeline slideshow: lead with this role's own diagrams ──
       The AWS card opens on aws-architecture, a wider view drawn before the
       service-level diagrams existed. What was actually built on that project
       is two infrastructures — a single region first, then extended to multi
       region — so an infra reader should meet those two, in that order, before
       anything else. Same principle as the achievement ordering above: the
       material is unchanged, only the order is. Other roles keep the sequence
       as authored. */
    var LEAD = {
      infra: { '/projects/aws': ['aws-arch-single', 'aws-arch-multi', 'aws-infra-arch'] }
    };
    if (LEAD[role]) {
      Object.keys(LEAD[role]).forEach(function (href) {
        var card = document.querySelector('.tlx-card[data-href="' + href + '"]');
        if (!card) return;
        var want = LEAD[role][href];
        var imgs = (card.getAttribute('data-imgs') || '').split(',').filter(Boolean);
        imgs = want.concat(imgs.filter(function (n) { return want.indexOf(n) < 0; }));
        card.setAttribute('data-imgs', imgs.join(','));
      });
    }

    /* pre-apply the matching filter on /projects */
    var fb = document.querySelector('.filters button[data-f="' + role + '"]');
    if (fb) fb.click();

    /* the switcher is a tool for me, not something a reader should see —
       a recruiter seeing five other job-title views reads as mass-applying.
       it only appears with ?sw=1 */
    var showSwitcher = false;
    try { showSwitcher = new URLSearchParams(location.search).get('sw') === '1'; } catch (e) {}
    if (!showSwitcher) return;
    /* a banner so nobody is confused about why the page looks different */
    var bar = document.createElement('div');
    bar.className = 'rolebar';
    bar.innerHTML = '<div class="rolebar-in">' +
      '<span class="ax ' + R.cls + '">' + R.label + '</span>' +
      '<span class="rolebar-t">직무 맞춤 보기 — 이 직무 기준으로 프로젝트 순서와 소개를 바꿔 보여주고 있습니다.</span>' +
      '<span class="rolebar-sw">' +
        Object.keys(ROLES).map(function (k) {
          return '<a href="?role=' + k + '"' + (k === role ? ' aria-current="true"' : '') + '>' + ROLES[k].label + '</a>';
        }).join('') +
      '<a class="rolebar-x" href="' + location.pathname + '?role=none">전체 보기</a></span></div>';
    document.body.insertBefore(bar, document.body.firstChild.nextSibling);
  })();


  /* ── timeline cards: hover slideshow / mini icon ── */
  (function () {
    var ICONS = {
      paw: '<svg viewBox="0 0 48 40" aria-hidden="true">' +
        '<g class="pulse"><ellipse class="fl" cx="17" cy="26" rx="8.5" ry="7"/>' +
        '<circle class="fl" cx="9" cy="15" r="3.4"/><circle class="fl" cx="16" cy="11" r="3.6"/>' +
        '<circle class="fl" cx="24" cy="13" r="3.2"/></g>' +
        '<path class="st w1" d="M31 16 q4 8 0 16"/><path class="st w2" d="M37 12 q6 12 0 24"/></svg>',
      camera: '<svg viewBox="0 0 48 40" aria-hidden="true">' +
        '<rect class="st" x="5" y="11" width="38" height="24" rx="4"/>' +
        '<path class="st" d="M17 11 l3-4h8l3 4"/>' +
        '<circle class="st blink" cx="24" cy="23" r="7"/>' +
        '<circle class="fl" cx="37" cy="16" r="1.6"/></svg>'
    };
    Array.prototype.forEach.call(document.querySelectorAll('.tlx-card'), function (card) {
      var imgs = card.getAttribute('data-imgs');
      var icon = card.getAttribute('data-icon');
      var when = card.querySelector('.tlx-when');
      if (!when) return;

      if (icon && ICONS[icon]) {
        var box = document.createElement('span');
        box.className = 'tlx-ico';
        box.innerHTML = ICONS[icon];
        card.insertBefore(box, when);
        return;
      }
      if (!imgs) return;

      var names = imgs.split(','), built = false, timer = null, at = 0, shot, pics, dots;

      function build() {
        if (built) return;
        shot = document.createElement('span');
        shot.className = 'tlx-shot';
        shot.innerHTML =
          names.map(function (n, i) {
            return '<img src="/assets/' + n + '.webp" alt="" loading="lazy"' + (i === 0 ? ' class="on"' : '') + '>';
          }).join('') +
          '<span class="bar">' + names.map(function (_, i) {
            return '<i' + (i === 0 ? ' class="on"' : '') + '></i>';
          }).join('') + '</span>';
        card.insertBefore(shot, when);
        pics = shot.querySelectorAll('img');
        dots = shot.querySelectorAll('.bar i');
        built = true;
      }
      function show(i) {
        pics[at].classList.remove('on'); dots[at].classList.remove('on');
        at = i % pics.length;
        pics[at].classList.add('on'); dots[at].classList.add('on');
      }
      function start() {
        build();
        if (timer || pics.length < 2) return;
        timer = setInterval(function () { show(at + 1); }, 1100);
      }
      function stop() {
        if (timer) { clearInterval(timer); timer = null; }
        if (built && at !== 0) show(0);
      }
      build();
      card.addEventListener('pointerenter', start);
      card.addEventListener('focus', start);
      card.addEventListener('pointerleave', function () {
        if (!card.closest('.tlx-item').classList.contains('sel')) stop();
      });
      card.addEventListener('blur', stop);
    });
  })();

  /* ── 배너 아랫줄: 쳤다 지웠다를 되풀이 ──
     차분한 보기(PLAIN)나 모션 줄이기에서는 첫 낱말만 세워 둔다. */
  (function () {
    var el = document.getElementById('bn-w');
    if (!el) return;
    var WORDS = ['PORTFOLIO', 'CASE STUDY', 'DECISIONS'];
    if (PLAIN || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = WORDS[0];
      return;
    }
    var w = 0, i = WORDS[0].length, back = true, hold = 1600;
    (function step() {
      el.textContent = WORDS[w].slice(0, i);
      var wait;
      if (!back && i === WORDS[w].length) { back = true; wait = hold; }
      else if (back && i === 0) { back = false; w = (w + 1) % WORDS.length; wait = 340; }
      else { i += back ? -1 : 1; wait = back ? 52 : 108; }
      setTimeout(step, wait);
    })();
  })();

})();
/* ═══════════════════════════════════════════════════════════════════
   증거 이미지 확대 뷰어 (2026-09-21)
   .shots 안의 figure.shot > img 를 클릭·Enter 로 원본 크기로 띄운다.
   같은 .shots 묶음 안에서 ‹ › · ←/→ 로 이동, Esc 로 닫기(native dialog).
   확대 상태에서 한 번 더 클릭하면 1:1 원본 픽셀, 다시 누르면 화면 맞춤.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  var groups = [].slice.call(document.querySelectorAll('.shots'));
  if (!groups.length || !window.HTMLDialogElement) return;

  var shots = [];
  groups.forEach(function (g) {
    var imgs = [].slice.call(g.querySelectorAll('.shot img'));
    imgs.forEach(function (im, i) {
      im.setAttribute('tabindex', '0');
      im.setAttribute('role', 'button');
      im.setAttribute('aria-haspopup', 'dialog');
      im.setAttribute('aria-label', (im.alt || '이미지') + ' — 크게 보기');
      im.__lbSet = imgs;
      im.__lbAt = i;
    });
    shots = shots.concat(imgs);
  });
  if (!shots.length) return;

  var dlg = document.createElement('dialog');
  dlg.className = 'lbx';
  dlg.setAttribute('aria-label', '이미지 확대 보기');
  dlg.innerHTML =
    '<div class="lbx-wrap">' +
      '<div class="lbx-stage"><img class="lbx-img" alt=""></div>' +
      '<div class="lbx-foot"><p class="lbx-cap"></p><p class="lbx-meta"></p></div>' +
      '<button type="button" class="lbx-btn lbx-x" aria-label="닫기">✕</button>' +
      '<button type="button" class="lbx-btn lbx-prev" aria-label="이전 이미지">‹</button>' +
      '<button type="button" class="lbx-btn lbx-next" aria-label="다음 이미지">›</button>' +
    '</div>';
  document.body.appendChild(dlg);

  var stage = dlg.querySelector('.lbx-stage');
  var big   = dlg.querySelector('.lbx-img');
  var cap   = dlg.querySelector('.lbx-cap');
  var meta  = dlg.querySelector('.lbx-meta');
  var bPrev = dlg.querySelector('.lbx-prev');
  var bNext = dlg.querySelector('.lbx-next');
  var set = [], at = 0, opener = null;

  function paint() {
    var src = set[at];
    big.classList.remove('is-full');
    big.src = src.currentSrc || src.src;
    big.alt = src.alt || '';
    var fc = src.parentNode.querySelector('figcaption');
    cap.textContent = fc ? fc.textContent.trim() : '';
    meta.textContent = '';
    big.onload = function () {
      meta.textContent = big.naturalWidth + ' × ' + big.naturalHeight +
        (set.length > 1 ? '  ·  ' + (at + 1) + ' / ' + set.length : '') +
        '  ·  클릭하면 1:1';
    };
    bPrev.hidden = bNext.hidden = set.length < 2;
    stage.scrollTop = 0; stage.scrollLeft = 0;
  }

  function open(img) {
    set = img.__lbSet || [img];
    at = img.__lbAt || 0;
    opener = img;
    paint();
    dlg.showModal();
  }

  function step(d) {
    if (set.length < 2) return;
    at = (at + d + set.length) % set.length;
    paint();
  }

  shots.forEach(function (im) {
    im.addEventListener('click', function () { open(im); });
    im.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(im); }
    });
  });

  big.addEventListener('click', function (e) {
    e.stopPropagation();
    big.classList.toggle('is-full');
  });
  bPrev.addEventListener('click', function (e) { e.stopPropagation(); step(-1); });
  bNext.addEventListener('click', function (e) { e.stopPropagation(); step(1); });
  dlg.querySelector('.lbx-x').addEventListener('click', function () { dlg.close(); });

  /* 배경(이미지 바깥) 클릭으로 닫기 */
  stage.addEventListener('click', function (e) { if (e.target === stage) dlg.close(); });

  dlg.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });

  dlg.addEventListener('close', function () {
    big.removeAttribute('src');
    if (opener) { try { opener.focus(); } catch (err) {} }
  });

})();
