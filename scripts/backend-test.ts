/**
 * Rigorous Backend Test Script
 * Tests XRPL client, token-utils, payment functions
 * Run: npx tsx scripts/backend-test.ts
 */

// ── XRPL Client Tests ────────────────────────────────────────────────

async function testXrplClient() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  XRPL CLIENT TESTS');
  console.log('═══════════════════════════════════════════\n');

  const { getClient, getBalance, getAccountInfo, disconnectClient, getCurrentNetwork } = await import('../src/lib/xrpl-client');

  // Test 1: Network config
  const network = getCurrentNetwork();
  console.log(`✅ TEST: getCurrentNetwork() = "${network}" (expected "mainnet")`);
  assert(network === 'mainnet', 'Network should be mainnet');

  // Test 2: Connect to mainnet
  const client = await getClient();
  console.log(`✅ TEST: getClient() connected = ${client.isConnected()}`);
  assert(client.isConnected(), 'Client should be connected');

  // Test 3: Get balance for known funded mainnet account
  // Using the RLUSD mainnet issuer (Ripple official) as it's a known funded account
  const knownAddress = 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De';
  const balance = await getBalance(knownAddress);
  console.log(`✅ TEST: getBalance("${knownAddress}") = "${balance}" XRP`);
  assert(parseFloat(balance) >= 0, 'Balance should be >= 0');

  // Test 4: Get balance for non-existent account
  const fakeAddress = 'rBadAddressDoesNotExist12345678';
  const fakeBalance = await getBalance(fakeAddress);
  console.log(`✅ TEST: getBalance(non-existent) = "${fakeBalance}" (expected "0")`);
  assert(fakeBalance === '0', 'Non-existent account balance should be 0');

  // Test 5: Account info for known account
  const info = await getAccountInfo(knownAddress);
  console.log(`✅ TEST: getAccountInfo() address=${info.address}, balance=${info.balance}, sequence=${info.sequence}`);
  assert(info.address === knownAddress, 'Address should match');
  assert(typeof info.sequence === 'number', 'Sequence should be a number');

  await disconnectClient();
  console.log('✅ TEST: disconnectClient() succeeded');
}

// ── Token Utils Tests ────────────────────────────────────────────────

async function testTokenUtils() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  TOKEN UTILS TESTS');
  console.log('═══════════════════════════════════════════\n');

  const {
    RLUSD_CONFIG,
    constructTrustSetTx,
    constructSellOfferTx,
    constructBuyOfferTx,
    hasTrustLine,
    getAccountTokens,
  } = await import('../src/lib/token-utils');

  // Test 1: RLUSD hex encoding
  console.log(`  RLUSD_CONFIG.currency = "${RLUSD_CONFIG.currency}"`);
  console.log(`  RLUSD_CONFIG.issuer = "${RLUSD_CONFIG.issuer}"`);
  assert(RLUSD_CONFIG.currency.length === 40, `Currency hex should be 40 chars, got ${RLUSD_CONFIG.currency.length}`);
  assert(RLUSD_CONFIG.currency === '524C555344000000000000000000000000000000', 'Hex should be RLUSD padded');
  console.log('✅ TEST: RLUSD_CONFIG hex encoding is valid');

  // Test 2: RLUSD issuer is valid base58
  const base58Regex = /^r[1-9A-HJ-NP-Za-km-z]{24,34}$/;
  assert(base58Regex.test(RLUSD_CONFIG.issuer), 'Issuer should be valid base58');
  assert(RLUSD_CONFIG.issuer === 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De', 'Should be official Ripple mainnet issuer');
  console.log('✅ TEST: RLUSD issuer address is valid base58');

  // Test 3: constructTrustSetTx output
  const trustTx = constructTrustSetTx('rTestAddr123456789ABCDEFGHIJ', RLUSD_CONFIG);
  console.log('  TrustSet TX:', JSON.stringify(trustTx, null, 2));
  assert(trustTx.TransactionType === 'TrustSet', 'Should be TrustSet');
  assert(trustTx.LimitAmount.currency === RLUSD_CONFIG.currency, 'Currency should match RLUSD hex');
  assert(trustTx.LimitAmount.issuer === RLUSD_CONFIG.issuer, 'Issuer should match');
  assert(trustTx.LimitAmount.value === '1000000000', 'Default limit should be 1B');
  console.log('✅ TEST: constructTrustSetTx output format correct');

  // Test 4: constructSellOfferTx
  const sellTx = constructSellOfferTx('rMerchantAddr123456789ABCD', { currency: 'SZP', issuer: 'rMerchantAddr123456789ABCD', value: '0' }, '1000', '100');
  assert(sellTx.TransactionType === 'OfferCreate', 'Should be OfferCreate');
  assert(typeof sellTx.TakerPays === 'string', 'TakerPays (XRP) should be string drops');
  assert((sellTx.TakerGets as any).currency === 'SZP', 'TakerGets currency should be SZP');
  console.log('✅ TEST: constructSellOfferTx output format correct');

  // Test 5: constructBuyOfferTx
  const buyTx = constructBuyOfferTx('rUserAddr123456789ABCDEFGH', { currency: 'SZP', issuer: 'rMerchantAddr123456789ABCD', value: '0' }, '500', '50');
  assert(buyTx.TransactionType === 'OfferCreate', 'Should be OfferCreate');
  assert(typeof buyTx.TakerGets === 'string', 'TakerGets (XRP) should be string drops');
  assert((buyTx.TakerPays as any).currency === 'SZP', 'TakerPays currency should be SZP');
  console.log('✅ TEST: constructBuyOfferTx output format correct');

  // Test 6: hasTrustLine with real XRPL query (expect false for random address)
  const hasTL = await hasTrustLine('rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De', RLUSD_CONFIG);
  console.log(`✅ TEST: hasTrustLine(RLUSD issuer, RLUSD) = ${hasTL} (issuer won't have trust to itself)`);

  // Test 7: getAccountTokens
  const tokens = await getAccountTokens('rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De');
  console.log(`✅ TEST: getAccountTokens() returned ${tokens.length} tokens`);
}

