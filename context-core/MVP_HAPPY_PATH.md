# MVP HAPPY PATH — What Must Work End-to-End

## The One Path That Makes Money

```
1. User visits iamrunning.online
   ↓
2. Clicks "Build a Website" (Interactive)
   ↓
3. Chooses business type, style, blocks, enters name
   ↓
4. Sees preview of assembled site
   ↓
5. Signs up (or logs in)
   ↓
6. Project saved to their account
   ↓
7. Opens in editor → can customize
   ↓
8. Clicks Deploy → site live on username.iamrunning.online
   ↓
9. Pays for subscription ($199/mo) to keep editing
```

## Current Status of Each Step

| Step | Status | Blocker |
|------|--------|---------|
| 1. Landing with CTA | ✅ Working | Button could be more prominent |
| 2. Interactive wizard | ✅ Working | Visual polish needed |
| 3. 4-step selection | ✅ Working | No thumbnails for blocks |
| 4. Preview | ✅ Working | Component positioning issue |
| 5. Sign up flow | ✅ Working | Anonymous → localStorage → signup |
| 6. Save to account | ✅ Working | Tested with authenticated user |
| 7. Editor customization | ✅ Working | Full Craft.js editor |
| 8. Deploy to subdomain | ✅ Working | SSR, pixel-perfect |
| 9. Payment | ❌ Not built | **Stripe checkout needed** |

## What's Blocking Launch

### Must Have (before any revenue)
- [ ] Stripe checkout for $199 Frontend subscription
- [ ] Trial 3 days (Stripe native)
- [ ] Route protection: /editor requires active subscription
- [ ] Fix interactive component positioning
- [ ] At least 3 more Tron components (TronServices, TronTeam, TronCTA)

### Should Have (first week after launch)
- [ ] Landing page polish (pricing, demo video)
- [ ] Email notifications via Resend (welcome, trial ending)
- [ ] i18n for interactive page (ru/he)
- [ ] Thumbnails for block selection in interactive

### Can Wait (after first revenue)
- [ ] More component families (Elegant, Bold, Soft)
- [ ] Mobile Editor (F02.6)
- [ ] AI Support Chat (F20)
- [ ] Agency plans
- [ ] Hosting subscriptions
- [ ] TronForgotPassword, TronEmailConfirmation
