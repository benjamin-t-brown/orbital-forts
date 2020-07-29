var e = {},
  l = [],
  t = e => (null == e ? e : e.key),
  r = function(e) {
    this.tag[e.type](e);
  },
  o = (e, l, t, o, n) => {
    'key' === l ||
      ('o' === l[0] && 'n' === l[1]
        ? ((e.tag || (e.tag = {}))[(l = l.slice(2))] = o)
          ? t || e.addEventListener(l, r)
          : e.removeEventListener(l, r)
        : !n && 'list' !== l && 'form' !== l && l in e
        ? (e[l] = null == o ? '' : o)
        : null == o || !1 === o
        ? e.removeAttribute(l)
        : e.setAttribute(l, o));
  },
  n = (e, l) => {
    var t = e.props,
      r =
        3 === e.tag
          ? document.createTextNode(e.type)
          : (l = l || 'svg' === e.type)
          ? document.createElementNS('http://www.w3.org/2000/svg', e.type, {
              is: t.is,
            })
          : document.createElement(e.type, { is: t.is });
    for (var d in t) o(r, d, null, t[d], l);
    return e.children.map(e => r.appendChild(n((e = i(e)), l))), (e.dom = r);
  },
  d = (e, l, r, a, u) => {
    if (r === a);
    else if (null != r && 3 === r.tag && 3 === a.tag)
      r.type !== a.type && (l.nodeValue = a.type);
    else if (null == r || r.type !== a.type)
      (l = e.insertBefore(n((a = i(a)), u), l)),
        null != r && e.removeChild(r.dom);
    else {
      var m,
        p,
        s,
        v,
        f = r.props,
        y = a.props,
        c = r.children,
        h = a.children,
        g = 0,
        x = 0,
        C = c.length - 1,
        k = h.length - 1;
      for (var w in ((u = u || 'svg' === a.type), { ...f, ...y }))
        ('value' === w || 'selected' === w || 'checked' === w ? l[w] : f[w]) !==
          y[w] && o(l, w, f[w], y[w], u);
      for (; x <= k && g <= C && null != (s = t(c[g])) && s === t(h[x]); )
        d(l, c[g].dom, c[g++], (h[x] = i(h[x++])), u);
      for (; x <= k && g <= C && null != (s = t(c[C])) && s === t(h[k]); )
        d(l, c[C].dom, c[C--], (h[k] = i(h[k--])), u);
      if (g > C)
        for (; x <= k; )
          l.insertBefore(n((h[x] = i(h[x++])), u), (p = c[g]) && p.dom);
      else if (x > k) for (; g <= C; ) l.removeChild(c[g++].dom);
      else {
        var N = {},
          A = {};
        for (w = g; w <= C; w++) null != (s = c[w].key) && (N[s] = c[w]);
        for (; x <= k; )
          (s = t((p = c[g]))),
            (v = t((h[x] = i(h[x])))),
            A[s] || (null != v && v === t(c[g + 1]))
              ? (null == s && l.removeChild(p.dom), g++)
              : null == v || 1 === r.tag
              ? (null == s && (d(l, p && p.dom, p, h[x], u), x++), g++)
              : (s === v
                  ? (d(l, p.dom, p, h[x], u), (A[v] = !0), g++)
                  : null != (m = N[v])
                  ? (d(l, l.insertBefore(m.dom, p && p.dom), m, h[x], u),
                    (A[v] = !0))
                  : d(l, p && p.dom, null, h[x], u),
                x++);
        for (; g <= C; ) null == t((p = c[g++])) && l.removeChild(p.dom);
        for (var w in N) null == A[w] && l.removeChild(N[w].dom);
      }
    }
    return (a.dom = l);
  },
  i = e => (!0 !== e && !1 !== e && e ? e : text('')),
  a = t =>
    3 === t.nodeType
      ? text(t.nodeValue, t)
      : u(t.nodeName.toLowerCase(), e, l.map.call(t.childNodes, a), t, null, 1),
  u = (e, l, t, r, o, n) => ({
    type: e,
    props: l,
    children: t,
    dom: r,
    key: o,
    tag: n,
  });
var text = (t, r) => u(t, e, l, r, null, 3);
const G_superfine_text = text;
var h = (e, t, r) =>
  u(e, t, Array.isArray(r) ? r : null == r ? l : [r], null, t.key);
const G_superfine_h = h;
var patch = (e, l) => (((e = d(e.parentNode, e, e.v || a(e), l)).v = l), e);
const G_superfine_patch = patch;
