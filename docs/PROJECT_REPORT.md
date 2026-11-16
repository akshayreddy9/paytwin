# PayTwin: A UPI Digital Payments Application with Real-Time Administration

## Abstract
PayTwin is a mobile payments application modelled on India's Unified Payments Interface (UPI) apps. Users can send and receive money with a mobile number, UPI ID or QR code. They can also pay utility bills, recharge phones, and earn cashback rewards. A web-based admin panel gives operators full control over users, balances, transactions, catalog content and app behaviour, and every change reaches users' phones in real time. The system runs on a simulated banking backend, so it can be demonstrated safely without moving real money.

## 1. Objectives
1. Recreate the complete user journey of a modern UPI app: onboarding, bank linking, UPI PIN, payments, history and rewards.
2. Enforce the same rules a real payment system does: PIN verification, sufficient balance, per-transaction and daily limits, and recorded failures.
3. Give administrators a single panel to monitor and control the whole app.
4. Push changes to all connected clients instantly.

## 2. Technology stack
| Layer | Technology | Reason |
|---|---|---|
| Mobile app | React Native 0.88, Expo SDK 58, Expo Router | One JavaScript codebase that runs on Android; file-based navigation |
| Device features | expo-camera (QR), expo-image-picker, expo-haptics, expo-audio, expo-local-authentication | Scanning, profile photos, feedback, sound, biometric app lock |
| Backend | Node.js, Express | Simple and fast REST API |
| Real time | Socket.io | Pushes updates to phones and admin panels |
| Storage | JSON document store with debounced atomic writes | No database install needed; easy to inspect |
| Security | scrypt-hashed UPI PINs and admin passwords, random bearer tokens | Secrets are never stored in plain text |
| Admin panel | HTML, CSS, vanilla JavaScript | Served by the same server; no build step |

## 3. System architecture
```
┌──────────────┐   REST /api/*        ┌──────────────────────┐   REST /api/admin/*   ┌──────────────┐
│ Android app  │ ───────────────────▶ │  Node.js / Express   │ ◀──────────────────── │ Admin panel  │
│ (Expo / RN)  │ ◀─── Socket.io ───── │  business rules      │ ───── Socket.io ────▶ │ (browser)    │
└──────────────┘   refresh / notify   │  data/db.json        │   admin:refresh       └──────────────┘
                                      └──────────────────────┘
```
Each user's socket joins the room `user:<id>`, and admins join `admins`. After any write, the server emits `refresh` to the affected users and `admin:refresh` to admins. Clients then reload only the screens that are open.

## 4. Modules
**Mobile app (30+ screens)**
- *Onboarding:* splash, language, phone, OTP (auto-read), profile + photo, bank discovery, debit-card verification, UPI PIN set and confirm.
- *Home:* banners, quick actions, People and Businesses, bills, offers, money management, floating QR scan button.
- *Payments:* contact, phone and UPI ID search with verified banking name; amount entry with note; account chooser; secure PIN pad; processing, success and failure screens with animation, sound and haptics.
- *QR:* live camera scanner with torch, gallery QR decoding, personal QR in the standard `upi://pay` format.
- *Transfers:* bank account + IFSC transfers, self transfer between own accounts.
- *Bills and recharge:* 8 biller categories with bill fetch; operator detection and plan selection.
- *Rewards:* gesture-based scratch cards, cashback credit, offers, referrals.
- *History:* monthly groups with spend totals, filters, search, detailed receipts, and per-contact chat threads with requests.
- *Account:* balance enquiry, bank account management (primary, change or reset PIN, remove), profile, notifications, support tickets, biometric lock.

**Admin panel (15 pages):** dashboard with charts; user CRUD, block and force logout; balance credit, debit and set; PIN reset; full transaction CRUD with refund and balance reversal; requests; banks; billers; recharge plans; reward campaigns and scratch cards; offers; home banners; broadcast notifications; support tickets; global settings (limits, maintenance mode, feature toggles, home layout); audit log; admin accounts.

## 5. Data model
| Collection | Key fields |
|---|---|
| users | id, name, phone, email, upiId, photo, isMerchant, blocked, referralCode |
| accounts | id, userId, bankId, accountNo, ifsc, balance, primary, linked, pinHash, pinLength |
| transactions | id, upiRef, type, status, from/to user & account, amount, note, failureReason, applied, createdAt |
| requests | fromUserId, toUserId, amount, note, status |
| rewards / campaigns | scratch cards; campaign rules (minAmount, chance, cashback range) |
| banks, billers, operators, plans, offers, banners | admin-managed catalog |
| notifications, tickets, auditLogs, admins, settings | communication and control |

The `applied` flag on each transaction records whether its money has moved. This lets the admin edit, fail, refund or delete a transaction and always reverse exactly the right amount.

## 6. Payment processing rules
1. The payment type must be enabled in settings.
2. The amount must be greater than 0 and within the per-transaction limit.
3. The sender's account must belong to them and be linked.
4. The receiver is resolved by user ID, UPI ID, account number or biller.
5. The PIN is verified against its scrypt hash. Then balance and daily limit are checked. Any failure is recorded as a failed transaction with a reason.
6. On success, the sender is debited and the receiver credited atomically. Any linked request is marked paid, the receiver is notified, and a reward campaign may issue a scratch card.

## 7. Testing
Every API flow was tested end to end with scripted requests. Results:
- P2P payment, wrong PIN (failed with reason), insufficient balance (failed), over limit (rejected).
- Pay request → request marked paid; bill fetch and pay; recharge; self transfer; bank transfer.
- Admin: adding a transaction moves balances; editing the amount re-applies them; setting status to failed reverts them and success re-applies them; refund returns money; delete with revert restores balances. Balances matched expected values at every step.
- Maintenance mode returns `MAINTENANCE` to the app; blocking returns `BLOCKED`; every action is written to the audit log.
- The mobile bundle compiles for Android, ESLint passes, and `expo-doctor` passes 20/20 checks.

## 8. Limitations and future scope
- Banks are simulated. A production system would connect to NPCI through a sponsor bank's UPI switch.
- OTP is shown in-app (demo mode). A real deployment would use an SMS gateway.
- The JSON store suits a demo; PostgreSQL or MongoDB would be used for scale.
- Future work: UPI Lite, AutoPay mandates, split bills, spending analytics, multi-language UI text, and push notifications with Firebase Cloud Messaging.

## 9. Conclusion
PayTwin shows the full lifecycle of a digital payment, from user onboarding to settlement and administration. It uses an architecture that is simple to run and explain, and the real-time link between the admin panel and the mobile app shows how operators of real payment platforms monitor and control their systems.
