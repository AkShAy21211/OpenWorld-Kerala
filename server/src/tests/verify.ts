import { dataStore } from '../store/dataStore.js';

async function runTests() {
  console.log('🧪 Starting Fair Backend & Logic Verification Tests...');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // Test 1: Create Guest User with Session ID
    const sessionId1 = 'test-session-uuid-1';
    const user1 = await dataStore.createGuestUser(sessionId1, 'Aromal', '#E11D48');
    assert(user1.displayName === 'Aromal', 'Guest user displayName set properly');
    assert(user1.avatarColor === '#E11D48', 'Guest user avatarColor set properly');

    const initialPoints = await dataStore.getWalletPoints(user1.id);
    assert(initialPoints === 20, `New visitor starts with 20 welcome points (got ${initialPoints})`);

    // Test 2: Shop Catalog
    const items = await dataStore.getCosmeticItems();
    assert(items.length === 3, `Shop contains 3 cosmetic items (got ${items.length})`);
    const mundu = items.find(i => i.id === 'mundu-kasavu');
    assert(!!mundu && mundu.price === 20, 'Kasavu Mundu is in catalog for 20 points');

    // Test 3: Purchasing an Item
    const buyResult = await dataStore.purchaseItem(user1.id, 'mundu-kasavu');
    assert(buyResult.success === true, 'Successfully purchased Kasavu Mundu with 20 points');
    const pointsAfterBuy = await dataStore.getWalletPoints(user1.id);
    assert(pointsAfterBuy === 0, `Wallet points correctly deducted to 0 (got ${pointsAfterBuy})`);

    // Test 4: Insufficient Funds Prevention
    const buyFail = await dataStore.purchaseItem(user1.id, 'chenda-drum');
    assert(buyFail.success === false, 'Cannot purchase Chenda drum (35 pts) with 0 points');

    // Test 5: Daily Food Card Claim
    const rewardStatusBefore = await dataStore.getDailyRewardStatus(user1.id);
    assert(rewardStatusBefore.hasClaimedToday === false, 'Reward not claimed yet today');

    const claimRes = await dataStore.claimDailyReward(user1.id);
    assert(claimRes.success === true, 'Successfully claimed today\'s Kerala Food Card');
    assert(claimRes.pointsAwarded === 10, 'Daily food card awarded +10 points');
    const pointsAfterDaily = await dataStore.getWalletPoints(user1.id);
    assert(pointsAfterDaily === 10, `Wallet has 10 points after daily claim (got ${pointsAfterDaily})`);

    // Test 6: Idempotency (Cannot claim daily food card twice on same day)
    const claimRes2 = await dataStore.claimDailyReward(user1.id);
    assert(claimRes2.success === false, 'Prevented duplicate daily claim on the same calendar day');

    // Test 7: Swing Timing Ride - Scored Attempts & Limits (3 scored attempts)
    const rideStatus1 = await dataStore.getRideStatus(user1.id);
    assert(rideStatus1.todayScoredAttempts === 0, '0 scored attempts initially');
    assert(rideStatus1.canEarnPoints === true, 'User is eligible to earn points from ride');

    // Attempt 1: Perfect timing
    const score1 = await dataStore.submitRideScore(user1.id, 96, 'perfect');
    assert(score1.attemptType === 'scored' && score1.pointsAwarded === 10, 'Attempt 1 scored: +10 pts for perfect timing');

    // Attempt 2: Good timing
    const score2 = await dataStore.submitRideScore(user1.id, 75, 'good');
    assert(score2.attemptType === 'scored' && score2.pointsAwarded === 5, 'Attempt 2 scored: +5 pts for good timing');

    // Attempt 3: Miss timing
    const score3 = await dataStore.submitRideScore(user1.id, 30, 'miss');
    assert(score3.attemptType === 'scored' && score3.pointsAwarded === 1, 'Attempt 3 scored: +1 pt for miss');

    // Attempt 4: Should switch to practice mode (0 points awarded)
    const score4 = await dataStore.submitRideScore(user1.id, 98, 'perfect');
    assert(score4.attemptType === 'practice', 'Attempt 4 switched to practice mode after 3 daily scored attempts');
    assert(score4.pointsAwarded === 0, 'No points awarded during practice mode');

    // Test 8: Daily Leaderboard
    const leaderboard = await dataStore.getDailyLeaderboard();
    assert(leaderboard.length > 0, 'Leaderboard contains recorded high scores');
    assert(leaderboard[0].score >= 96, `Top score is correctly ranked (score: ${leaderboard[0].score})`);

    // Test 9: Guestbook signing & Malayalam text support
    const gb = await dataStore.addGuestbookEntry(user1.id, 'ചിങ്ങം ആശംസകൾ! (Greetings for Chingam!)');
    assert(gb.message.includes('ചിങ്ങം ആശംസകൾ!'), 'Guestbook supports Malayalam UTF-8 unicode text');
    const gbList = await dataStore.getGuestbookEntries(5);
    assert(gbList.some(e => e.id === gb.id), 'New guestbook entry is in the public list');

    // Test 10: Pookkalam design creation & points reward
    const pookkalam = await dataStore.savePookkalam(
      user1.id,
      'My Onam Carpet',
      ['#F59E0B', '#EF4444', '#10B981', '#FDFBF7'],
      'lotus',
      'Celebrating together'
    );
    assert(pookkalam.title === 'My Onam Carpet', 'Pookkalam created with title');
    const pList = await dataStore.getPookkalams(5);
    assert(pList.some(p => p.id === pookkalam.id), 'Pookkalam is in community gallery');

    // Test 11: Live Visitors presence
    const live = await dataStore.getLiveVisitors(new Set([user1.id]));
    const onlineUser = live.find(v => v.userId === user1.id);
    assert(onlineUser?.isOnline === true, 'User correctly marked online in presence registry');

  } catch (error) {
    console.error('Unhandled error during verification test:', error);
    failed++;
  }

  console.log(`\n📊 Verification Summary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎉 All core business logic and persistence tests PASSED!\n');
  }
}

runTests();
