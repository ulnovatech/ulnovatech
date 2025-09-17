(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach(function (form) {
    form.setAttribute('autocomplete', 'off');
    form.querySelectorAll('input, textarea').forEach(field => {
      field.setAttribute('autocomplete', 'off');
    });

    form.addEventListener('submit', function (event) {
      event.preventDefault();

      const thisForm = this;
      const action = thisForm.getAttribute('action');
      const recaptcha = thisForm.getAttribute('data-recaptcha-site-key');

      const loadingEl = thisForm.querySelector('.loading');
      const errorEl = thisForm.querySelector('.error-message');
      const sentEl = thisForm.querySelector('.sent-message');

      if (!action) {
        displayError(thisForm, 'The form action property is not set!');
        return;
      }

      if (loadingEl) loadingEl.style.display = 'block';
      if (errorEl) errorEl.style.display = 'none';
      if (sentEl) sentEl.style.display = 'none';

      const formData = new FormData(thisForm);

      if (recaptcha) {
        if (typeof grecaptcha !== "undefined") {
          grecaptcha.ready(function () {
            try {
              grecaptcha.execute(recaptcha, { action: 'php_email_form_submit' })
                .then(token => {
                  formData.set('recaptcha-response', token);
                  php_email_form_submit(thisForm, action, formData);
                })
                .catch(error => {
                  displayError(thisForm, 'reCAPTCHA error: ' + error.message);
                });
            } catch (error) {
              displayError(thisForm, 'reCAPTCHA initialization error: ' + error.message);
            }
          });
        } else {
          displayError(thisForm, 'The reCaptcha JavaScript API URL is not loaded!');
        }
      } else {
        php_email_form_submit(thisForm, action, formData);
      }
    });
  });

  function php_email_form_submit(thisForm, action, formData) {
    fetch(action, {
      method: 'POST',
      body: formData,
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => {
      if (response.ok) {
        return response.json().catch(error => {
          // Handle JSON parsing errors
          throw new Error('Invalid JSON response from server: ' + error.message);
        });
      } else {
        throw new Error(`${response.status} ${response.statusText} (${response.url})`);
      }
    })
    .then(data => {
      console.log('Server response:', data); // Debug: Log the response
      const loadingEl = thisForm.querySelector('.loading');
      const sentEl = thisForm.querySelector('.sent-message');
      const errorEl = thisForm.querySelector('.error-message');

      if (loadingEl) loadingEl.style.display = 'none';

      if (data && data.status === 'success') {
        if (sentEl) {
          sentEl.innerHTML = data.message || 'Your message has been sent. Thank you!';
          sentEl.style.display = 'block';
        }
        if (errorEl) errorEl.style.display = 'none';
        thisForm.reset();
      } else {
        throw new Error(data && data.message ? data.message : 'Invalid response format from server');
      }
    })
    .catch(error => {
      console.error('Fetch error:', error); // Debug: Log the error
      displayError(thisForm, error.message || 'An error occurred while submitting the form.');
    });
  }

  function displayError(thisForm, error) {
    const loadingEl = thisForm.querySelector('.loading');
    const errorEl = thisForm.querySelector('.error-message');
    const sentEl = thisForm.querySelector('.sent-message');

    if (loadingEl) loadingEl.style.display = 'none';
    if (sentEl) sentEl.style.display = 'none';

    if (errorEl) {
      errorEl.innerHTML = error;
      errorEl.style.display = 'block';
    }
  }
})();