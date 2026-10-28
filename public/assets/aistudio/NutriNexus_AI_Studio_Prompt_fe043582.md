# NutriNexus: Google AI Studio Build Prompt

Paste this into Google AI Studio (Build mode). For best results, send it in stages (see "Build Order" at the bottom) rather than all at once.

---

## Role

Act as an expert full-stack developer (React + TypeScript front end, Node/Express back end, Firebase) building a **nutrition and health companion web app** called **NutriNexus**. Use the Gemini API for food image analysis and short personalised tips. Keep all API keys on the server; never expose them in client code.

## Architecture

- **Front end:** React + TypeScript, mobile-first, clean and accessible UI.
- **Back end:** Express server (`server.ts`) that holds the Gemini API key, runs scheduled jobs, and sends notifications.
- **Database and auth:** Firebase Auth + Firestore (users must sign in; each user can only read and write their own data).
- **Notifications:** Web Push / Firebase Cloud Messaging for reminders; email and SMS/WhatsApp (for example Twilio) for family alerts, sent from the server.

---

## Feature 1: Profile Setup and Health Calculations

Create an onboarding form collecting:

- Name, age, sex, weight (kg), height (cm), activity level
- Email and contact number
- Previous health record: conditions (for example diabetes, hypertension), current medications, allergies, latest HbA1c / fasting glucose (optional)

Compute these in code (do **not** use Gemini for the math):

- **BMI** = weight (kg) / height (m)²
- **BMR (Mifflin-St Jeor):** 10 × kg + 6.25 × cm − 5 × age + 5 (male) or − 161 (female)
- **TDEE** = BMR × activity factor
  - Sedentary 1.2, Light 1.375, Moderate 1.55, Very active 1.725, Extra active 1.9

Show BMI category, BMR, and TDEE on a profile summary card. Let users edit and re-calculate any time. Derive daily targets (calories, carbs, protein, fat, fibre, sugar) from TDEE, and lower the carb and sugar targets if the user lists diabetes or pre-diabetes.

## Feature 2: Food Scan with Glycemic Impact Estimate

- Let the user take a photo or upload an image of a meal.
- Send the image to Gemini from the **server** and require **structured JSON output** matching this schema:

```json
{
  "foods": [
    {
      "name": "",
      "portion_g": 0,
      "calories": 0,
      "carbs_g": 0,
      "fiber_g": 0,
      "sugar_g": 0,
      "protein_g": 0,
      "fat_g": 0,
      "estimated_gi": 0
    }
  ],
  "glycemic_load": 0,
  "glycemic_impact": "low | medium | high",
  "confidence": 0.0,
  "notes": ""
}
```

- Glycemic load per food = GI × carbs (g) / 100. Impact bands: **low** ≤ 10, **medium** 11 to 19, **high** ≥ 20.
- Show the results in a readable card, display the confidence level, and let the user **edit food names and portion sizes** and re-calculate.
- Always label results as **estimates, not medical advice**.
- Save every confirmed scan to Firestore as a meal log entry with a timestamp.

## Feature 3: Nutrition Score

After each confirmed meal, compute a **0 to 100 score** and a **daily running score** by comparing intake with the user's daily targets:

| Component | Weight |
|---|---|
| Calorie fit vs. TDEE-based target | 30% |
| Glycemic load | 30% |
| Fibre and protein adequacy | 20% |
| Sugar and sodium limits | 20% |

- Show the score with a colour indicator (red / amber / green) and a progress bar for each nutrient against its target.
- Ask Gemini for **one short, practical tip** based on that meal (for example a swap or portion suggestion).
- Provide a daily and weekly history chart.

## Feature 4: Rewards

- Maintain a **points ledger** in Firestore: `userId, points, reason, timestamp`.
- Award points for: logging a meal, a low glycemic load meal, a daily score above a threshold, taking medication on time, and consecutive-day streaks.
- Define reward tiers (badges and levels, optionally vouchers) that unlock at point thresholds, with a progress bar to the next reward.
- Calculate and write points **on the server only**, so users cannot edit them from the browser.

