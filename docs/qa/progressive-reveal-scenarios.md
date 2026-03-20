# QA Scenarios — Progressive Reveal Mechanic

> Scope: the 4 progressive reveal moments and their before/after states
> Format: Given/When/Then
> Cross-reference: `docs/progressive-reveal-spec.md` for reveal screen copy and UI specs
> API: `GET /api/v1/users/me/reveals` → `RevealStatus { revealTokens, revealWallet, revealGas, revealDashboard }`
> Last updated: 2026-03-16

---

## Reveal 1 — Knowledge Tokens (Mission 2.2.4)

### R01 — Token UI Is Hidden Before Mission 2.2.4 `[API]` `[UI]`

**Given** an authenticated user who has not yet completed mission `2.2.4`

**When** `GET /api/v1/users/me/reveals` is called

**Then**
- Response is `{ data: { revealTokens: false, revealWallet: false, revealGas: false, revealDashboard: false } }`

**And** the frontend must not render any token balance UI (nav token display, token balance card, transaction history) while `revealTokens` is `false`

---

### R02 — Tokens Are Earned But Hidden Before Reveal `[API]` `[DB]`

**Given** an authenticated user who has completed 5 missions (earning 50 tokens) but has not yet reached mission `2.2.4`

**When** `GET /api/v1/tokens/balance` is called

**Then**
- Response is `200` and returns the correct balance (`{ data: { tokenBalance: 50, totalEarned: 50 } }`)
- The API returns the data regardless of reveal state — it is the frontend's responsibility to hide the token UI until `revealTokens` is `true`

**Note:** Token data is always accessible via the API. The reveal flag controls frontend visibility only, not data access.

---

### R03 — Completing Mission 2.2.4 Sets revealTokens to True `[API]` `[DB]`

**Given** an authenticated user who has completed missions `2.2.1`, `2.2.2`, `2.2.3` (making `2.2.4` available) and `revealTokens` is currently `false`

**When** `POST /api/v1/curriculum/missions/2.2.4/complete` is called

**Then**
- Response status is `200`
- Response contains `{ data: { reveals: { tokens: true } } }` (or the reveal flag is included in the response)
- `GET /api/v1/users/me/reveals` subsequently returns `{ data: { revealTokens: true, ... } }`
- `User.revealTokens` is `true` in the database

---

### R04 — Token Reveal Fires Exactly Once `[API]`

**Given** a user for whom `revealTokens` is already `true` (mission 2.2.4 was completed in a previous session)

**When** the user logs in and `GET /api/v1/users/me/reveals` is called

**Then**
- Response includes `{ revealTokens: true }` — the flag has persisted across sessions
- The reveal modal must NOT be shown again (this is frontend logic: show modal only on the response that first transitions the flag from false to true)

---

### R05 — Token UI Remains Visible on All Subsequent Pages After Reveal `[UI]`

**Given** an authenticated user for whom `revealTokens` is `true`

**When** the user navigates to any page: home, curriculum, profile, mission detail

**Then**
- The token balance display is visible in the navigation bar on all pages
- The token balance card is visible on the profile/wallet page
- Transaction history is accessible

---

## Reveal 2 — Wallet Interface (Mission 3.1.4)

### R06 — Wallet Section Is Hidden Before Mission 3.1.4 `[UI]`

**Given** an authenticated user who has `revealWallet: false`

**When** the user navigates to their profile page

**Then**
- The profile page renders the standard profile layout (not the wallet layout)
- No wallet address display, no "Wallet" label in navigation, no transaction history framed as wallet transactions

---

### R07 — Completing Mission 3.1.4 Sets revealWallet to True `[API]` `[DB]`

**Given** an authenticated user who has completed missions `3.1.1`, `3.1.2`, `3.1.3` (making `3.1.4` available) and `revealWallet` is currently `false`

**When** `POST /api/v1/curriculum/missions/3.1.4/complete` is called

**Then**
- Response status is `200`
- `GET /api/v1/users/me/reveals` subsequently returns `{ data: { revealWallet: true, ... } }`
- `User.revealWallet` is `true` in the database