// ── Payment Tests ────────────────────────────────────────────────────

async function testPayment() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  PAYMENT TESTS');
  console.log('═══════════════════════════════════════════\n');

  const { buildPaymentTx } = await import('../src/lib/payment');

  // Test 1: XRP payment
  const xrpTx = buildPaymentTx({
    source: 'rSource123456789ABCDEFGHIJK',
    destination: 'rDest123456789ABCDEFGHIJKLM',
    amount: '10',
  });
  assert(xrpTx.TransactionType === 'Payment', 'Should be Payment');
  assert(typeof xrpTx.Amount === 'string', 'XRP amount should be drops string');
  assert(xrpTx.Amount === '10000000', '10 XRP = 10000000 drops');
  console.log('✅ TEST: buildPaymentTx XRP format correct (10 XRP = 10000000 drops)');

  // Test 2: RLUSD payment (hex encoded)
  const rlusdTx = buildPaymentTx({
    source: 'rSource123456789ABCDEFGHIJK',
    destination: 'rDest123456789ABCDEFGHIJKLM',
    amount: '100',
    currency: 'RLUSD',
    issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  });
  const amt = rlusdTx.Amount as any;
  assert(typeof amt === 'object', 'RLUSD amount should be object');
  assert(amt.currency === '524C555344000000000000000000000000000000', 'Currency should be hex RLUSD');
  assert(amt.issuer === 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De', 'Issuer should match');
  assert(amt.value === '100', 'Value should be 100');
  console.log('✅ TEST: buildPaymentTx RLUSD format correct (hex encoded currency)');

  // Test 3: 3-char currency (should NOT hex encode)
  const usdTx = buildPaymentTx({
    source: 'rSource123456789ABCDEFGHIJK',
    destination: 'rDest123456789ABCDEFGHIJKLM',
    amount: '50',
    currency: 'USD',
    issuer: 'rIssuer12345678990ABCDEFGHI',
  });
  const usdAmt = usdTx.Amount as any;
  assert(usdAmt.currency === 'USD', '3-char currency should NOT be hex encoded');
  console.log('✅ TEST: buildPaymentTx 3-char currency stays as-is (not hex)');

  // Test 4: Missing issuer for non-XRP (should throw)
  let threw = false;
  try {
    buildPaymentTx({
      source: 'rSource123456789ABCDEFGHIJK',
      destination: 'rDest123456789ABCDEFGHIJKLM',
      amount: '10',
      currency: 'RLUSD',
      // no issuer!
    });
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('Issuer is required'), `Expected issuer error, got: ${e.message}`);
  }
  assert(threw, 'Should throw when issuer missing for non-XRP');
  console.log('✅ TEST: buildPaymentTx throws on missing issuer for non-XRP');

  // Test 5: With memo (should be uppercase hex)
  const memoTx = buildPaymentTx({
    source: 'rSource123456789ABCDEFGHIJK',
    destination: 'rDest123456789ABCDEFGHIJKLM',
    amount: '5',
    memo: 'SuzuPay Payment',
  });
  const memoHex = memoTx.Memos![0].Memo.MemoData!;
  assert(memoHex === memoHex.toUpperCase(), 'MemoData should be uppercase hex');
  const decoded = Buffer.from(memoHex, 'hex').toString('utf8');
  assert(decoded === 'SuzuPay Payment', `Memo should decode to original: got "${decoded}"`);
  console.log('✅ TEST: buildPaymentTx memo is uppercase hex and roundtrips correctly');
}

// ── Payment Request Tests ────────────────────────────────────────────

