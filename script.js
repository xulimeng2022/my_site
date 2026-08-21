/* ==========================================================================
   个人主页交互脚本
   功能：导航滚动状态、滚动联动滑块（桌面导航 + 移动端Tab栏）、元素显现、回到顶部
   ========================================================================== */

(function () {
  'use strict';

  var nav = document.querySelector('.nav');
  var toTop = document.querySelector('.to-top');
  var revealEls = document.querySelectorAll('.reveal');

  /* ================= 滚动联动（Scrollspy） ================= */
  var sections = ['about', 'education', 'skills', 'contact'];

  /* 导航组：桌面顶部导航 + 移动端底部Tab栏，各带自己的滑块 */
  var groups = [];
  function initGroup(container, indicator) {
    if (!container || !indicator) return null;
    return {
      container: container,
      indicator: indicator,
      links: Array.prototype.slice.call(container.querySelectorAll('a[data-section]'))
    };
  }
  var desktopGroup = initGroup(document.querySelector('.nav-links'), document.querySelector('.nav-indicator'));
  var mobileGroup = initGroup(document.querySelector('.mobile-tabs'), document.querySelector('.mobile-tabs-indicator'));
  if (desktopGroup) groups.push(desktopGroup);
  if (mobileGroup) groups.push(mobileGroup);

  var currentActive = null;

  /* 判断元素是否可见（display:none 时 offsetWidth 为 0） */
  function isVisible(el) {
    return !!el && el.offsetWidth > 0;
  }

  /* 计算滑块相对导航容器的位置 */
  function moveIndicator(group, link) {
    var linkRect = link.getBoundingClientRect();
    var containerRect = group.container.getBoundingClientRect();
    group.indicator.style.transform = 'translateX(' + (linkRect.left - containerRect.left) + 'px)';
    group.indicator.style.width = linkRect.width + 'px';
  }

  /* 设置当前激活区块：同步更新所有导航组 */
  function setActive(id) {
    if (id === currentActive) return;
    currentActive = id;

    groups.forEach(function (g) {
      g.links.forEach(function (a) {
        a.classList.toggle('active', a.dataset.section === id);
      });

      var activeLink = g.links.filter(function (a) { return a.dataset.section === id; })[0];
      if (!activeLink) return;

      /* 组不可见时（如桌面导航在手机端隐藏）跳过滑块定位 */
      if (isVisible(g.container)) {
        moveIndicator(g, activeLink);
        g.indicator.classList.add('show');
      }
    });
  }

  /* 判断当前滚动位置对应的区块 */
  function getActiveSection() {
    var scrollPos = window.scrollY + nav.offsetHeight + 60;

    /* 滚动到底部附近时固定为最后一个区块 */
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12) {
      return sections[sections.length - 1];
    }

    var active = null;
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var top = el.getBoundingClientRect().top + window.scrollY;
      if (top <= scrollPos) active = id;
    });
    return active;
  }

  /* 滚动与窗口变化时刷新 */
  function refresh() {
    var id = getActiveSection();
    if (id) {
      setActive(id);
    } else if (currentActive !== null) {
      /* 回到首屏：清除激活态并隐藏滑块 */
      currentActive = null;
      groups.forEach(function (g) {
        g.links.forEach(function (a) { a.classList.remove('active'); });
        g.indicator.classList.remove('show');
      });
    }
  }

  window.addEventListener('scroll', refresh, { passive: true });
  window.addEventListener('resize', function () {
    if (currentActive) {
      groups.forEach(function (g) {
        var activeLink = g.links.filter(function (a) { return a.dataset.section === currentActive; })[0];
        if (activeLink && isVisible(g.container)) moveIndicator(g, activeLink);
      });
    }
    refresh();
  }, { passive: true });

  /* ================= 导航：滚动后显示底边线 ================= */
  function updateNav() {
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 8);
    if (toTop) toTop.classList.toggle('show', window.scrollY > 480);
  }
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ================= 元素滚动显现（IntersectionObserver） ================= */
  var io;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('visible'); });
  }

  /* ================= 回到顶部按钮 ================= */
  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================= 初始化 ================= */
  updateNav();
  refresh();
})();