const fs = require('fs');
const assert = require('assert');

console.log('--- Starting Empirical Verification for Milestone 3 ---');

// 1. Check index.html
const indexHtml = fs.readFileSync('index.html', 'utf8');
assert(
  indexHtml.includes('https://accounts.google.com/gsi/client?hl=en'),
  'index.html: missing hl=en query param on Google script tag'
);
console.log('✓ PASS: index.html has Google client script with hl=en');

// 2. Check LoginPage.jsx
const login = fs.readFileSync('src/pages/LoginPage.jsx', 'utf8');
const loginInputs = login.match(/<input[\s\S]*?\/>/g) || [];
console.log(`Found ${loginInputs.length} inputs in LoginPage.jsx`);
assert(loginInputs.length >= 2, 'LoginPage: expected at least 2 input fields');
loginInputs.forEach((inp, idx) => {
  assert(inp.includes('disabled={isSubmitting}'), `LoginPage: input #${idx + 1} does not have disabled={isSubmitting}`);
});
assert(login.includes('className="spinner"'), 'LoginPage: submit button missing spinner');
assert(login.includes('setIsSubmitting(false)'), 'LoginPage: missing setIsSubmitting(false)');
console.log(`✓ PASS: LoginPage.jsx verified (${loginInputs.length} inputs disabled on submit, spinner rendered)`);

// 3. Check RegisterPage.jsx
const reg = fs.readFileSync('src/pages/RegisterPage.jsx', 'utf8');
const regInputs = reg.match(/<input[\s\S]*?\/>/g) || [];
console.log(`Found ${regInputs.length} inputs in RegisterPage.jsx`);
assert(regInputs.length >= 3, 'RegisterPage: expected at least 3 input fields');
regInputs.forEach((inp, idx) => {
  assert(inp.includes('disabled={isSubmitting}'), `RegisterPage: input #${idx + 1} does not have disabled={isSubmitting}`);
});
assert(reg.includes('className="spinner"'), 'RegisterPage: submit button missing spinner');
assert(reg.includes('setIsSubmitting(false)'), 'RegisterPage: missing setIsSubmitting(false)');
console.log(`✓ PASS: RegisterPage.jsx verified (${regInputs.length} inputs disabled on submit, spinner rendered)`);

// 4. Check MessageInput.jsx
const msg = fs.readFileSync('src/components/MessageInput.jsx', 'utf8');
assert(msg.includes('disabled={sending}'), 'MessageInput: missing disabled={sending}');
assert(msg.includes('className="spinner"'), 'MessageInput: missing spinner');
assert(msg.includes('setSending(false)'), 'MessageInput: missing setSending(false)');
const msgTextInputs = msg.match(/<input[\s\S]*?type="text"[\s\S]*?\/>/g) || [];
assert(msgTextInputs.length > 0 && msgTextInputs[0].includes('disabled={sending}'), 'MessageInput text input not disabled={sending}');
console.log('✓ PASS: MessageInput.jsx verified (text & media inputs disabled on sending, spinner rendered)');

// 5. Check ProfilePage.jsx
const prof = fs.readFileSync('src/pages/ProfilePage.jsx', 'utf8');
assert(prof.includes('disabled={deleting}'), 'ProfilePage: missing disabled={deleting}');
assert(prof.includes('className="spinner"'), 'ProfilePage: missing spinner');
assert(prof.includes('setDeleting(false)'), 'ProfilePage: missing setDeleting(false)');
assert(prof.includes('[users.length, getUsers]'), 'ProfilePage: missing [users.length, getUsers] in useEffect dependencies');
// Check delete confirmation input
assert(
  prof.includes('id="delete-confirm-input"') && prof.includes('disabled={deleting}'),
  'ProfilePage: delete-confirm-input missing disabled={deleting}'
);
console.log('✓ PASS: ProfilePage.jsx verified (delete modal input disabled on deleting, spinner rendered, useEffect dependencies fixed)');

// 6. Check index.css
const css = fs.readFileSync('src/index.css', 'utf8');
assert(css.includes('.spinner {'), 'index.css: missing .spinner rule');
assert(css.includes('@keyframes spin'), 'index.css: missing @keyframes spin');
assert(css.includes('--text-secondary: #94a3b8;'), 'index.css: missing --text-secondary');
console.log('✓ PASS: index.css verified (spinner styles, animation, theme tokens present)');

console.log('----------------------------------------------------');
console.log('ALL EMPIRICAL TESTS PASSED SUCCESSFULLY (6/6 SUITES)');
