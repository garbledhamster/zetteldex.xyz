// reCAPTCHA v3 integration
const RECAPTCHA_SITE_KEY = '6LdVslAsAAAAAAwyU1wyjAxIG_K187E82ID2C7Re';

let recaptchaLoaded = false;
let recaptchaReady = false;

/**
 * Load reCAPTCHA v3 script
 */
export function loadRecaptcha() {
  return new Promise((resolve, reject) => {
    if (recaptchaLoaded) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      recaptchaLoaded = true;
      // Wait for grecaptcha to be ready
      window.grecaptcha.ready(() => {
        recaptchaReady = true;
        resolve();
      });
    };

    script.onerror = () => {
      reject(new Error('Failed to load reCAPTCHA'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Execute reCAPTCHA and get token
 * @param {string} action - The action name for this reCAPTCHA execution
 * @returns {Promise<string>} reCAPTCHA token
 */
export async function executeRecaptcha(action = 'submit') {
  if (!recaptchaReady) {
    await loadRecaptcha();
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha
        .execute(RECAPTCHA_SITE_KEY, { action })
        .then(token => resolve(token))
        .catch(error => reject(error));
    });
  });
}