---

### R08 — Profile Transforms to Wallet Layout After Reveal `[UI]`

**Given** an authenticated user for whom `revealWallet` is `true`

**When** the user navigates to their profile page

**Then**
- The wallet layout is rendered (address display, balance, transaction history styled as ledger)
- The navigation label or icon reflects "Wallet" instead of "Profile"

---

### R09 — Wallet Reveal Persists After Logout and Re-login `[API]`

**Given** a user for whom `revealWallet` became `true` in a previous session, who then logged out and logged back in

**When** `GET /api/v1/users/me/reveals` is called

**Then**
- Response includes `{ revealWallet: true }`
- Profile page renders wallet layout without requiring a new reveal sequence

---

### R10 — revealTokens Must Be True Before revealWallet Can Be True `[DB]`

**Given** the sequential unlock of the curriculum

**Then**
- Mission `3.1.4` (wallet trigger) comes after mission `2.2.4` (token trigger) in the unlock chain
- It is architecturally impossible for `revealWallet` to be `true` while `revealTokens` is `false`, because completing `3.1.4` requires completing all prior missions including `2.2.4`
- Verification: a user with `revealWallet: true` must also have `revealTokens: true`

---

## Reveal 3 — Gas Fees (Mission 3.3.3)

### R11 — Gas Costs Are Not Visible Before Mission 3.3.3 `[UI]`

**Given** an authenticated user who has `revealGas: false`

**When** the user views an exercise and its submission button

**Then**
- No gas cost indicator is shown on the exercise UI
- No gas cost appears on the mission start screen

**Note:** Gas fee deduction may or may not be applied server-side before `revealGas` is set — confirm with Hugo. Spec intent: gas fees do NOT apply to submissions before mission `3.3.3` is completed, and the visual indicator is hidden until the flag is set.

---

### R12 — Completing Mission 3.3.3 Sets revealGas to True `[API]` `[DB]`

**Given** an authenticated user who has completed missions `3.3.1` and `3.3.2` (making `3.3.3` available) and `revealGas` is currently `false`

**When** `POST /api/v1/curriculum/missions/3.3.3/complete` is called

**Then**
- Response status is `200`
- `GET /api/v1/users/me/reveals` subsequently returns `{ data: { revealGas: true, ... } }`
- `User.revealGas` is `true` in the database

---

### R13 — Gas Fee Is Deducted on Exercise Submission After revealGas `[API]` `[DB]`

**Given** an authenticated user for whom `revealGas` is `true` and `tokenBalance` is `50`

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called for any exercise

**Then**
- Response status is `200`
- `GET /api/v1/tokens/balance` returns `tokenBalance: 48` (50 − 2)
- A `GAS_SPEND` `TokenTransaction` record exists in the database
- The deduction occurs regardless of whether the submitted answer is correct or incorrect

---

### R14 — Gas Is Charged on Every Submission Attempt, Not Once Per Mission `[API]`

**Given** an authenticated user for whom `revealGas` is `true` and `tokenBalance` is `50`

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called 3 times (simulating 3 answer attempts on the same exercise)

**Then**
- `tokenBalance` is `44` (50 − 2 − 2 − 2)
- 3 `GAS_SPEND` `TokenTransaction` records exist

---

### R15 — Token Debt Is Allowed Mid-Mission But Blocks New Mission Start `[API]`

**Given** an authenticated user for whom `revealGas` is `true` and `tokenBalance` is `2`

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called, reducing balance to `0`, then called again, reducing balance to `−2`

**Then**
- Both submissions are accepted (response `200`)
- `tokenBalance` is `−2`

**And when** the user attempts to start (access) a new mission that they have not yet begun

**Then**
- The server rejects the request with `403` and a debt-related error code (e.g., `TOKEN_DEBT`)

---

### R16 — Gas Cost Indicator Appears on Exercise UI After revealGas `[UI]`

**Given** an authenticated user for whom `revealGas` is `true`

