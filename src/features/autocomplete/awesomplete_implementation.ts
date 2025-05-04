/* eslint-disable */
// @ts-nocheck

export function addAwesompleteToGlobalScope() {
  // Awesomplete - Lea Verou - MIT license
  !(function() {
    function t(t) {
      const e = Array.isArray(t) ? {
        label: t[0],
        value: t[1]
      } : typeof t === "object" && t != null && "label" in t && "value" in t ? t : {
        label: t,
        value: t
      };

      this.label = e.label || e.value, this.value = e.value, this.type = e.type;
    }

    function e(t, e, i) {
      for (const n in e) {
        const s = e[n],
          r = t.input.getAttribute(`data-${n.toLowerCase()}`);

        typeof s === "number" ? t[n] = parseInt(r) : !1 === s ? t[n] = r !== null : s instanceof Function ? t[n] = null : t[n] = r, t[n] || t[n] === 0 || (t[n] = n in i ? i[n] : s);
      }
    }

    function i(t, e) {
      return typeof t === "string" ? (e || document).querySelector(t) : t || null;
    }

    function n(t, e) {
      return o.call((e || document).querySelectorAll(t));
    }

    function s() {
      n("input.awesomplete").forEach((t) => {
        new r(t);
      });
    }

    var r = function(t, n) {
      const s = this;

      this.isOpened = !1, this.input = i(t), this.input.setAttribute("autocomplete", "off"), this.input.setAttribute("aria-autocomplete", "list"), n = n || {}, e(this, {
        minChars: 2,
        maxItems: 20,
        autoFirst: !1,
        data: r.DATA,
        filter: r.FILTER_CONTAINS,
        sort: !1 !== n.sort && r.SORT_BYLENGTH,
        item: r.ITEM,
        replace: r.REPLACE
      }, n), this.index = -1, this.container = i.create("div", {
        className: "awesomplete",
        around: t
      }), this.ul = i.create("ul", {
        hidden: "hidden",
        inside: this.container
      }), this.status = i.create("span", {
        className: "visually-hidden",
        role: "status",
        "aria-live": "assertive",
        "aria-relevant": "additions",
        inside: this.container
      }), this._events = {
        input: {
          input: this.evaluate.bind(this),
          blur: this.close.bind(this, {
            reason: "blur"
          }),
          keypress(t) {
            const e = t.keyCode;

            if (s.opened) {

              switch (e) {
                case 13: // RETURN
                  if (s.selected == true) {
                    t.preventDefault();
                    s.select();
                    break;
                  }

                case 66:
                  break;

                case 27: // ESC
                  s.close({
                    reason: "esc"
                  });
                  break;
              }
            }
          },
          keydown(t) {
            const e = t.keyCode;

            if (s.opened) {
              switch (e) {
                case 9: // TAB
                  if (s.selected == true) {
                    t.preventDefault();
                    s.select();
                    break;
                  }

                case 38: // up arrow
                  t.preventDefault();
                  s.previous();
                  break;

                case 40:
                  t.preventDefault();
                  s.next();
                  break;
              }
            }
          }
        },
        form: {
          submit: this.close.bind(this, {
            reason: "submit"
          })
        },
        ul: {
          mousedown(t) {
            let e = t.target;

            if (e !== this) {
              for (; e && !(/li/i).test(e.nodeName);) e = e.parentNode;
              e && t.button === 0 && (t.preventDefault(), s.select(e, t.target));
            }
          }
        }
      }, i.bind(this.input, this._events.input), i.bind(this.input.form, this._events.form), i.bind(this.ul, this._events.ul), this.input.hasAttribute("list") ? (this.list = `#${this.input.getAttribute("list")}`, this.input.removeAttribute("list")) : this.list = this.input.getAttribute("data-list") || n.list || [], r.all.push(this);
    };
    r.prototype = {
      set list(t) {
        if (Array.isArray(t)) this._list = t;
        else if (typeof t === "string" && t.indexOf(",") > -1) this._list = t.split(/\s*,\s*/);
        else if ((t = i(t)) && t.children) {
          const e = [];

          o.apply(t.children).forEach((t) => {
            if (!t.disabled) {
              const i = t.textContent.trim(),
                n = t.value || i,
                s = t.label || i;

              n !== "" && e.push({
                label: s,
                value: n
              });
            }
          }), this._list = e;
        }
        document.activeElement === this.input && this.evaluate();
      },
      get selected() {
        return this.index > -1;
      },
      get opened() {
        return this.isOpened;
      },
      close(t) {
        this.opened && (this.ul.setAttribute("hidden", ""), this.isOpened = !1, this.index = -1, i.fire(this.input, "awesomplete-close", t || {}));
      },
      open() {
        this.ul.removeAttribute("hidden"), this.isOpened = !0, this.autoFirst && this.index === -1 && this.goto(0), i.fire(this.input, "awesomplete-open");
      },
      destroy() {
        i.unbind(this.input, this._events.input), i.unbind(this.input.form, this._events.form);
        const t = this.container.parentNode;

        t.insertBefore(this.input, this.container), t.removeChild(this.container), this.input.removeAttribute("autocomplete"), this.input.removeAttribute("aria-autocomplete");
        const e = r.all.indexOf(this);

        e !== -1 && r.all.splice(e, 1);
      },
      next() {
        const t = this.ul.children.length;

        this.goto(this.index < t - 1 ? this.index + 1 : t ? 0 : -1);
      },
      previous() {
        const t = this.ul.children.length,
          e = this.index - 1;

        this.goto(this.selected && e !== -1 ? e : t - 1);
      },
      goto(t) {
        const e = this.ul.children;

        this.selected && e[this.index].setAttribute("aria-selected", "false"), this.index = t, t > -1 && e.length > 0 && (e[t].setAttribute("aria-selected", "true"), this.status.textContent = e[t].textContent, this.ul.scrollTop = e[t].offsetTop - this.ul.clientHeight + e[t].clientHeight, i.fire(this.input, "awesomplete-highlight", {
          text: this.suggestions[this.index]
        }));
      },
      select(t, e) {
        if (t ? this.index = i.siblingIndex(t) : t = this.ul.children[this.index], t) {
          const n = this.suggestions[this.index];

          i.fire(this.input, "awesomplete-select", {
            text: n,
            origin: e || t
          }) && (this.replace(n), this.close({
            reason: "select"
          }), i.fire(this.input, "awesomplete-selectcomplete", {
            text: n
          }));
        }
      },
      evaluate() {
        const e = this,
          i = this.input.value;

        i.length >= this.minChars && this._list.length > 0 ? (this.index = -1, this.ul.innerHTML = "", this.suggestions = this._list.map((n) => {
          return new t(e.data(n, i));
        }).filter((t) => {
          return e.filter(t, i);
        }), !1 !== this.sort && (this.suggestions = this.suggestions.sort(this.sort)), this.suggestions = this.suggestions.slice(0, this.maxItems), this.suggestions.forEach((t) => {
          e.ul.appendChild(e.item(t, i));
        }), this.ul.children.length === 0 ? this.close({
          reason: "nomatches"
        }) : this.open()) : this.close({
          reason: "nomatches"
        });
      }
    }, r.all = [], r.FILTER_CONTAINS = function(t, e) {
      return RegExp(i.regExpEscape(e.trim()), "i").test(t);
    }, r.FILTER_STARTSWITH = function(t, e) {
      return RegExp(`^${i.regExpEscape(e.trim())}`, "i").test(t);
    }, r.SORT_BYLENGTH = function(t, e) {
      return t.length !== e.length ? t.length - e.length : t < e ? -1 : 1;
    }, r.ITEM = function(t, e) {
      return i.create("li", {
        innerHTML: e.trim() === "" ? t : t.replace(RegExp(i.regExpEscape(e.trim()), "gi"), "<mark>$&</mark>"),
        "aria-selected": "false"
      });
    }, r.REPLACE = function(t) {
      this.input.value = t.value;
    }, r.DATA = function(t) {
      return t;
    }, Object.defineProperty(t.prototype = Object.create(String.prototype), "length", {
      get() {
        return this.label.length;
      }
    }), t.prototype.toString = t.prototype.valueOf = function() {
      return `${this.label}`;
    };
    var o = Array.prototype.slice;
    i.create = function(t, e) {
      const n = document.createElement(t);

      for (const s in e) {
        const r = e[s];

        if (s === "inside") i(r).appendChild(n);
        else if (s === "around") {
          const o = i(r);

          o.parentNode.insertBefore(n, o), n.appendChild(o);
        } else s in n ? n[s] = r : n.setAttribute(s, r);
      }
      return n;
    }, i.bind = function(t, e) {
      if (t) for (const i in e) {
        var n = e[i];
        i.split(/\s+/).forEach((e) => {
          t.addEventListener(e, n);
        });
      }
    }, i.unbind = function(t, e) {
      if (t) for (const i in e) {
        var n = e[i];
        i.split(/\s+/).forEach((e) => {
          t.removeEventListener(e, n);
        });
      }
    }, i.fire = function(t, e, i) {
      const n = document.createEvent("HTMLEvents");

      n.initEvent(e, !0, !0);

      for (const s in i) n[s] = i[s];
      return t.dispatchEvent(n);
    }, i.regExpEscape = function(t) {
      return t.replace(/[-\\^$*+?.()|[\]{}]/g, "\\$&");
    }, i.siblingIndex = function(t) {
      for (var e = 0; t = t.previousElementSibling; e++);
      return e;
    }, typeof Document !== "undefined" && (document.readyState !== "loading" ? s() : document.addEventListener("DOMContentLoaded", s)), r.$ = i, r.$$ = n, typeof self !== "undefined" && (self.Awesomplete_ = r), typeof module === "object" && module.exports;
  }());
}
