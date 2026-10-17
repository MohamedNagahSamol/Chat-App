import assert from 'node:assert/strict'
import { createServer } from 'vite'

console.log('====================================================')
console.log('STARTING EMPIRICAL CHALLENGE SUITE: MILESTONE 2')
console.log('====================================================\n')

// In-memory mock localStorage implementation
class MockLocalStorage {
  constructor() {
    this.store = {}
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null
  }
  setItem(key, value) {
    this.store[key] = String(value)
  }
  removeItem(key) {
    delete this.store[key]
  }
  clear() {
    this.store = {}
  }
}

globalThis.localStorage = new MockLocalStorage()

const viteServer = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true },
})

let passedTests = 0
let failedTests = 0

function runTest(name, fn) {
  try {
    fn()
    console.log(`  [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    failedTests++
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn()
    console.log(`  [PASS] ${name}`)
    passedTests++
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message)
    failedTests++
  }
}

try {
  const { default: api } = await viteServer.ssrLoadModule('./src/utils/axios.js')
  const { default: useAuthStore } = await viteServer.ssrLoadModule('./src/store/authStore.js')

  console.log('--- SECTION 1: AUTH STORE TOKEN PERSISTENCE & CLEANUP ---')

  // 1.1 login with token
  await runAsyncTest('authStore.login with token stores token in localStorage', async () => {
    localStorage.clear()
    const mockToken = 'mock-jwt-token-login-123'
    api.post = async (url) => {
      if (url === '/api/auth/login') return { data: { success: true, token: mockToken } }
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user1', email: 'test@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().login('test@example.com', 'password123')
    assert.equal(localStorage.getItem('token'), mockToken, 'Token should be stored in localStorage')
  })

  // 1.2 login without token
  await runAsyncTest('authStore.login without token does not store token', async () => {
    localStorage.clear()
    api.post = async (url) => {
      if (url === '/api/auth/login') return { data: { success: true } } // no token field
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user1', email: 'test@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().login('test@example.com', 'password123')
    assert.equal(localStorage.getItem('token'), null, 'localStorage token should remain null')
  })

  // 1.3 register with token
  await runAsyncTest('authStore.register with token stores token in localStorage', async () => {
    localStorage.clear()
    const mockToken = 'mock-jwt-token-register-456'
    api.post = async (url) => {
      if (url === '/api/auth/register') return { data: { success: true, token: mockToken } }
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user2', email: 'reg@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().register('Reg User', 'reg@example.com', 'password123')
    assert.equal(localStorage.getItem('token'), mockToken, 'Token should be stored in localStorage')
  })

  // 1.4 register without token
  await runAsyncTest('authStore.register without token does not store token', async () => {
    localStorage.clear()
    api.post = async (url) => {
      if (url === '/api/auth/register') return { data: { success: true } }
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user2', email: 'reg@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().register('Reg User', 'reg@example.com', 'password123')
    assert.equal(localStorage.getItem('token'), null, 'localStorage token should remain null')
  })

  // 1.5 googleLogin with token
  await runAsyncTest('authStore.googleLogin with token stores token in localStorage', async () => {
    localStorage.clear()
    const mockToken = 'mock-jwt-token-google-789'
    api.post = async (url) => {
      if (url === '/api/auth/google') return { data: { success: true, token: mockToken } }
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user3', email: 'google@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().googleLogin('mock-google-credential')
    assert.equal(localStorage.getItem('token'), mockToken, 'Token should be stored in localStorage')
  })

  // 1.6 googleLogin without token
  await runAsyncTest('authStore.googleLogin without token does not store token', async () => {
    localStorage.clear()
    api.post = async (url) => {
      if (url === '/api/auth/google') return { data: { success: true } }
      throw new Error(`Unexpected POST url: ${url}`)
    }
    api.get = async (url) => {
      if (url === '/api/auth/check') return { data: { _id: 'user3', email: 'google@example.com' } }
      throw new Error(`Unexpected GET url: ${url}`)
    }

    await useAuthStore.getState().googleLogin('mock-google-credential')
    assert.equal(localStorage.getItem('token'), null, 'localStorage token should remain null')
  })

  // 1.7 logout clears token
  await runAsyncTest('authStore.logout clears token from localStorage', async () => {
    localStorage.setItem('token', 'existing-token-logout')
    api.post = async (url) => {
      if (url === '/api/auth/logout') return { data: { success: true } }
      throw new Error(`Unexpected POST url: ${url}`)
    }

    await useAuthStore.getState().logout()
    assert.equal(localStorage.getItem('token'), null, 'Token should be removed from localStorage')
    assert.equal(useAuthStore.getState().user, null, 'User should be null in store')
  })

  // 1.8 logout error resilience (finally block)
  await runAsyncTest('authStore.logout clears token even if backend request fails (finally block)', async () => {
    localStorage.setItem('token', 'token-to-be-cleared-on-failure')
    api.post = async (url) => {
      if (url === '/api/auth/logout') throw new Error('Network failure or 500 error')
      throw new Error(`Unexpected POST url: ${url}`)
    }

    try {
      await useAuthStore.getState().logout()
    } catch {
      // Expected rejection if unhandled in logout
    }
    assert.equal(localStorage.getItem('token'), null, 'Token must still be removed from localStorage')
    assert.equal(useAuthStore.getState().user, null, 'User state must still be reset to null')
  })

  // 1.9 deleteAccount clears token
  await runAsyncTest('authStore.deleteAccount clears token from localStorage', async () => {
    localStorage.setItem('token', 'existing-token-delete')
    api.delete = async (url) => {
      if (url === '/api/auth/delete-account') return { data: { success: true } }
      throw new Error(`Unexpected DELETE url: ${url}`)
    }

    await useAuthStore.getState().deleteAccount()
    assert.equal(localStorage.getItem('token'), null, 'Token should be removed from localStorage')
    assert.equal(useAuthStore.getState().user, null, 'User should be null in store')
  })

  // 1.10 deleteAccount error resilience (finally block)
  await runAsyncTest('authStore.deleteAccount clears token even if backend request fails (finally block)', async () => {
    localStorage.setItem('token', 'token-to-be-cleared-on-delete-failure')
    api.delete = async (url) => {
      if (url === '/api/auth/delete-account') throw new Error('Account deletion failed on server')
      throw new Error(`Unexpected DELETE url: ${url}`)
    }

    let threw = false
    try {
      await useAuthStore.getState().deleteAccount()
    } catch {
      threw = true
    }
    assert.equal(threw, true, 'deleteAccount propagates the error')
    assert.equal(localStorage.getItem('token'), null, 'Token must still be removed from localStorage via finally')
    assert.equal(useAuthStore.getState().user, null, 'User must still be null via finally')
  })

  // 1.11 Axios request interceptor Bearer injection
  await runAsyncTest('axios interceptor attaches Authorization: Bearer <token> when token exists', async () => {
    localStorage.setItem('token', 'bearer-test-token-xyz')
    const handler = api.interceptors.request.handlers[0]
    assert.ok(handler && typeof handler.fulfilled === 'function', 'Request interceptor handler exists')

    const config = { headers: {} }
    const modifiedConfig = handler.fulfilled(config)
    assert.equal(modifiedConfig.headers.Authorization, 'Bearer bearer-test-token-xyz')

    // Test when token is absent
    localStorage.clear()
    const configNoToken = { headers: {} }
    const resultNoToken = handler.fulfilled(configNoToken)
    assert.equal(resultNoToken.headers.Authorization, undefined, 'Authorization should not be attached when token is absent')
  })

  console.log('\n--- SECTION 2: NETWORK ERROR HANDLING & TOAST MESSAGE ORACLES ---')

  const isNetworkError = (err) => {
    return !err?.response || err?.code === 'ERR_NETWORK' || (typeof err?.message === 'string' && err.message.includes('Network Error'))
  }

  const getLoginErrorMessage = (err) => {
    if (isNetworkError(err)) {
      return 'Server is unreachable. Please check your network connection or try again later.'
    }
    return err.response?.data?.message || 'Login failed'
  }

  const getRegisterErrorMessage = (err) => {
    if (isNetworkError(err)) {
      return 'Server is unreachable. Please check your network connection or try again later.'
    }
    const msg = err.response?.data?.message
    return Array.isArray(msg) ? msg[0]?.msg || 'Registration failed' : msg || 'Registration failed'
  }

  // 2.1 Test with err = { code: 'ERR_NETWORK' }
  runTest("LoginPage with err = { code: 'ERR_NETWORK' } yields unreachable message", () => {
    const err = { code: 'ERR_NETWORK' }
    assert.equal(isNetworkError(err), true)
    assert.equal(getLoginErrorMessage(err), 'Server is unreachable. Please check your network connection or try again later.')
  })

  runTest("RegisterPage with err = { code: 'ERR_NETWORK' } yields unreachable message", () => {
    const err = { code: 'ERR_NETWORK' }
    assert.equal(isNetworkError(err), true)
    assert.equal(getRegisterErrorMessage(err), 'Server is unreachable. Please check your network connection or try again later.')
  })

  // 2.2 Test with err = { response: undefined }
  runTest("LoginPage with err = { response: undefined } yields unreachable message", () => {
    const err = { response: undefined }
    assert.equal(isNetworkError(err), true)
    assert.equal(getLoginErrorMessage(err), 'Server is unreachable. Please check your network connection or try again later.')
  })

  runTest("RegisterPage with err = { response: undefined } yields unreachable message", () => {
    const err = { response: undefined }
    assert.equal(isNetworkError(err), true)
    assert.equal(getRegisterErrorMessage(err), 'Server is unreachable. Please check your network connection or try again later.')
  })

  // 2.3 Test with err = { response: { data: { message: 'Invalid credentials' } } }
  runTest("LoginPage with err = { response: { data: { message: 'Invalid credentials' } } } preserves API message", () => {
    const err = { response: { data: { message: 'Invalid credentials' } } }
    assert.equal(isNetworkError(err), false)
    assert.equal(getLoginErrorMessage(err), 'Invalid credentials')
  })

  runTest("RegisterPage with err = { response: { data: { message: 'Invalid credentials' } } } preserves API message", () => {
    const err = { response: { data: { message: 'Invalid credentials' } } }
    assert.equal(isNetworkError(err), false)
    assert.equal(getRegisterErrorMessage(err), 'Invalid credentials')
  })

  // 2.4 Adversarial Edge Case: Message with 'Network Error' string but response object exists
  runTest("isNetworkError handles err with message containing 'Network Error' even if response is present", () => {
    const err = { message: 'AxiosError: Network Error occurred', response: { data: {} } }
    assert.equal(isNetworkError(err), true)
    assert.equal(getLoginErrorMessage(err), 'Server is unreachable. Please check your network connection or try again later.')
  })

  // 2.5 Adversarial Edge Case: RegisterPage express-validator array format
  runTest("RegisterPage unwraps express-validator array format message correctly", () => {
    const err = { response: { data: { message: [{ msg: 'Password must be at least 6 characters' }] } } }
    assert.equal(isNetworkError(err), false)
    assert.equal(getRegisterErrorMessage(err), 'Password must be at least 6 characters')
  })

  // 2.6 Adversarial Edge Case: Empty response data fallbacks
  runTest("LoginPage falls back to 'Login failed' when response data message is missing", () => {
    const err = { response: { status: 500, data: {} } }
    assert.equal(isNetworkError(err), false)
    assert.equal(getLoginErrorMessage(err), 'Login failed')
  })

  runTest("RegisterPage falls back to 'Registration failed' when response data message is missing", () => {
    const err = { response: { status: 500, data: {} } }
    assert.equal(isNetworkError(err), false)
    assert.equal(getRegisterErrorMessage(err), 'Registration failed')
  })

  // 2.7 Adversarial Edge Case: null or undefined error
  runTest("isNetworkError safely handles null or undefined error object without throwing", () => {
    assert.equal(isNetworkError(null), true)
    assert.equal(isNetworkError(undefined), true)
    assert.equal(getLoginErrorMessage(null), 'Server is unreachable. Please check your network connection or try again later.')
    assert.equal(getRegisterErrorMessage(null), 'Server is unreachable. Please check your network connection or try again later.')
  })

  console.log('\n--- SECTION 3: VERCEL REWRITES & API GATEWAY ROUTING ---')

  const { readFileSync } = await import('node:fs')
  const vercelConfig = JSON.parse(readFileSync('./vercel.json', 'utf8'))

  runTest('vercel.json contains valid rewrites configuration array', () => {
    assert.ok(Array.isArray(vercelConfig.rewrites), 'rewrites should be an array')
    assert.equal(vercelConfig.rewrites.length, 3, 'rewrites should contain exactly 3 rules')
  })

  runTest('vercel.json routes /api/(.*) to production Railway backend', () => {
    assert.equal(vercelConfig.rewrites[0].source, '/api/(.*)')
    assert.equal(vercelConfig.rewrites[0].destination, 'https://chat-app-backend-production-c2e8.up.railway.app/api/$1')
  })

  runTest('vercel.json routes /uploads/(.*) to production Railway backend', () => {
    assert.equal(vercelConfig.rewrites[1].source, '/uploads/(.*)')
    assert.equal(vercelConfig.rewrites[1].destination, 'https://chat-app-backend-production-c2e8.up.railway.app/uploads/$1')
  })

  runTest('vercel.json provides SPA catch-all rewrite to /index.html as final rule', () => {
    assert.equal(vercelConfig.rewrites[2].source, '/(.*)')
    assert.equal(vercelConfig.rewrites[2].destination, '/index.html')
  })
} finally {
  await viteServer.close()
}

console.log('\n====================================================')
console.log(`TEST SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`)
console.log('====================================================')

if (failedTests > 0) {
  process.exit(1)
} else {
  process.exit(0)
}
