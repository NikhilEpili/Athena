(function () {
  function closeMobileHeader() {
    var header = document.getElementById("site-header");
    var toggle = document.querySelector("[data-menu-toggle]");
    if (header) header.classList.remove("open");
    if (toggle) toggle.setAttribute("aria-expanded", "false");
  }

  function syncSiteHeaderHeight() {
    var header = document.getElementById("site-header");
    if (!header) return;
    document.documentElement.style.setProperty(
      "--site-header-h",
      header.offsetHeight + "px",
    );
  }

  function initMobileMenu() {
    var header = document.getElementById("site-header");
    var toggle = document.querySelector("[data-menu-toggle]");
    if (!header || !toggle) return;

    toggle.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      syncSiteHeaderHeight();
    });
  }

  function filterCatalogue(q) {
    var box = document.getElementById("fams");
    var none = document.getElementById("none");
    if (!box) return;
    q = (q || "").toLowerCase().trim();
    var items = box.querySelectorAll("details.fam");
    var visible = 0;
    items.forEach(function (item) {
      var text = (item.getAttribute("data-search-text") || item.textContent || "")
        .toLowerCase();
      var match = !q || text.includes(q);
      item.classList.toggle("hidden-by-search", !match);
      if (match) {
        visible += 1;
        if (q) item.open = true;
      }
    });
    if (none) none.hidden = visible > 0;
  }

  function goToProductSearch(value) {
    var qInput = document.getElementById("q");
    var headerQ = document.getElementById("header-q");
    if (qInput) qInput.value = value;
    if (headerQ) headerQ.value = value;
    filterCatalogue(value);
    var products = document.getElementById("products");
    if (products) products.scrollIntoView({ behavior: "smooth" });
    closeMobileHeader();
    if (document.activeElement) document.activeElement.blur();
  }

  function initHeaderSearch() {
    var form = document.getElementById("header-search");
    if (!form) return;
    form.addEventListener("submit", function (event) {
      var headerQ = document.getElementById("header-q");
      var val = headerQ ? headerQ.value.trim() : "";
      if (document.getElementById("fams")) {
        event.preventDefault();
        goToProductSearch(val);
        return;
      }
      event.preventDefault();
      var action = form.getAttribute("action") || "index.html";
      var base = action.split("#")[0];
      window.location.href =
        base + (val ? "?q=" + encodeURIComponent(val) : "");
    });
  }

  function initCategoryBar() {
    var catw = document.getElementById("catw");
    if (!catw) return;
    catw.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-q]");
      if (!btn) return;
      if (document.getElementById("fams")) {
        goToProductSearch(btn.getAttribute("data-q") || "");
        return;
      }
      var href = btn.getAttribute("data-href");
      if (href) window.location.href = href;
    });
  }

  function initHomeCatalogueSearch() {
    var input = document.getElementById("q");
    if (!input) return;
    input.addEventListener("input", function () {
      filterCatalogue(input.value);
    });
    var params = new URLSearchParams(window.location.search);
    var fromUrl = params.get("q");
    if (fromUrl) {
      input.value = fromUrl;
      filterCatalogue(fromUrl);
    }
    var fams = document.getElementById("fams");
    if (fams) {
      fams.addEventListener("click", function (event) {
        var link = event.target.closest("a.go");
        if (!link) return;
        var interest = link.getAttribute("data-interest");
        if (!interest) return;
        document.querySelectorAll('select[name="interest"]').forEach(function (select) {
          select.value = interest;
        });
      });
    }
  }

  function initReveal() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      document.querySelectorAll(".rv").forEach(function (el) {
        el.classList.add("in");
      });
      return;
    }
    var nodes = document.querySelectorAll(".rv");
    if (!nodes.length) return;
    var famRoot = document.getElementById("fams");
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    nodes.forEach(function (node) {
      if (famRoot && famRoot.contains(node) && node.classList.contains("fam")) {
        var fams = famRoot.querySelectorAll(".fam.rv");
        var idx = Array.prototype.indexOf.call(fams, node);
        if (idx >= 0) node.style.transitionDelay = idx * 90 + "ms";
      }
      observer.observe(node);
    });
  }

  function initHomeMotion() {
    if (!document.body.classList.contains("page-home")) return;

    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var heroCopy = document.querySelector(".anim-hero-copy");
    var heroMedia = document.querySelector(".anim-hero-media");
    var proof = document.querySelector(".proof.anim-proof");
    var proofEls = proof
      ? proof.querySelectorAll(".anim-proof-el")
      : [];

    function activateAll() {
      if (heroCopy) heroCopy.classList.add("in");
      if (heroMedia) heroMedia.classList.add("in");
      if (proof) proof.classList.add("in");
      proofEls.forEach(function (el) {
        el.classList.add("in");
      });
    }

    if (reduced) {
      activateAll();
      return;
    }

    window.setTimeout(function () {
      if (heroCopy) heroCopy.classList.add("in");
    }, 200);
    window.setTimeout(function () {
      if (heroMedia) heroMedia.classList.add("in");
    }, 550);
    window.setTimeout(function () {
      if (proof) proof.classList.add("in");
    }, 950);
    proofEls.forEach(function (el, i) {
      window.setTimeout(function () {
        el.classList.add("in");
      }, 1150 + i * 120);
    });
  }

  function initProductsPageSearch() {
    var input = document.getElementById("products-q");
    var params = new URLSearchParams(window.location.search);
    if (params.get("q") && input) input.value = params.get("q");
    if (!input) return;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var items = document.querySelectorAll("#product-search-list .product-list-item");
      var visible = 0;
      items.forEach(function (item) {
        var text = (item.getAttribute("data-search-text") || "").toLowerCase();
        var match = !q || text.includes(q);
        item.classList.toggle("hidden-by-search", !match);
        if (match) visible += 1;
      });
      var empty = document.getElementById("product-search-empty");
      if (empty) empty.hidden = visible > 0;
      var summary = document.getElementById("product-search-summary");
      if (summary && q) {
        summary.hidden = false;
        summary.textContent =
          'Showing results for "' +
          input.value.trim() +
          '" — ' +
          visible +
          " " +
          (visible === 1 ? "family" : "families") +
          " found.";
      } else if (summary) {
        summary.hidden = true;
      }
    });
    if (input.value) input.dispatchEvent(new Event("input"));
  }

  function setFieldError(form, key, message) {
    var el = form.querySelector('[data-error-for="' + key + '"]');
    var field =
      form.querySelector('[name="' + key + '"]') ||
      form.querySelector("#" + form.id + "-" + key);
    if (message) {
      if (el) {
        el.textContent = message;
        el.hidden = false;
      }
      if (field) field.setAttribute("aria-invalid", "true");
      return false;
    }
    if (el) {
      el.textContent = "";
      el.hidden = true;
    }
    if (field) field.removeAttribute("aria-invalid");
    return true;
  }

  function initEnquiryForm(form) {
    if (!form) return;
    var emailHref = form.getAttribute("data-email-href") || "mailto:marketing@athenasuperpack.com";
    var status = document.getElementById(form.id + "-status");

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var data = new FormData(form);
      var ok = true;
      var first = null;

      var isHomeEnquiry = form.classList.contains("enquiry-form--home");
      var requiredFields = isHomeEnquiry
        ? [["company", "Enter your company name."]]
        : [
            ["name", "Enter your name."],
            ["company", "Enter your company name."],
          ];
      requiredFields.forEach(function (pair) {
        var key = pair[0];
        var val = (data.get(key) || "").toString().trim();
        if (!setFieldError(form, key, val ? "" : pair[1])) {
          ok = false;
          first = first || form.querySelector('[name="' + key + '"]');
        }
      });

      var contact = (data.get("contact") || "").toString().trim();
      var contactOk =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact) ||
        contact.replace(/\D/g, "").length >= 10;
      if (
        !setFieldError(
          form,
          "contact",
          contactOk ? "" : "Enter a business email or a phone number with at least 10 digits.",
        )
      ) {
        ok = false;
        first = first || form.querySelector('[name="contact"]');
      }

      if (!ok) {
        if (status) {
          status.className = "status";
          status.textContent = "Please fix the highlighted fields.";
        }
        if (first) first.focus();
        return;
      }

      var contactName = (data.get("name") || "").toString().trim();
      var body =
        "Name: " +
        (contactName || (isHomeEnquiry ? "—" : "")) +
        "\nCompany: " +
        data.get("company") +
        "\nContact: " +
        data.get("contact") +
        "\n" +
        (isHomeEnquiry ? "Business type: " : "Product interest: ") +
        (data.get("interest") || (isHomeEnquiry ? "Not specified" : "Not sure yet")) +
        "\n" +
        (isHomeEnquiry ? "Location: " : "Approximate requirement: ") +
        (data.get("req") || "") +
        "\n\n" +
        (data.get("msg") || "");

      if (status) {
        status.className = "status ok";
        status.textContent =
          "Your email app should open with the enquiry filled in. Nothing has been sent until you press send there. If it did not open, write to marketing@athenasuperpack.com or call +91 72089 47187.";
      }

      window.location.href =
        emailHref +
        "?subject=" +
        encodeURIComponent("Packaging enquiry: " + data.get("company")) +
        "&body=" +
        encodeURIComponent(body);
    });
  }

  function initEnquiryForms() {
    document.querySelectorAll("form.enquiry-form").forEach(initEnquiryForm);
  }

  function prefillInterestFromQuery() {
    var params = new URLSearchParams(window.location.search);
    var interest = params.get("interest");
    if (!interest) return;
    document.querySelectorAll('select[name="interest"]').forEach(function (select) {
      for (var i = 0; i < select.options.length; i++) {
        if (select.options[i].value === interest) {
          select.value = interest;
          break;
        }
      }
    });
  }

  syncSiteHeaderHeight();
  window.addEventListener("resize", syncSiteHeaderHeight);
  if (typeof ResizeObserver !== "undefined") {
    var siteHeader = document.getElementById("site-header");
    if (siteHeader) {
      new ResizeObserver(syncSiteHeaderHeight).observe(siteHeader);
    }
  }

  initMobileMenu();
  initHeaderSearch();
  initCategoryBar();
  initReveal();
  initHomeMotion();
  initHomeCatalogueSearch();
  initProductsPageSearch();
  initEnquiryForms();
  prefillInterestFromQuery();
})();
