/* ==========================================================================
   Theme behaviour.

   Progressive enhancement only. Every interaction below has a working
   no-JavaScript fallback: the gallery is a scrollable list of real images, the
   tier selector is a radio group inside the product form, the accordions are
   native <details>, and add-to-cart is a real form POST that Shopify handles
   without us. Nothing here is required to buy the product.

   No framework, no dependencies. Custom elements are used so behaviour attaches
   by markup rather than by querying the document, which keeps sections
   self-contained and survives Shopify's theme-editor section re-rendering.
   ========================================================================== */

(() => {
  'use strict';

  const announce = (message) => {
    const region = document.getElementById('a11y-status');
    if (region) region.textContent = message;
  };

  const money = (cents, format) => {
    // Shopify money formats vary by shop; fall back to a plain figure rather
    // than risk rendering a wrong currency symbol.
    const value = (cents / 100).toFixed(2);
    return format ? format.replace(/\{\{\s*amount\s*\}\}/, value) : value;
  };

  /* --- Product gallery ---------------------------------------------------- */

  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.main = this.querySelector('[data-gallery-main]');
      this.thumbs = Array.from(this.querySelectorAll('[data-gallery-thumb]'));
      if (!this.main || !this.thumbs.length) return;

      this.thumbs.forEach((thumb) => {
        thumb.addEventListener('click', () => this.select(thumb));
      });
    }

    select(thumb) {
      const full = thumb.dataset.full;
      const alt = thumb.dataset.alt || '';
      if (!full) return;

      this.main.src = full;
      this.main.alt = alt;
      this.thumbs.forEach((t) => t.setAttribute('aria-current', String(t === thumb)));
      announce(alt);
    }

    /** Called by the variant selector so the gallery follows the chosen variant. */
    showMedia(mediaId) {
      const thumb = this.thumbs.find((t) => t.dataset.mediaId === String(mediaId));
      if (thumb) this.select(thumb);
    }
  }

  /* --- Variant + tier selection ------------------------------------------- */

  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      this.variantInput = this.querySelector('[data-variant-id]');
      this.priceEl = this.querySelector('[data-price]');
      this.unitPriceEl = this.querySelector('[data-unit-price]');
      this.submit = this.querySelector('[data-submit]');
      this.stickyPrice = document.querySelector('[data-sticky-price]');

      this.variants = this.readVariants();
      if (!this.form) return;

      this.form.addEventListener('change', () => this.onChange());
      this.form.addEventListener('submit', (event) => this.onSubmit(event));
      this.onChange();
    }

    readVariants() {
      const script = this.querySelector('[data-variant-data]');
      if (!script) return [];
      try {
        return JSON.parse(script.textContent);
      } catch {
        // Malformed data must not take the page down — the form still posts.
        return [];
      }
    }

    selectedVariant() {
      const checked = this.querySelector('input[name="tier"]:checked');
      const id = checked ? checked.value : this.variantInput && this.variantInput.value;
      return this.variants.find((v) => String(v.id) === String(id));
    }

    onChange() {
      const variant = this.selectedVariant();
      if (!variant) return;

      if (this.variantInput) this.variantInput.value = variant.id;

      if (this.priceEl) this.priceEl.textContent = money(variant.price, this.dataset.moneyFormat);

      // Per-unit price prevents sticker shock on multipacks.
      if (this.unitPriceEl) {
        const units = Number(this.querySelector('input[name="tier"]:checked')?.dataset.units || 1);
        this.unitPriceEl.textContent =
          units > 1
            ? `${money(variant.price / units, this.dataset.moneyFormat)} ${this.dataset.perUnitLabel || 'each'}`
            : '';
      }

      if (this.stickyPrice) this.stickyPrice.textContent = money(variant.price, this.dataset.moneyFormat);

      if (this.submit) {
        // The GPSR gate is server-rendered and must win. Without this check the
        // variant logic would cheerfully re-enable a button that Liquid
        // deliberately disabled for a product that cannot lawfully be sold.
        const gated = this.dataset.gpsrReady === 'false';
        this.submit.disabled = gated || !variant.available;
        if (!gated) {
          this.submit.textContent = variant.available
            ? this.dataset.addLabel || 'Add to cart'
            : this.dataset.soldOutLabel || 'Sold out';
        }
      }

      const gallery = document.querySelector('product-gallery');
      if (gallery && variant.featured_media_id) gallery.showMedia(variant.featured_media_id);
    }

    async onSubmit(event) {
      // The gate again, and this time it is load-bearing: form.requestSubmit()
      // from the sticky bar submits regardless of whether the button is
      // disabled, so a disabled button alone would not actually stop a sale.
      if (this.dataset.gpsrReady === 'false') {
        event.preventDefault();
        return;
      }

      // Without fetch support this stays a normal form POST and still works.
      if (!window.fetch) return;
      event.preventDefault();

      const variant = this.selectedVariant();
      this.submit.disabled = true;

      try {
        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            items: [{ id: variant.id, quantity: 1 }],
          }),
        });

        if (!response.ok) throw new Error(String(response.status));

        announce(this.dataset.addedLabel || 'Added to cart');
        document.dispatchEvent(new CustomEvent('cart:updated'));
      } catch {
        // Fall back to the real form navigation rather than stranding the user
        // on a page where the button silently did nothing.
        this.form.submit();
      } finally {
        this.submit.disabled = this.dataset.gpsrReady === 'false';
      }
    }
  }

  /* --- Sticky add-to-cart -------------------------------------------------- */

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      const anchor = document.querySelector(this.dataset.watch || '[data-submit]');
      if (!anchor || !('IntersectionObserver' in window)) return;

      // Show only once the real button has scrolled out of view.
      this.observer = new IntersectionObserver(
        ([entry]) => {
          this.dataset.visible = String(!entry.isIntersecting && entry.boundingClientRect.top < 0);
        },
        { threshold: 0 },
      );
      this.observer.observe(anchor);

      this.querySelector('[data-sticky-submit]')?.addEventListener('click', () => {
        anchor.closest('form')?.requestSubmit();
      });
    }

    disconnectedCallback() {
      this.observer?.disconnect();
    }
  }

  /* --- Cart count --------------------------------------------------------- */

  class CartCount extends HTMLElement {
    connectedCallback() {
      document.addEventListener('cart:updated', () => this.refresh());
    }

    async refresh() {
      try {
        const cart = await (await fetch('/cart.js')).json();
        this.textContent = cart.item_count;
        this.hidden = cart.item_count === 0;
      } catch {
        /* leave the server-rendered count in place */
      }
    }
  }

  /* --- Mobile navigation --------------------------------------------------- */

  class MobileNav extends HTMLElement {
    connectedCallback() {
      this.toggle = this.querySelector('[data-nav-toggle]');
      this.panel = this.querySelector('[data-nav-panel]');
      if (!this.toggle || !this.panel) return;

      this.toggle.addEventListener('click', () => this.setOpen(this.panel.hidden));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !this.panel.hidden) {
          this.setOpen(false);
          this.toggle.focus();
        }
      });
    }

    setOpen(open) {
      this.panel.hidden = !open;
      this.toggle.setAttribute('aria-expanded', String(open));
      if (open) this.panel.querySelector('a')?.focus();
    }
  }

  /* --- Review distribution filtering --------------------------------------- */

  class ReviewFilter extends HTMLElement {
    connectedCallback() {
      this.querySelectorAll('[data-star]').forEach((bar) => {
        bar.addEventListener('click', () => {
          const star = bar.dataset.star;
          const active = this.dataset.active === star;
          this.dataset.active = active ? '' : star;

          this.querySelectorAll('[data-review-star]').forEach((review) => {
            review.hidden = !active && review.dataset.reviewStar !== star;
          });
          announce(active ? 'Showing all reviews' : `Showing ${star} star reviews`);
        });
      });
    }
  }

  customElements.define('product-gallery', ProductGallery);
  customElements.define('product-form', ProductForm);
  customElements.define('sticky-atc', StickyAtc);
  customElements.define('cart-count', CartCount);
  customElements.define('mobile-nav', MobileNav);
  customElements.define('review-filter', ReviewFilter);
})();
