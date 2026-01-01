<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DivvyUp

## The Mission

To make "going Dutch" effortless and transparent, ensuring friends spend more time making memories and less time doing math.

## What It Does

- **Instant Group Rooms**: Create a "Trip" (e.g., "Tokyo 2025") and get a unique URL to text to your friends. No apps to download, no passwords to remember.
- **One-Tap Participation**: Join by simply entering a nickname. The app uses browser sessions (LocalStorage) to remember who you are when you return.
- **Flexible Equal Splitting**: Add an expense, select who was involved (e.g., "Dinner - only Alice, Bob, and Charlie"), and the app instantly calculates the split.
- **Live Balance Board**: A real-time "Who Owes Whom" dashboard that simplifies complex webs of debt into the minimum number of transactions needed to get everyone even.
- **Payer Tracking**: Clearly track who put their card down for which bill, keeping a digital paper trail that replaces piles of physical receipts.

## Who It’s For

- **Travelers**: Friends on a multi-day trip paying for different meals, tickets, and transport.
- **Roommates**: Managing shared household supplies or one-off utility bills.

---

## Run Locally

**Prerequisites:** Node.js

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment Setup:**
   Create a `.env` file in the root directory and add your Supabase credentials:

   ```text
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Setup:**
   Execute the `supabase_schema.sql` file in your Supabase SQL Editor.

4. **Run the app:**
   ```bash
   npm run dev
   ```
