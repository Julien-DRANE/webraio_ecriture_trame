(function () {
  const ns = (window.StudioSlides = window.StudioSlides || {});
  ns.utils = ns.utils || {};

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clampText(value, limit) {
    return typeof value === "string" ? value.slice(0, limit) : "";
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "presentation";
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function createId(prefix) {
    return `${prefix || "item"}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function uniqueStrings(items) {
    return Array.from(new Set((items || []).filter(Boolean)));
  }

  function plainTextToRichHtml(value, limit) {
    const text = clampText(String(value || ""), limit || 1600);
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
  }

  function normalizeRichTextColor(value) {
    const raw = String(value || "").trim();
    if (!raw) {
      return "";
    }

    if (/^#[0-9a-fA-F]{6}$/.test(raw)) {
      return raw.toLowerCase();
    }

    const probe = document.createElement("span");
    probe.style.color = "";
    probe.style.color = raw;
    const normalized = String(probe.style.color || "").trim();
    const rgbMatch = normalized.match(/^rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})/i);
    if (!rgbMatch) {
      return "";
    }

    return `#${[rgbMatch[1], rgbMatch[2], rgbMatch[3]]
      .map((part) => Math.max(0, Math.min(255, Number(part) || 0)).toString(16).padStart(2, "0"))
      .join("")}`;
  }

  function sanitizeRichText(value, limit) {
    const raw = String(value || "");
    if (!raw.trim()) {
      return "";
    }
    if (!/[<>]/.test(raw)) {
      return plainTextToRichHtml(raw, limit);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${raw}</div>`, "text/html");
    let remaining = typeof limit === "number" ? limit : 1600;

    function sanitizeChildren(parent) {
      let html = "";
      Array.from(parent.childNodes).forEach((node) => {
        if (remaining <= 0) {
          return;
        }
        html += sanitizeNode(node);
      });
      return html;
    }

    function sanitizeNode(node) {
      if (remaining <= 0) {
        return "";
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const safeText = escapeHtml(text.slice(0, remaining));
        remaining -= text.slice(0, remaining).length;
        return safeText;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) {
        return "";
      }

      const tag = node.tagName.toLowerCase();
      const inner = sanitizeChildren(node);
      if (!inner && tag !== "br") {
        return "";
      }

      if (tag === "br") {
        return "<br>";
      }

      if (tag === "strong" || tag === "b") {
        return `<strong>${inner}</strong>`;
      }

      if (tag === "em" || tag === "i") {
        return `<em>${inner}</em>`;
      }

      if (tag === "u") {
        return `<u>${inner}</u>`;
      }

      if (tag === "span" || tag === "font") {
        const rawFontSize = tag === "font"
          ? String(node.getAttribute("size") || "")
          : String(node.style.fontSize || "").trim();
        const fontSize = /^(90|100|110|120|130|140)%$/i.test(rawFontSize)
          ? rawFontSize.toLowerCase()
          : /^(8|10|12|14|1[6-9]|[2-6][0-9]|7[0-2])px$/i.test(rawFontSize)
            ? rawFontSize.toLowerCase()
            : "";
        const color = normalizeRichTextColor(tag === "font" ? node.getAttribute("color") : node.style.color);
        const supportedStyles = [
          fontSize ? `font-size:${fontSize}` : "",
          color ? `color:${color}` : "",
        ].filter(Boolean);
        let content = supportedStyles.length ? `<span style="${supportedStyles.join(";")};">${inner}</span>` : inner;
        const isBold = /^(bold|[6-9]00)$/i.test(String(node.style.fontWeight || "").trim());
        const isItalic = /^italic$/i.test(String(node.style.fontStyle || "").trim());
        const hasUnderline = /underline/i.test(String(node.style.textDecorationLine || node.style.textDecoration || "").trim());
        if (isBold) {
          content = `<strong>${content}</strong>`;
        }
        if (isItalic) {
          content = `<em>${content}</em>`;
        }
        if (hasUnderline) {
          content = `<u>${content}</u>`;
        }
        return content;
      }

      if (tag === "ul") {
        return `<ul>${inner}</ul>`;
      }

      if (tag === "li") {
        return `<li>${inner}</li>`;
      }

      if (tag === "p" || tag === "div") {
        if (tag === "div" && node.getAttribute("data-rich-layout") === "two-columns") {
          return `<div data-rich-layout="two-columns">${inner}</div>`;
        }
        return `<p>${inner}</p>`;
      }

      return inner;
    }

    return sanitizeChildren(doc.body.firstElementChild || doc.body);
  }

  function richTextLength(value) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${String(value || "")}</div>`, "text/html");
    return (doc.body.textContent || "").trim().length;
  }

  function extractLinks(value) {
    const source = String(value || "");
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    let lastIndex = 0;
    const links = [];
    let text = "";
    let match;

    while ((match = urlRegex.exec(source)) !== null) {
      text += source.slice(lastIndex, match.index);
      links.push(match[0]);
      lastIndex = match.index + match[0].length;
    }

    text += source.slice(lastIndex);

    return {
      text: text
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n[ \t]+/g, "\n")
        .replace(/[ \t]{2,}/g, " ")
        .trim(),
      links: uniqueStrings(links),
    };
  }

  function formatUrlLabel(url) {
    const source = String(url || "").trim();
    if (!source) {
      return "";
    }

    try {
      const parsed = new URL(source);
      const hostname = (parsed.hostname || "")
        .replace(/^www\./i, "")
        .trim();
      const hasExtraPath = Boolean(
        (parsed.pathname && parsed.pathname !== "/" && parsed.pathname !== "") ||
        parsed.search ||
        parsed.hash
      );
      const compact = `${hostname}${hasExtraPath ? "/..." : ""}`;
      return compact.length > 22 ? `${compact.slice(0, 19)}...` : compact;
    } catch (error) {
      const shortened = source
        .replace(/^https?:\/\//i, "")
        .replace(/^www\./i, "")
        .replace(/\/$/, "");
      return shortened.length > 22 ? `${shortened.slice(0, 19)}...` : shortened;
    }
  }

  function linkifyText(value) {
    const source = String(value || "");
    const urlRegex = /(https?:\/\/[^\s<]+)/g;
    let lastIndex = 0;
    let html = "";
    let match;

    while ((match = urlRegex.exec(source)) !== null) {
      const before = source.slice(lastIndex, match.index);
      const url = match[0];
      html += escapeHtml(before);
      html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
      lastIndex = match.index + url.length;
    }

    html += escapeHtml(source.slice(lastIndex));
    return html;
  }

  ns.utils.clone = clone;
  ns.utils.clampText = clampText;
  ns.utils.slugify = slugify;
  ns.utils.escapeHtml = escapeHtml;
  ns.utils.createId = createId;
  ns.utils.uniqueStrings = uniqueStrings;
  ns.utils.plainTextToRichHtml = plainTextToRichHtml;
  ns.utils.sanitizeRichText = sanitizeRichText;
  ns.utils.richTextLength = richTextLength;
  ns.utils.extractLinks = extractLinks;
  ns.utils.formatUrlLabel = formatUrlLabel;
  ns.utils.linkifyText = linkifyText;
})();
