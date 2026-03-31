/* ============================================================
   FOOTER.JS
   Single source of truth for the site footer.
   Edit here — all pages update automatically.
   ============================================================ */

(function injectFooter() {
  const FOOTER_HTML = `
  <footer id="footer" aria-label="Footer">

    <!-- ROTATING EARTH — centered behind footer -->
    <div id="earth-container">
      <div class="planet-container">
        <div class="night"></div>
        <div class="day"></div>
        <div class="clouds"></div>
        <div class="inner-shadow"></div>
      </div>
    </div>

    <!-- ── Large background text — sits behind astronaut ── -->
    <div class="footer__bg-text" aria-hidden="true">
      <span class="footer__bg-line1">CREATE WITHOUT</span>
      <span class="footer__bg-line2">LIMITS.</span>
    </div>

    <!-- ── Mobile CTA — only visible on mobile, below heading ── -->
    <a href="/#contact" class="footer__mobile-cta">START A PROJECT &nbsp;→</a>

    <!-- ── Center astronaut — sits in front of text ── -->
    <img class="footer__astronaut" src="/assets/images/portrait-astronaut-desktop.png" alt="" aria-hidden="true" loading="lazy" />

    <!-- ── Footer columns — sections left, connect right ── -->
    <div class="footer__columns">

      <!-- Left — Pages/Sections -->
      <nav class="footer__col footer__col--left" aria-label="Footer sections">
        <span class="footer__col-label">SECTIONS</span>
        <div class="footer__col-links">
          <a href="/#about"        class="footer__col-link">ABOUT</a>
          <a href="/#stats"        class="footer__col-link">NUMBERS</a>
          <a href="/#services"     class="footer__col-link">SERVICES</a>
          <a href="/#clients"      class="footer__col-link">CLIENTS</a>
          <a href="/#testimonials" class="footer__col-link">TESTIMONIALS</a>
          <a href="/#contact"      class="footer__col-link">CONTACT</a>
        </div>
      </nav>

      <!-- Right — Connect -->
      <div class="footer__col footer__col--right">
        <span class="footer__col-label">CONNECT</span>
        <div class="footer__col-links">
          <a href="https://www.linkedin.com/in/carterstoddard/" class="footer__col-link" target="_blank" rel="noopener">LINKEDIN</a>
          <a href="mailto:contact@carterstoddard.com" class="footer__col-link">EMAIL</a>
        </div>
      </div>

    </div>

    <!-- ── Bottom bar — copyright + CTA + legal ── -->
    <div class="footer__bottom">
      <div class="footer__copyright-bar">
        <span class="footer__copyright">&copy; 2026 Carter Stoddard LLC. All rights reserved.</span>
        <a href="/#contact" class="footer__cta-btn">LAUNCH PROJECT</a>
        <div class="footer__legal">
          <a href="/privacy-policy.html" class="footer__legal-link">Privacy Policy</a>
          <a href="/terms.html"          class="footer__legal-link">Terms</a>
        </div>
      </div>
    </div>

  </footer>
  `;

  // Insert before </body> — works whether called early or late
  document.addEventListener('DOMContentLoaded', function() {
    // Don't inject if a footer already exists (index.html has its own)
    if (document.getElementById('footer')) return;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = FOOTER_HTML;
    document.body.appendChild(wrapper.firstElementChild);
  });
})();
