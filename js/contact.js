/* ============================================================
   CONTACT.JS
   Form validation, service pill toggling, and Supabase submission.
   ============================================================ */

const SUPABASE_URL = 'https://bzvjguwpayeelmctvboi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dmpndXdwYXllZWxtY3R2Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzkzMDksImV4cCI6MjA4OTU1NTMwOX0.R45g0zsVRJyml-jxPZ1jTIWdNSSHQn1r-RxIaYRSzaQ';
const SUPABASE_TABLE = 'contact_submissions';

(function() {
  var form = document.getElementById('contact-form');
  var submitBtn = document.getElementById('contact-submit');
  var submitError = document.getElementById('contact-submit-error');
  var modal = document.getElementById('mission-modal');
  if (!form || !modal) return;

  var formLoadTime = Date.now();

  // ----------------------------------------------------------
  // Modal open / close
  // ----------------------------------------------------------
  // Modal open/close handled by inline onclick in HTML
  // Escape key to close
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      modal.style.opacity = '0';
      modal.style.visibility = 'hidden';
      modal.style.pointerEvents = 'none';
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  // ----------------------------------------------------------
  // Service pill toggling
  // ----------------------------------------------------------
  var pillContainer = document.getElementById('contact-services');
  if (pillContainer) {
    pillContainer.addEventListener('click', function(e) {
      var pill = e.target.closest('.contact__pill');
      if (!pill) return;
      pill.classList.toggle('is-selected');
      pill.setAttribute('aria-pressed', pill.classList.contains('is-selected'));
    });
  }

  // ----------------------------------------------------------
  // Validation
  // ----------------------------------------------------------
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors() {
    form.querySelectorAll('.contact__error').forEach(function(el) { el.textContent = ''; });
    if (submitError) submitError.textContent = '';
  }

  function showError(field, msg) {
    var errorEl = field.closest('.contact__row').querySelector('.contact__error');
    if (errorEl) errorEl.textContent = msg;
  }

  function validate() {
    clearErrors();
    var valid = true;

    var firstName = document.getElementById('contact-first-name');
    if (!firstName.value.trim()) { showError(firstName, 'First name is required.'); valid = false; }

    var lastName = document.getElementById('contact-last-name');
    if (!lastName.value.trim()) { showError(lastName, 'Last name is required.'); valid = false; }

    var email = document.getElementById('contact-email');
    if (!email.value.trim()) { showError(email, 'Email is required.'); valid = false; }
    else if (!emailRegex.test(email.value.trim())) { showError(email, 'Please enter a valid email address.'); valid = false; }

    var company = document.getElementById('contact-company');
    if (!company.value.trim()) { showError(company, 'Company is required.'); valid = false; }

    var role = document.getElementById('contact-role');
    if (!role.value.trim()) { showError(role, 'Role is required.'); valid = false; }

    var selectedPills = form.querySelectorAll('.contact__pill.is-selected');
    if (selectedPills.length === 0) {
      var servicesField = document.getElementById('contact-services');
      showError(servicesField, 'Please select at least one service.');
      valid = false;
    }

    var consent = document.getElementById('contact-consent');
    if (!consent.checked) {
      var consentRow = consent.closest('.contact__row');
      var consentError = consentRow.querySelector('.contact__error');
      if (consentError) consentError.textContent = 'You must agree to continue.';
      valid = false;
    }

    return valid;
  }

  // ----------------------------------------------------------
  // Submit
  // ----------------------------------------------------------
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Bot check — honeypot
    var honeypot = document.getElementById('contact-website');
    if (honeypot && honeypot.value) return;

    // Bot check — timing
    if (Date.now() - formLoadTime < 3000) {
      if (submitError) submitError.textContent = 'Please wait a moment before submitting.';
      return;
    }

    if (!validate()) return;

    // Gather data
    var data = {
      first_name: document.getElementById('contact-first-name').value.trim(),
      last_name: document.getElementById('contact-last-name').value.trim(),
      email: document.getElementById('contact-email').value.trim(),
      company: document.getElementById('contact-company').value.trim(),
      role: document.getElementById('contact-role').value.trim(),
      services: Array.from(form.querySelectorAll('.contact__pill.is-selected'))
        .map(function(p) { return p.getAttribute('data-service'); })
        .join(', '),
      message: document.getElementById('contact-message').value.trim(),
      consent: document.getElementById('contact-consent').checked,
    };

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="contact__submit-dots">LAUNCHING<span>.</span><span>.</span><span>.</span></span>';

    // Reset form and show modal
    form.reset();
    form.querySelectorAll('.contact__pill.is-selected').forEach(function(p) {
      p.classList.remove('is-selected');
      p.setAttribute('aria-pressed', 'false');
    });
    form.querySelectorAll('.contact__success').forEach(function(el) {
      el.classList.remove('is-visible');
      el.textContent = '';
    });
    submitBtn.disabled = false;
    submitBtn.textContent = 'LAUNCH';

    // Supabase insert (background)
    fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(data),
    }).catch(function(err) {
      console.warn('[contact] Supabase error:', err);
    });
  });

  // ----------------------------------------------------------
  // Field success — green checkmark on blur
  // ----------------------------------------------------------
  function showFieldSuccess(input) {
    var field = input.closest('.contact__field');
    if (!field) return;
    var successEl = field.querySelector('.contact__success');
    var errorEl = field.querySelector('.contact__error');
    if (!successEl) return;

    var val = input.value.trim();
    var isValid = false;

    if (input.type === 'email') { isValid = emailRegex.test(val); }
    else { isValid = val.length > 0; }

    if (isValid) {
      if (errorEl) errorEl.textContent = '';
      var msg = input.dataset.success || 'Got it';
      if (input.id === 'contact-first-name' && val) msg = 'Nice to meet you, ' + val + '!';
      successEl.textContent = msg;
      successEl.classList.add('is-visible');
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(successEl, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
      }
    } else {
      successEl.classList.remove('is-visible');
      successEl.textContent = '';
    }
  }

  form.querySelectorAll('.contact__input').forEach(function(input) {
    input.addEventListener('blur', function() { showFieldSuccess(input); });
  });

  if (pillContainer) {
    pillContainer.addEventListener('click', function() {
      var selected = pillContainer.querySelectorAll('.contact__pill.is-selected');
      var field = pillContainer.closest('.contact__field');
      var successEl = field ? field.querySelector('.contact__success') : null;
      if (!successEl) return;
      if (selected.length > 0) {
        successEl.textContent = 'Great choices';
        successEl.classList.add('is-visible');
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(successEl, { opacity: 0, y: 4 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
        }
      } else {
        successEl.classList.remove('is-visible');
        successEl.textContent = '';
      }
    });
  }
})();