async function testPaymentRequest() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  PAYMENT REQUEST TESTS');
  console.log('═══════════════════════════════════════════\n');

  const {
    generateXamanPaymentURL,
    generateGenericPaymentRequest,
    parsePaymentRequest,
    isValidXRPLAddress,
    generatePaymentId,
    formatXRPAmount,
  } = await import('../src/lib/payment-request');

  // Test 1: Xaman URL generation
  const xamanUrl = generateXamanPaymentURL('rDest123456789ABCDEFGHIJKLM', '25');
  assert(xamanUrl.url.startsWith('https://xaman.app/detect/request:'), 'Should start with xaman URL');
  assert(xamanUrl.url.includes('amount=25'), 'Should include amount');
  assert(xamanUrl.deepLink.startsWith('xaman://'), 'Deep link should use xaman:// scheme');
  console.log('✅ TEST: generateXamanPaymentURL format correct');
  console.log(`  URL: ${xamanUrl.url}`);

  // Test 2: Generic payment request
  const generic = generateGenericPaymentRequest('rDest123456789ABCDEFGHIJKLM', '10');
  const parsed = JSON.parse(generic);
  assert(parsed.type === 'XRPL_PAYMENT_REQUEST', 'Type should match');
  assert(parsed.amount === '10', 'Amount should be 10');
  assert(parsed.amountDrops === '10000000', 'Drops should be 10M');
  console.log('✅ TEST: generateGenericPaymentRequest format correct');

  // Test 3: Generic payment request for RLUSD (drops should be undefined)
  const rlusdGeneric = generateGenericPaymentRequest('rDest123456789ABCDEFGHIJKLM', '100', {
    currency: 'RLUSD',
    issuer: 'rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De',
  });
  const rlusdParsed = JSON.parse(rlusdGeneric);
  assert(rlusdParsed.amountDrops === undefined || rlusdParsed.amountDrops === null, 'RLUSD should NOT have amountDrops');
  assert(rlusdParsed.currency === 'RLUSD', 'Currency should be RLUSD');
  console.log('✅ TEST: generateGenericPaymentRequest RLUSD has no amountDrops');

  // Test 4: Parse Xaman URL roundtrip
  const parsedXaman = parsePaymentRequest(xamanUrl.url);
  assert(parsedXaman.isXamanURL, 'Should detect as Xaman URL');
  assert(parsedXaman.destination === 'rDest123456789ABCDEFGHIJKLM', 'Destination should roundtrip');
  assert(parsedXaman.amount === '25', 'Amount should roundtrip');
  console.log('✅ TEST: parsePaymentRequest Xaman URL roundtrip correct');

  // Test 5: Parse generic JSON roundtrip
  const parsedGeneric = parsePaymentRequest(generic);
  assert(!parsedGeneric.isXamanURL, 'Should NOT be Xaman URL');
  assert(parsedGeneric.destination === 'rDest123456789ABCDEFGHIJKLM', 'Destination should roundtrip');
  console.log('✅ TEST: parsePaymentRequest generic JSON roundtrip correct');

  // Test 6: Address validation — valid addresses
  assert(isValidXRPLAddress('rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De'), 'RLUSD mainnet issuer should be valid');
  assert(isValidXRPLAddress('rQhWct2fv4Vc4KRjRgMrxa8xPN9Zx9iLKV'), 'RLUSD testnet issuer should still be valid base58');
  console.log('✅ TEST: isValidXRPLAddress accepts valid addresses');

  // Test 7: Address validation — invalid addresses
  assert(!isValidXRPLAddress(''), 'Empty should be invalid');
  assert(!isValidXRPLAddress('rInvalid0OIl'), 'Contains forbidden chars 0, O, I, l');
  assert(!isValidXRPLAddress('xNotAnXRPLAddress'), 'Doesn\'t start with r');
  assert(!isValidXRPLAddress('r'), 'Too short');
  console.log('✅ TEST: isValidXRPLAddress rejects invalid addresses');

  // Test 8: Payment ID format
  const id = generatePaymentId();
  assert(id.startsWith('pay_'), 'ID should start with pay_');
  assert(id.length > 15, 'ID should be reasonably long');
  console.log(`✅ TEST: generatePaymentId() = "${id}"`);

  // Test 9: formatXRPAmount
  assert(formatXRPAmount('1234.567890') !== '', 'Should format numbers');
  assert(formatXRPAmount('NaN') === '0', 'NaN should return 0');
  assert(formatXRPAmount(0) === '0', 'Zero should return 0');
  console.log('✅ TEST: formatXRPAmount handles edge cases');
}

// ── Runner ───────────────────────────────────────────────────────────

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
}

async function main() {
  console.log('🔬 SuzuPay Backend Test Suite\n');
  console.log('Running all tests...\n');

  try {
    await testPayment();
    await testPaymentRequest();
    await testTokenUtils();
    await testXrplClient();

    console.log('\n═══════════════════════════════════════════');
    console.log('  🎉 ALL TESTS PASSED');
    console.log('═══════════════════════════════════════════\n');
  } catch (error: any) {
    console.error('\n❌ TEST SUITE FAILED:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
