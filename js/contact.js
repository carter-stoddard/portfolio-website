/* ============================================================
   CONTACT.JS
   Form validation, service pill toggling, and Supabase submission.
   ============================================================ */

// ============================================================
// SUPABASE CREDENTIALS
// Found in: Supabase Dashboard → Project Settings → API
// ============================================================
const SUPABASE_URL = 'https://bzvjguwpayeelmctvboi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6dmpndXdwYXllZWxtY3R2Ym9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NzkzMDksImV4cCI6MjA4OTU1NTMwOX0.R45g0zsVRJyml-jxPZ1jTIWdNSSHQn1r-RxIaYRSzaQ';
const SUPABASE_TABLE = 'contact_submissions';


(function contactForm() {
  var form = document.getElementById('contact-form');
  var submitBtn = document.getElementById('contact-submit');
  var submitError = document.getElementById('contact-submit-error');
  var successBlock = document.getElementById('contact-success');
  if (!form) return;

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
  // Validation helpers
  // ----------------------------------------------------------
  var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function clearErrors() {
    form.querySelectorAll('.contact__error').forEach(function(el) {
      el.textContent = '';
    });
    if (submitError) submitError.textContent = '';
  }

  function showError(field, msg) {
    var errorEl = field.closest('.contact__row').querySelector('.contact__error');
    if (errorEl) errorEl.textContent = msg;
  }

  function validate() {
    clearErrors();
    var valid = true;

    // First name
    var firstName = document.getElementById('contact-first-name');
    if (!firstName.value.trim()) {
      showError(firstName, 'First name is required.');
      valid = false;
    }

    // Last name
    var lastName = document.getElementById('contact-last-name');
    if (!lastName.value.trim()) {
      showError(lastName, 'Last name is required.');
      valid = false;
    }

    // Email
    var email = document.getElementById('contact-email');
    if (!email.value.trim()) {
      showError(email, 'Email is required.');
      valid = false;
    } else if (!emailRegex.test(email.value.trim())) {
      showError(email, 'Please enter a valid email address.');
      valid = false;
    }

    // Company
    var company = document.getElementById('contact-company');
    if (!company.value.trim()) {
      showError(company, 'Company is required.');
      valid = false;
    }

    // Role
    var role = document.getElementById('contact-role');
    if (!role.value.trim()) {
      showError(role, 'Role is required.');
      valid = false;
    }

    // Services — at least one pill selected
    var selectedPills = form.querySelectorAll('.contact__pill.is-selected');
    if (selectedPills.length === 0) {
      var servicesField = document.getElementById('contact-services');
      showError(servicesField, 'Please select at least one service.');
      valid = false;
    }

    // Consent
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
  // Submit handler
  // ----------------------------------------------------------
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    if (!validate()) return;

    // Gather values
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

    // Button loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Submit click scale pulse
    if (typeof gsap !== 'undefined') {
      gsap.fromTo(submitBtn,
        { scale: 0.97 },
        { scale: 1, duration: 0.2, ease: 'power2.out' }
      );
    }

    // Supabase REST API insert
    try {
      var response = await fetch(SUPABASE_URL + '/rest/v1/' + SUPABASE_TABLE, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        var errBody = await response.json().catch(function() { return {}; });
        throw new Error(errBody.message || 'Submission failed');
      }

      showSuccess();
    } catch (err) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'LAUNCH';
      if (submitError) {
        submitError.textContent = 'Something went wrong. Try reaching me directly at contact@carterstoddard.com.';
      }
    }
  });

  // ----------------------------------------------------------
  // Success state
  // ----------------------------------------------------------
  function showSuccess() {
    if (typeof gsap !== 'undefined') {
      gsap.to(form, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.out',
        onComplete: function() {
          form.style.display = 'none';
          successBlock.style.display = 'block';
          gsap.fromTo(successBlock,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
          // Pulse status dot to full lime
          var dots = document.querySelectorAll('.contact__status-dot--success');
          dots.forEach(function(d) { d.style.opacity = '1'; d.style.animation = 'none'; });
        },
      });
    } else {
      form.style.display = 'none';
      successBlock.style.display = 'block';
    }
  }

})();
