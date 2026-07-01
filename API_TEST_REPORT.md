# API Test Report & Bug Fix Verification

This report documents the testing and subsequent verification of the backend APIs for the messaging application.

---

## 🚀 Execution Environment
* **Server URL**: `http://localhost:3000`
* **Database**: MongoDB (Local)
* **Auth mechanism**: JWT token passed in `jwt` HttpOnly cookie.

---

## 📊 Summary of Test Results (Post-Fixes)

| API Endpoint | Method | Purpose | Status | Notes / Fixes Applied |
|---|---|---|---|---|
| `/api/auth/register` | `POST` | Register a new user | **PASS** | Validates email, password complexity (requires uppercase, number, and special character). |
| `/api/auth/login` | `POST` | Login user & issue JWT | **PASS** | Successfully sets `jwt` cookie and returns token in JSON response. |
| `/api/auth/check` | `GET` | Get current logged-in user | **PASS** | Verifies token & returns user details. |
| `/api/message/user` | `GET` | List users for sidebar | **PASS** | Returns list of all users excluding the currently logged-in user. |
| `/api/message/send/:userId` | `POST` | Send message to user | **PASS** | **Fixed**: Messages are now properly saved with both `message` and `text` fields populated in the database. |
| `/api/message/:userId` | `GET` | Get conversations / chat | **PASS** | **Fixed**: Responses are cleanly formatted JavaScript objects (Mongoose internals removed) and correctly map message content. |
| `/api/message/seen/:userId` | `PUT` | Mark message as seen | **PASS** | **Fixed**: Implemented real seen logic using `updateMany` to mark messages as seen: true. |
| `/api/message/delete/:userId` | `DELETE` | Delete message / conversation | **PASS** | **Fixed**: Implemented real delete logic using `deleteMany` to clear chat history between users. |

---

## 🔍 Detail of Applied Fixes

### 1. Schema vs. Request Payload Alignment
* **Change**: Added `message` and `seen` fields to [messageSchema](file:///c:/obj/obj86/backend/src/Module/messageModule.js#L3-L11).
* **Controller**: In `sendMessage`, we destructure `{ message, text, image }` and set both `message` and `text` dynamically to accommodate whatever formatting the frontend or API test suite uses.

---

### 2. Mongoose Document Formatting
* **Change**: In `getConversations`, we convert Mongoose documents to raw objects via `conversation.toObject()` before applying the spread operator (`...`). This keeps the JSON payload lean and standard, excluding private Mongoose connection fields.

---

### 3. Fully Operational logic for `seenMessage` & `deleteMessage`
* **seenMessage**: Updates all unseen messages sent from the target user to the current user as `seen: true`.
* **deleteMessage**: Deletes all messages exchanged between the target user and the current user from the database.