## Feature 5: Reminders (Medication and Doctor Visits)

- Let users create reminders: `{ type: "medication" | "appointment" | "other", title, notes, date/time, repeat rule, status }`.
- Medication reminders support multiple daily times and repeats; appointment reminders support a lead time (for example 1 day and 1 hour before).
- Deliver through Web Push (service worker) and in-app alerts. A server-side scheduled job (cron or Cloud Scheduler) checks due reminders every minute.
- Let the user mark each reminder **Taken / Done / Snooze / Skip**, and log the response.

## Feature 6: Family Companion Notifications

- Let the user add one or more **companions** (name, relationship, phone number, email).
- The companion must **confirm consent** through a verification link or code before receiving anything.
- If a medication or appointment reminder is not acknowledged within a grace period (default 30 minutes, user adjustable), the server notifies the companion by SMS/WhatsApp and/or email, for example: "[User] has not confirmed their [medication] at [time]."
- Let the user control what is shared (for example reminders only, or also high-glycemic meal alerts) and revoke a companion at any time.

---

## Data Model (Firestore)

- `users/{uid}`: profile, calculated metrics (BMI, BMR, TDEE), targets
- `users/{uid}/healthRecord`: conditions, medications, allergies, lab values
- `users/{uid}/meals/{mealId}`: scan results, edits, score, timestamp
- `users/{uid}/points/{entryId}`: ledger entries
- `users/{uid}/rewards/{rewardId}`: unlocked rewards
- `users/{uid}/reminders/{reminderId}`: reminder definitions and status
- `users/{uid}/reminderLogs/{logId}`: taken / missed / snoozed history
- `users/{uid}/companions/{companionId}`: contact details, consent status, sharing settings

Add Firestore security rules so users can only access their own documents.

## Security, Privacy, and Safety Requirements

- Gemini API key and messaging credentials live in server environment variables only.
- Treat all data as sensitive health data: encrypt in transit, restrict access per user, collect explicit consent at sign-up, and allow data export and deletion.
- Validate and sanitise all inputs on the server; rate-limit the scan endpoint.
- Show a visible disclaimer: *"NutriNexus provides general estimates and wellness guidance, not medical advice. Consult your doctor for medical decisions."*
- The app must never advise changing or stopping medication.

## UI and UX Guidelines

- Mobile-first, large tap targets, high contrast, simple language.
- Bottom navigation: **Home, Scan, Meals, Reminders, Rewards, Profile**.
- Home dashboard: today's nutrition score, calories vs. target, next reminder, points and progress to next reward.
- Handle loading, empty, and error states gracefully (for example camera denied, scan failed, offline).

---

## Build Order (send in stages)

1. **Stage 1:** Auth, onboarding form, profile, BMI / BMR / TDEE and targets.
2. **Stage 2:** Food scan endpoint with Gemini JSON schema, results card, edit and confirm, meal log.
3. **Stage 3:** Nutrition score, tips, daily and weekly charts.
4. **Stage 4:** Reminders (in-app, then Web Push and scheduled job).
5. **Stage 5:** Companion consent flow and missed-reminder alerts.
6. **Stage 6:** Points ledger, tiers, and rewards screen.
7. **Stage 7:** Security rules, privacy settings, disclaimers, polish and testing.

## Starter Message for Stage 1

> Build Stage 1 of NutriNexus: a mobile-first React + TypeScript app with Firebase Auth and an onboarding form (name, age, sex, weight, height, activity level, email, contact number, and health record fields). Calculate BMI, BMR (Mifflin-St Jeor), and TDEE in code, show them on a profile summary card, and derive daily calorie, carb, protein, fat, fibre, and sugar targets, lowering carb and sugar targets for users who list diabetes or pre-diabetes. Store everything in Firestore under `users/{uid}` with security rules limiting access to the owner.
