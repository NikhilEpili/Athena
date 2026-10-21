import { copyFileSync, readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const data = JSON.parse(
  readFileSync(join(__dirname, "data", "site-data.json"), "utf8"),
);

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function prefix(depth) {
  return depth === 0 ? "" : "../".repeat(depth);
}

function p(depth, path) {
  return prefix(depth) + path;
}

function assetSrc(depth, path) {
  return encodeURI(p(depth, path));
}

function categoryHref(depth, slug, segment) {
  const base = p(depth, `products/${slug}/index.html`);
  return segment ? `${base}#${segment}` : base;
}

function navHref(depth, key) {
  const home = p(depth, "index.html");
  switch (key) {
    case "home":
      return `${home}#top`;
    case "about":
      return p(depth, "about/index.html");
    case "products":
      return p(depth, "products/index.html");
    case "eco":
      return p(depth, "sustainability/index.html");
    case "contact":
      return depth === 0 ? "#enquiry" : p(depth, "contact/index.html");
    default:
      return home;
  }
}

function utilityHref(depth, link) {
  if (link.external) return link.href;
  const path = link.href.replace(/^\//, "");
  if (path === "about/index.html") return navHref(depth, "about");
  if (path === "sustainability/index.html") return navHref(depth, "eco");
  if (path === "contact/index.html") return navHref(depth, "contact");
  return p(depth, path);
}

function titleForSlug(slug) {
  return data.productCategories.find((c) => c.slug === slug)?.title ?? slug;
}

function panelButton(depth, { label, q, slug, segment }) {
  const href = p(
    depth,
    `products/${slug}/index.html${segment ? `#${segment}` : ""}`,
  );
  return `<button type="button" data-q="${esc(q ?? label)}" data-href="${esc(href)}">${esc(label)}</button>`;
}

function subLinesForSlug(slug) {
  return data.productCategories.find((c) => c.slug === slug)?.subLines ?? [];
}

function renderCategoryBar(depth) {
  return data.categoryNav
    .map((entry) => {
      if (entry.type === "link") {
        const title = titleForSlug(entry.slug);
        const href = p(depth, `products/${entry.slug}/index.html`);
        return `<button type="button" data-q="${esc(title)}" data-href="${esc(href)}">${esc(entry.label)}</button>`;
      }
      let panel = "";
      let panelClass = "panel";
      if (entry.sections) {
        if (entry.sections.length > 1) {
          panelClass = `panel panel--cols panel--cols-${entry.sections.length}`;
        }
        panel = entry.sections
          .map((section) => {
            const lines = subLinesForSlug(section.slug);
            const head = `<p class="panel-head">${esc(section.heading)}</p>`;
            const buttons = lines
              .map((line) =>
                panelButton(depth, {
                  label: line.label,
                  q: line.label,
                  slug: section.slug,
                  segment: line.id,
                }),
              )
              .join("");
            return `<div class="panel-col">${head}${buttons}</div>`;
          })
          .join("");
      } else {
        panel = (entry.children ?? [])
          .map((child) =>
            panelButton(depth, {
              label: child.label,
              q: child.label,
              slug: child.slug,
              segment: child.segment,
            }),
          )
          .join("");
      }
      return `<div class="dd"><button type="button" aria-haspopup="true">${esc(entry.label)}</button><div class="${panelClass}">${panel}</div></div>`;
    })
    .join("");
}

function markTop(depth) {
  const src = p(depth, "assets/logo.png");
  return `<a class="mark mark--img" href="${esc(p(depth, "index.html"))}#top" aria-label="${esc(data.company.legalName)} — Home"><img class="mark__logo" src="${esc(src)}" alt="" width="388" height="60" decoding="async" /></a>`;
}

function markFooterLogo(depth) {
  const src = p(depth, "assets/logo.png");
  return `<a class="mark mark--img mark--footer" href="${esc(p(depth, "index.html"))}#top" aria-label="${esc(data.company.legalName)} — Home"><img class="mark__logo" src="${esc(src)}" alt="" width="388" height="60" decoding="async" /></a>`;
}

function athenaHeader(depth) {
  const util = data.utilityNavLinks
    .map((link) => {
      const href = utilityHref(depth, link);
      const ext = link.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `<a href="${esc(href)}"${ext}>${esc(link.label)}</a>`;
    })
    .join("");
  const searchAction = p(depth, "products/index.html");
  return `<header id="site-header">
<div class="header-brand"><div class="header-shell header-brand__inner">
${markTop(depth)}
<button type="button" class="menu" data-menu-toggle aria-expanded="false">Menu</button>
<div class="header-brand__end">
<nav class="header-brand-nav" aria-label="Site">${util}</nav>
<form class="hsearch" id="header-search" role="search" action="${esc(searchAction)}" method="get">
<label class="sr" for="header-q">Search products</label>
<div class="sb"><input id="header-q" name="q" type="search" placeholder="Search products" autocomplete="off" />
<button type="submit" aria-label="Submit search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg></button></div>
</form>
</div>
</div></div>
<nav class="header-categories" id="site-cats" aria-label="Product categories"><div class="header-shell header-categories__inner" id="catw">${renderCategoryBar(depth)}</div></nav>
</header>`;
}

function athenaFooter(depth) {
  const quickLinks = [
    ["home", "Home"],
    ["about", "About us"],
    ["products", "Product categories"],
    ["eco", "Eco-friendly"],
    ["contact", "Contact us"],
  ]
    .map(
      ([key, label]) =>
        `<li><a href="${esc(navHref(depth, key))}">${esc(label)}</a></li>`,
    )
    .join("");
  const wh = data.warehouses[0];
  const address = `${wh.address} We also serve from warehouses in Palghar and Sewri, Maharashtra.`;
  const credit = data.company.footerCredit;
  const creditLabel = credit.href
    ? `<a href="${esc(credit.href)}" target="_blank" rel="noopener noreferrer">${esc(credit.label)}</a>`
    : `<span class="site-footer__credit-name">${esc(credit.label)}</span>`;
  return `<footer class="site-footer"><div class="wrap site-footer__grid">
<div class="site-footer__brand">${markFooterLogo(depth)}
<p class="site-footer__tagline">${esc(data.company.footerTagline)}</p>
<p class="site-footer__blurb">${esc(data.company.footerBlurb)}</p></div>
<div class="site-footer__links"><h3>Quick links</h3><ul>${quickLinks}</ul></div>
<div class="site-footer__contact"><h3>Contact</h3>
<p class="site-footer__phone"><a href="${esc(data.contact.phoneHref)}">${esc(data.contact.phone)}</a></p>
<p class="site-footer__address">${esc(address)}</p>
<p class="site-footer__email"><a href="${esc(data.contact.emailHref)}">${esc(data.contact.email)}</a></p>
<a class="site-footer__web" href="${esc(data.contact.productSite)}" target="_blank" rel="noopener noreferrer">zapac.in</a></div>
</div>
<div class="wrap site-footer__legal"><p class="site-footer__credit">${esc(credit.prefix)}${creditLabel}</p></div>
</footer>`;
}

function pageShell({ depth, title, description, body, bodyClass = "" }) {
  const css = p(depth, "css/styles.css");
  const js = p(depth, "js/main.js");
  const bodyAttr = bodyClass ? ` class="${esc(bodyClass)}"` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
  <title>${esc(title)} | ${esc(data.company.legalName)}</title>
  <meta name="description" content="${esc(description)}" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500..800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="${esc(css)}" />
</head>
<body${bodyAttr}>
${athenaHeader(depth)}
<main id="top">${body}</main>
${athenaFooter(depth)}
<script src="${esc(js)}" defer></script>
</body>
</html>`;
}

function writePage(relativePath, html) {
  const full = join(__dirname, relativePath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, html, "utf8");
  console.log("wrote", relativePath);
}

function enquiryFormBlockHome(formId = "home-enquiry") {
  const he = data.homeEnquiry;
  const businessOptions = he.businessTypes
    .map((t) => `<option value="${esc(t)}">${esc(t)}</option>`)
    .join("");
  const wh = data.warehouses[0];
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(wh.address)}`;
  const addressHtml = data.warehouses
    .map(
      (w) =>
        `<p class="home-enquiry__address-block"><strong>${esc(w.label)}</strong><span>${esc(w.address)}</span></p>`,
    )
    .join("");
  return `<section id="enquiry" class="home-enquiry"><div class="wrap home-enquiry__grid">
<div class="home-enquiry__info rv">
<p class="home-enquiry__ey">${esc(he.eyebrow)}</p>
<h2 class="home-enquiry__title">${esc(he.title)}</h2>
<p class="home-enquiry__lead">${esc(he.lead)}</p>
<div class="home-enquiry__card">
<p class="home-enquiry__card-ey">Call us</p>
<p class="home-enquiry__phone"><a href="${esc(data.contact.phoneHref)}">${esc(data.contact.phone)}</a></p>
</div>
<div class="home-enquiry__card">
<p class="home-enquiry__card-ey">Our address</p>
<div class="home-enquiry__addresses">${addressHtml}</div>
</div>
<div class="home-enquiry__actions">
<a class="btn red home-enquiry__wa" href="${esc(data.contact.whatsappHref)}" target="_blank" rel="noopener noreferrer">WhatsApp us</a>
<a class="btn ghost home-enquiry__directions" href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer">Get directions</a>
</div>
</div>
<div class="home-enquiry__form-card rv">
<h3 class="home-enquiry__form-title">${esc(he.formTitle)}</h3>
<p class="home-enquiry__form-lead">${esc(he.formLead)}</p>
<form id="${esc(formId)}" class="enquiry-form enquiry-form--home" data-email-href="${esc(data.contact.emailHref)}" data-whatsapp-href="${esc(data.contact.whatsappHref)}" data-phone-label="${esc(data.contact.phone)}" novalidate>
<div><label for="${formId}-company">Company / business name</label><input id="${formId}-company" name="company" autocomplete="organization" required aria-describedby="${formId}-e-co" /><p class="form-error" id="${formId}-e-co" data-error-for="company" hidden></p></div>
<div class="row"><div><label for="${formId}-contact">Contact number</label><input id="${formId}-contact" name="contact" type="tel" autocomplete="tel" required aria-describedby="${formId}-e-ct" /><p class="form-error" id="${formId}-e-ct" data-error-for="contact" hidden></p></div>
<div><label for="${formId}-req">Location</label><input id="${formId}-req" name="req" placeholder="City / state" autocomplete="address-level2" /></div></div>
<div><label for="${formId}-interest">Business type</label><select id="${formId}-interest" name="interest"><option value="">Select business type</option>${businessOptions}</select></div>
<div><label for="${formId}-msg">Message / requirements</label><textarea id="${formId}-msg" name="msg" rows="5" placeholder="Products, volumes, delivery timeline…"></textarea></div>
<button class="btn red home-enquiry__submit" type="submit">${esc(he.submitLabel)}</button>
<p class="status home-enquiry__status" id="${formId}-status" role="status" aria-live="polite">This opens your email app with the enquiry filled in; nothing is sent until you press send there.</p>
</form>
</div>
</div></section>`;
}

function enquiryFormBlock(depth, formId = "enquiry-form") {
  const options = data.productCategories
    .map((c) => `<option value="${esc(c.title)}">${esc(c.title)}</option>`)
    .join("");
  return `<form id="${esc(formId)}" class="enquiry-form" data-email-href="${esc(data.contact.emailHref)}" data-whatsapp-href="${esc(data.contact.whatsappHref)}" data-phone-label="${esc(data.contact.phone)}" novalidate>
  <div class="row"><div><label for="${formId}-name">Your name</label><input id="${formId}-name" name="name" autocomplete="name" required aria-describedby="${formId}-e-name" /><p class="form-error" id="${formId}-e-name" data-error-for="name" hidden></p></div>
  <div><label for="${formId}-company">Company</label><input id="${formId}-company" name="company" autocomplete="organization" required aria-describedby="${formId}-e-co" /><p class="form-error" id="${formId}-e-co" data-error-for="company" hidden></p></div></div>
  <div class="row"><div><label for="${formId}-contact">Business email or phone</label><input id="${formId}-contact" name="contact" autocomplete="email" required aria-describedby="${formId}-e-ct" /><p class="form-error" id="${formId}-e-ct" data-error-for="contact" hidden></p></div>
  <div><label for="${formId}-interest">Product interest</label><select id="${formId}-interest" name="interest"><option value="">Not sure yet</option>${options}</select></div></div>
  <div><label for="${formId}-req">Approximate requirement</label><input id="${formId}-req" name="req" placeholder="e.g. 5,000 units a month, Pune" /></div>
  <div><label for="${formId}-msg">Message</label><textarea id="${formId}-msg" name="msg" rows="4"></textarea></div>
  <div><button class="btn red" type="submit">Prepare my enquiry email</button></div>
  <p class="status" id="${formId}-status" role="status" aria-live="polite">This form opens your email app with the enquiry filled in; nothing is sent until you press send there. You can also call ${esc(data.contact.phone)}.</p>
</form>`;
}

function renderCatalogueFamilies(depth) {
  return data.productCategories
    .map((cat, i) => {
      const n = String(i + 1).padStart(2, "0");
      const pg = cat.cataloguePages
        ? `Catalogue pp. ${cat.cataloguePages}`
        : "Catalogue — see PDF";
      const sub =
        cat.subLines && cat.subLines.length
          ? `<ul>${cat.subLines
              .map(
                (line) =>
                  `<li><a href="${esc(categoryHref(depth, cat.slug, line.id))}">${esc(line.label)}</a></li>`,
              )
              .join("")}</ul>`
          : "";
      const searchBlob = esc(
        `${cat.title} ${cat.description} ${(cat.subLines ?? []).map((l) => l.label).join(" ")}`,
      );
      return `<details class="fam rv" data-search-text="${searchBlob}"><summary><span class="n">${n}</span><span class="t">${esc(cat.title)}</span><span class="pg">${esc(pg)}</span><span class="pl" aria-hidden="true">+</span></summary><div class="body"><p>${esc(cat.description)}</p>${sub}<a class="go" href="#enquiry" data-interest="${esc(cat.title)}">Enquire about this range</a></div></details>`;
    })
    .join("");
}

function proofLabel(item) {
  if (Array.isArray(item.label)) {
    return item.label.map((line) => esc(line)).join("<br />");
  }
  return esc(item.label);
}

function renderCatalogueTiles(depth = 0) {
  return data.catalogueTiles
    .map(
      (tile) =>
        `<a class="catalogue-tile" href="${esc(p(depth, `products/${tile.slug}/index.html`))}"><img src="${esc(assetSrc(depth, tile.image))}" alt="${esc(tile.label)}" width="400" height="560" loading="lazy" decoding="async" /></a>`,
    )
    .join("");
}

function proofStrip(depth = 0) {
  return `<div class="proof proof--icons anim-proof"><div class="wrap"><p class="proof-heading anim-proof-el">Why<br />Choose<br />Us ?</p>${data.heroProofPoints
    .map(
      (item) =>
        `<div class="f f--icon anim-proof-el"><img class="proof-icon" src="${esc(assetSrc(depth, item.icon))}" alt="" width="36" height="36" decoding="async" /><span>${proofLabel(item)}</span></div>`,
    )
    .join("")}</div></div>`;
}

const HOME_ABOUT_MISSION_ICON = `<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="17" cy="17" r="14"></circle><circle cx="17" cy="17" r="8"></circle><circle cx="17" cy="17" r="2" fill="currentColor"></circle><path d="M17 17L30 4"></path></svg>`;

const HOME_ABOUT_VISION_ICON = `<svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 18C7 9 12 6 18 6s11 3 16 12c-5 9-10 12-16 12S7 27 2 18z"></path><circle cx="18" cy="18" r="5"></circle></svg>`;

const HOME_ABOUT_SPEC_ICON = `<svg class="home-about__spec-deco" width="64" height="64" viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="20" cy="20" r="13" stroke-width="6" stroke-dasharray="4.2 4.2"></circle><circle cx="20" cy="20" r="9"></circle><circle cx="20" cy="20" r="3.5"></circle></svg>`;

function renderHomeAboutSection(depth) {
  const ha = data.homeAbout;
  const mapSrc = assetSrc(depth, "assets/map.png");
  const specs = ha.specializations
    .map(
      (text, i) =>
        `<div class="home-about__spec-item rv"><span class="home-about__spec-num">${String(i + 1).padStart(2, "0")}</span>${esc(text)}</div>`,
    )
    .join("");
  const companyBold = "Athena Superpack Pvt Ltd";
  const paras = ha.paragraphs
    .map((text, i) => {
      let inner = esc(text);
      if (i === 0 && text.startsWith(companyBold)) {
        inner = `<strong>${esc(companyBold)}</strong>${esc(text.slice(companyBold.length))}`;
      }
      return `<p class="home-about__lead${i === 0 ? " home-about__lead--first" : ""}">${inner}</p>`;
    })
    .join("");
  const enquire = depth === 0 ? "#enquiry" : p(depth, "contact/index.html");
  const products = p(depth, "products/index.html");
  const catalogue = depth === 0 ? "#catalogue" : products;

  return `<section id="about" class="home-about">
<div class="home-about__intro"><div class="wrap home-about__intro-grid">
<div class="home-about__copy rv">
<p class="home-about__ey">About us</p>
<h2 class="home-about__title"><span class="n">Packaging partners for</span> <span class="r">food businesses.</span></h2>
${paras}
<div class="cta home-about__cta"><a class="btn red" href="${esc(enquire)}">Enquire now</a><a class="btn ghost" href="${esc(catalogue)}">Explore products</a></div>
</div>
<figure class="home-about__map rv"><div class="home-about__map-media"><img src="${esc(mapSrc)}" alt="Map of India showing pan-India delivery and service presence" width="800" height="900" loading="lazy" decoding="async" /></div><span class="home-about__map-label">Presence Across India</span></figure>
</div></div>
<div class="home-about__mv"><div class="wrap home-about__mv-grid">
<article class="home-about__card home-about__card--mission rv">
<div class="home-about__card-icon home-about__card-icon--mission">${HOME_ABOUT_MISSION_ICON}</div>
<h3>Our Mission</h3>
<p>${esc(data.mission)}</p>
</article>
<article class="home-about__card home-about__card--vision rv">
<div class="home-about__card-icon home-about__card-icon--vision">${HOME_ABOUT_VISION_ICON}</div>
<h3>Our Vision</h3>
<p>${esc(data.vision)}</p>
</article>
</div></div>
<div class="home-about__spec-band"><div class="wrap">
<div class="home-about__spec-head rv">
<div><p class="home-about__ey home-about__ey--on-dark">Our specialization</p><h2 class="home-about__spec-title">What we do best.</h2></div>
${HOME_ABOUT_SPEC_ICON}
</div>
<div class="home-about__spec-grid">${specs}</div>
</div></div>
</section>`;
}

function homePage() {
  const depth = 0;
  const heroImg = p(
    depth,
    "images/hero/eco-friendly-takeout-packaging-new.png",
  );
  const body = `<div class="herow"><div class="wrap hero">
<div class="hero-copy anim-hero anim-hero-copy">
<h1><span class="n">Packaging for<br />food businesses</span><br /><span class="r">that scale.</span></h1>
<p class="lead">Plastic and eco-friendly containers, meal trays,<br />and disposables,<br />for resellers and kitchens across India.</p>
<div class="cta"><a class="btn red" href="#enquiry">Enquire now</a><a class="btn ghost" href="#catalogue">Explore products</a></div>
</div>
<figure class="hero-media anim-hero anim-hero-media"><img src="${esc(heroImg)}" alt="Zapac eco-friendly and takeaway packaging assortment" width="1204" height="850" /></figure>
</div>
${proofStrip(depth)}</div>
<section id="catalogue" class="catalogue-section"><div class="wrap catalogue-head-wrap rv">
<h2 class="catalogue-title"><span class="r">Our Catalogue</span></h2>
</div><div class="wrap catalogue-body-wrap">
<div class="catalogue-grid rv">${renderCatalogueTiles(depth)}</div>
</div><div class="proof proof--catalogue-cta rv"><div class="wrap">
<p class="catalogue-cta-strip__line">Can&rsquo;t spot what you need? Ask us for bulk or custom-printed packaging.</p>
<a class="btn catalogue-cta-strip__btn" href="#enquiry">Request a quote</a>
</div></div></section>
${renderHomeAboutSection(depth)}
${enquiryFormBlockHome("home-enquiry")}`;

  writePage(
    "index.html",
    pageShell({
      depth: 0,
      title: "Food packaging for resellers, HORECA and cloud kitchens",
      description:
        "Athena Superpack supplies Zapac food packaging across Maharashtra and pan-India.",
      body,
      bodyClass: "page-home",
    }),
  );
}

function aboutPage() {
  const depth = 1;
  const wh = data.warehouses
    .map(
      (w) =>
        `<li><p style="font-weight:600">${esc(w.label)}</p><p class="muted" style="margin-top:0.35rem;font-size:0.9rem;line-height:1.55">${esc(w.address)}</p></li>`,
    )
    .join("");
  const chips = data.specialisations
    .map((s) => `<li>${esc(s)}</li>`)
    .join("");
  const body = `<div class="page-pad-bottom">
<section class="page-hero page-hero--panel"><div class="wrap"><h1>${esc(data.company.legalName)}</h1><p class="muted" style="margin-top:1rem;max-width:52ch">${esc(data.presenceHeadline)}</p></div></section>
<section><div class="wrap split">
<div class="rv presence-map"><img src="${esc(p(depth, "images/company/map.png"))}" alt="Map of India showing supply presence" width="800" height="600" /></div>
<div class="rv"><div class="prose"><p>${esc(data.aboutIntro)}</p></div><ul class="plain chips">${chips}</ul></div>
</div></section>
<section class="mv"><div class="wrap split">
<div class="rv"><h2>Mission</h2><p>${esc(data.mission)}</p></div>
<div class="rv"><h2>Vision</h2><p>${esc(data.vision)}</p></div>
</div></section>
<section><div class="wrap"><h2 class="rv">Maharashtra warehouses</h2><ul class="warehouse-list rv" style="margin-top:1.5rem">${wh}</ul><div class="cta rv"><a class="btn red" href="${esc(p(depth, "contact/index.html"))}">Contact our team</a></div></div></section>
</div>`;
  writePage(
    "about/index.html",
    pageShell({
      depth,
      title: "About Us",
      description: "About Athena Superpack and Zapac packaging.",
      body,
    }),
  );
}

function contactPage() {
  const depth = 1;
  const wh = data.warehouses
    .map(
      (w) =>
        `<li><p style="font-weight:600">${esc(w.label)}</p><p class="muted" style="margin-top:0.35rem;font-size:0.9rem;line-height:1.55">${esc(w.address)}</p></li>`,
    )
    .join("");
  const body = `<div class="page-pad-bottom">
<section class="page-hero"><div class="wrap"><h1>Talk to our team</h1><p class="muted" style="margin-top:1rem;max-width:46ch">Share your company details, product interest, and approximate volumes.</p></div></section>
<section><div class="wrap split">
<div class="rv"><h2>Warehouse locations</h2><ul class="warehouse-list" style="margin-top:1.25rem">${wh}</ul>
<div class="contact-list"><a href="${esc(data.contact.phoneHref)}"><small>Customer care</small>${esc(data.contact.phone)}</a><a href="${esc(data.contact.emailHref)}"><small>Email</small>${esc(data.contact.email)}</a></div></div>
${enquiryFormBlock(depth)}
</div></section>
</div>`;
  writePage(
    "contact/index.html",
    pageShell({
      depth,
      title: "Contact",
      description: "Contact Athena Superpack for packaging enquiries.",
      body,
    }),
  );
}

function sustainabilityPage() {
  const depth = 1;
  const cats = data.productCategories.filter((c) =>
    data.ecoCategorySlugs.includes(c.slug),
  );
  const cards = cats
    .map(
      (cat) =>
        `<article class="eco-card rv"><div class="eco-card__media"><img src="${esc(p(depth, cat.image))}" alt="${esc(cat.imageAlt)}" loading="lazy" /></div><div class="eco-card__body"><h2>${esc(cat.title)}</h2><p class="muted" style="margin-top:0.65rem;line-height:1.55">${esc(cat.description)}</p><a class="text-red" style="display:inline-block;margin-top:0.75rem" href="${esc(p(depth, `products/${cat.slug}/index.html`))}">View category →</a></div></article>`,
    )
    .join("");
  const body = `<div class="page-pad-bottom">
<section class="page-hero page-hero--band"><div class="wrap" style="max-width:48rem"><h1>Material-led ranges, not greenwashed marketing.</h1><p style="margin-top:1.25rem;line-height:1.6">The ${esc(data.company.productBrand)} catalogue includes bagasse, kraft, and other lower-impact formats alongside conventional plastic lines.</p></div></section>
<section><div class="wrap eco-card-grid">${cards}</div></section>
<section><div class="wrap"><p class="note rv">Confirm material claims per product code with ${esc(data.company.legalName)} before publishing to your own customers.</p></div></section>
</div>`;
  writePage(
    "sustainability/index.html",
    pageShell({
      depth,
      title: "Eco-Friendly Solutions",
      description: "Eco-friendly formats in the Zapac catalogue.",
      body,
    }),
  );
}

function productsIndexPage() {
  const depth = 1;
  const items = data.productCategories
    .map(
      (cat) =>
        `<li class="product-list-item" data-search-text="${esc(cat.title + " " + cat.shortTitle + " " + cat.description)}"><a href="${esc(p(depth, `products/${cat.slug}/index.html`))}"><div class="product-list-item__thumb"><img src="${esc(p(depth, cat.image))}" alt="${esc(cat.imageAlt)}" loading="lazy" /></div><div><p class="muted" style="font-size:0.75rem">Pages ${esc(cat.cataloguePages)}</p><h2 style="margin-top:0.25rem;font-size:1.2rem">${esc(cat.title)}</h2><p class="muted" style="margin-top:0.45rem;font-size:0.9rem;line-height:1.55">${esc(cat.description)}</p></div><span class="text-red">View</span></a></li>`,
    )
    .join("");
  const body = `<div class="page-pad-bottom">
<section class="page-hero"><div class="wrap">
<h1>Product families</h1>
<p class="muted" style="margin-top:1rem;max-width:46ch">Categories follow the published ${esc(data.company.productBrand)} catalogue.</p>
<div class="search" style="margin-top:1.5rem;max-width:360px"><input id="products-q" type="search" placeholder="Search categories…" autocomplete="off" aria-label="Search product categories" /></div>
<p id="product-search-summary" class="muted" style="margin-top:1rem" hidden></p>
<a class="link-arrow" style="display:inline-block;margin-top:1.25rem" href="${esc(data.company.cataloguePdf)}" target="_blank" rel="noopener noreferrer">Download catalogue PDF</a>
</div></section>
<section><div class="wrap">
<p id="product-search-empty" class="empty" hidden>No categories match your search. <a href="${esc(p(depth, "products/index.html"))}">View all products</a>.</p>
<ul id="product-search-list" class="product-list">${items}</ul>
</div></section>
</div>`;
  writePage(
    "products/index.html",
    pageShell({
      depth,
      title: "Products",
      description: "Browse Zapac product families from Athena Superpack.",
      body,
    }),
  );
}

function categoryPage(cat) {
  const depth = 2;
  const samples = data.sampleProducts.filter((s) => s.categorySlug === cat.slug);
  const subLines =
    cat.subLines && cat.subLines.length
      ? `<section><div class="wrap"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line)"><h2 style="font-size:1.15rem">Product lines</h2><a class="link-arrow" href="${esc(data.company.cataloguePdf)}" target="_blank" rel="noopener noreferrer">Full PDF</a></div><ul class="product-line-list">${cat.subLines
          .map(
            (line) =>
              `<li class="product-line-item" id="${esc(line.id)}"><h3>${esc(line.label)}</h3><p class="muted" style="margin-top:0.45rem;max-width:42rem;font-size:0.9rem">SKUs for this line are listed in catalogue pages ${esc(cat.cataloguePages)}.</p></li>`,
          )
          .join("")}</ul></div></section>`
      : "";
  const table =
    samples.length > 0
      ? `<div class="data-table-wrap"><table class="data-table"><thead><tr><th>Code</th><th>Product</th><th>Size</th><th>Box pkg</th></tr></thead><tbody>${samples
          .map(
            (row) =>
              `<tr><td class="mono">${esc(row.code)}</td><td>${esc(row.name)}</td><td>${esc(row.size)}</td><td>${esc(row.packQty)}</td></tr>`,
          )
          .join("")}</tbody></table></div>`
      : `<p class="muted" style="margin-top:1.25rem">Representative SKU rows for this family are not loaded yet. Refer to catalogue pages ${esc(cat.cataloguePages)} in the PDF.</p>`;

  const body = `<div class="page-pad-bottom">
<section class="page-hero page-hero--panel"><div class="wrap split" style="align-items:center">
<div><a class="muted" style="font-size:0.9rem;text-decoration:none" href="${esc(p(depth, "products/index.html"))}">← All products</a><p class="muted" style="margin-top:1rem;font-size:0.85rem">Catalogue pp. ${esc(cat.cataloguePages)}</p><h1 style="margin-top:0.5rem">${esc(cat.title)}</h1><p class="muted" style="margin-top:1rem;max-width:36rem;line-height:1.6">${esc(cat.description)}</p></div>
<div class="stage hero-photo" style="margin:0"><img src="${esc(p(depth, cat.image))}" alt="${esc(cat.imageAlt)}" /></div>
</div></section>
${subLines}
<section><div class="wrap"><div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:1rem;padding-bottom:1rem;border-bottom:1px solid var(--line)"><h2 style="font-size:1.15rem">Sample SKUs from the catalogue</h2><a class="link-arrow" href="${esc(data.company.cataloguePdf)}" target="_blank" rel="noopener noreferrer">Full PDF</a></div>${table}</div></section>
<section id="enquiry"><div class="wrap"><h2>Enquire about this range</h2><div style="margin-top:1.25rem;max-width:640px">${enquiryFormBlock(depth, "category-enquiry")}</div></div></section>
</div>`;

  writePage(
    `products/${cat.slug}/index.html`,
    pageShell({
      depth,
      title: cat.title,
      description: cat.description,
      body,
    }),
  );
}

const heroAsset = join(
  __dirname,
  "assets",
  "Eco-Friendly Takeout Packaging new.png",
);
const heroPublished = join(
  __dirname,
  "images",
  "hero",
  "eco-friendly-takeout-packaging-new.png",
);
copyFileSync(heroAsset, heroPublished);
mkdirSync(join(__dirname, "public", "images", "hero"), { recursive: true });
copyFileSync(
  heroAsset,
  join(
    __dirname,
    "public",
    "images",
    "hero",
    "eco-friendly-takeout-packaging-new.png",
  ),
);

homePage();
aboutPage();
contactPage();
sustainabilityPage();
productsIndexPage();
for (const cat of data.productCategories) categoryPage(cat);

console.log("Static site generated.");
