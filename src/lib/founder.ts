// Founder-only treatment. Rahul's account gets: comments bubbled to the top
// with founder styling, an infinity d-coin balance, exclusion from the
// champions tally, and a content-free profile (bio only).

export const FOUNDER_USER_ID = '890394fe-4ad9-4513-82c1-415ef270542e';

export function isFounder(userId: string | null | undefined): boolean {
  return userId === FOUNDER_USER_ID;
}