**When** the user views any exercise

**Then**
- The submission button shows a gas cost indicator (e.g., "Submit — 2 KT")
- The token balance in the nav bar updates immediately after each submission response

---

### R17 — Gas Transaction History Appears in Wallet View After revealGas `[UI]`

**Given** an authenticated user for whom `revealGas` is `true` who has made 3 exercise submissions

**When** the user views their wallet transaction history

**Then**
- Transaction history includes 3 `GAS_SPEND` entries
- Each entry shows `−2 KT` and a timestamp
- `EARN` entries from mission completions are also shown in chronological order

---

## Reveal 4 — Full Dashboard (Mission 6.3.4)

### R18 — Dashboard Is Not Accessible Before Mission 6.3.4 `[UI]`

**Given** an authenticated user who has not yet completed mission `6.3.4`

**When** `GET /api/v1/users/me/reveals` is called

**Then**
- `revealDashboard` is `false`
- The frontend must not show a Dashboard navigation item
- Navigating directly to the dashboard route (if it exists) should redirect or show a locked state

---

### R19 — Completing Mission 6.3.4 Sets revealDashboard and Generates Certificate `[API]` `[DB]`

**Given** an authenticated user who has completed all 68 preceding missions and `revealDashboard` is `false`

**When** `POST /api/v1/curriculum/missions/6.3.4/complete` is called

**Then**
- Response status is `200`
- `GET /api/v1/users/me/reveals` returns `{ data: { revealDashboard: true, revealTokens: true, revealWallet: true, revealGas: true } }`
- A `Certificate` record exists in the database for this user
- Response includes certificate data with `shareToken`

---

### R20 — Certificate Is Publicly Accessible After dashboardRevealed `[API]`

**Given** a user whose `revealDashboard` is `true` and who has a `Certificate` record with `shareToken: "abc123"`

**When** `GET /api/v1/certificates/abc123` is called WITHOUT an authentication cookie

**Then**
- Response status is `200`
- Response contains the certificate data (learner name, completion date, share token)

---

### R21 — All Four Reveal Flags Are True After Completing the Full Curriculum `[DB]`

**Given** an authenticated user who has completed all 69 missions

**When** `GET /api/v1/users/me/reveals` is called

**Then**
- `{ data: { revealTokens: true, revealWallet: true, revealGas: true, revealDashboard: true } }`
- All four flags are `true` simultaneously

---

## Cross-Reveal State Consistency

### R22 — Reveal Flags Are Never Reset by Any Action `[DB]`

**Given** a user for whom all four reveal flags are `true`

**When** any of the following occur: logout and re-login, session expiry and re-auth, profile update (`PATCH /users/me`), or any other API call

**Then**
- `GET /api/v1/users/me/reveals` continues to return all four flags as `true`
- Reveal flags are write-once-to-true and can never revert to `false`

---

### R23 — User Who Returns After Long Absence Has Correct Reveal State `[API]`

**Given** a user who completed missions through `3.3.3` (so `revealTokens: true`, `revealWallet: true`, `revealGas: true`, `revealDashboard: false`) then did not use the platform for 30 days

**When** the user logs back in and `GET /api/v1/users/me/reveals` is called

**Then**
- Response is `{ revealTokens: true, revealWallet: true, revealGas: true, revealDashboard: false }`
- The frontend shows token balance, wallet layout, gas indicators, but no dashboard nav item
- No reveal modal is shown (flags were already set; no new transition occurred)

---

### R24 — Frontend Hydration: Reveal Store Populated Before First Render `[UI]`

**Given** an authenticated user with `revealTokens: true` and `revealWallet: true`

**When** the application loads (initial page load, any route)

**Then**
- `GET /api/v1/users/me/reveals` is called before the first meaningful render
- Token balance is visible in nav bar from the first render (no flicker where token display disappears then appears)
- Profile page renders in wallet layout from the first render (no layout flash)

**Implementation note:** The reveal store must be hydrated as part of the authenticated session initialization, not lazily on component mount.
