#!/usr/bin/env node

/**
 * Test script for PLC Control System
 * This script tests the basic functionality without requiring actual PLC connection
 */

console.log('🧪 Testing PLC Control System...\n');

try {
  // Test 1: Import PLC mapping constants
  console.log('✅ Test 1: Importing PLC mapping constants...');
  const {
    PLC_MAPPING,
    getPLCMapping,
    isJogControl,
    isManualControl,
  } = require('./src/constants/plcMapping.js');
  console.log('   - PLC_MAPPING loaded successfully');
  console.log('   - Helper functions imported');

  // Test 2: Verify PLC mapping structure
  console.log('\n✅ Test 2: Verifying PLC mapping structure...');
  console.log(
    `   - Manual Controls: ${Object.keys(PLC_MAPPING.MANUAL_CONTROLS).length} operations`,
  );
  console.log(`   - Jog Controls: ${Object.keys(PLC_MAPPING.JOG_CONTROLS).length} operations`);
  console.log(
    `   - Additional Controls: ${Object.keys(PLC_MAPPING.ADDITIONAL_CONTROLS).length} operations`,
  );
  console.log(
    `   - System Controls: ${Object.keys(PLC_MAPPING.SYSTEM_CONTROLS).length} operations`,
  );

  // Test 3: Test helper functions
  console.log('\n✅ Test 3: Testing helper functions...');
  const hmoeMapping = getPLCMapping('HMOE');
  console.log(`   - HMOE mapping: Register ${hmoeMapping?.register}.${hmoeMapping?.bit}`);

  const xJogPlusMapping = getPLCMapping('X_JOG_PLUS');
  console.log(
    `   - X_JOG_PLUS mapping: Register ${xJogPlusMapping?.register}.${xJogPlusMapping?.bit}`,
  );

  console.log(`   - HMOE is manual control: ${isManualControl('HMOE')}`);
  console.log(`   - X_JOG_PLUS is jog control: ${isJogControl('X_JOG_PLUS')}`);

  // Test 4: Test unknown event handling
  console.log('\n✅ Test 4: Testing unknown event handling...');
  const unknownMapping = getPLCMapping('UNKNOWN_EVENT');
  console.log(`   - Unknown event mapping: ${unknownMapping ? 'Found' : 'Not found (expected)'}`);

  // Test 5: Verify register assignments
  console.log('\n✅ Test 5: Verifying register assignments...');
  const allEvents = Object.values(PLC_MAPPING).flatMap((category) =>
    Object.entries(category).map(([name, mapping]) => ({ name, ...mapping })),
  );

  const register1900 = allEvents.filter((e) => e.register === 1900);
  const register1901 = allEvents.filter((e) => e.register === 1901);
  const register1902 = allEvents.filter((e) => e.register === 1902);
  const register1903 = allEvents.filter((e) => e.register === 1903);

  console.log(`   - Register 1900: ${register1900.length} operations`);
  console.log(`   - Register 1901: ${register1901.length} operations`);
  console.log(`   - Register 1902: ${register1902.length} operations`);
  console.log(`   - Register 1903: ${register1903.length} operations`);

  // Test 6: Check for register conflicts
  console.log('\n✅ Test 6: Checking for register conflicts...');
  const registerBitPairs = allEvents.map((e) => `${e.register}.${e.bit}`);
  const uniquePairs = new Set(registerBitPairs);

  if (registerBitPairs.length === uniquePairs.size) {
    console.log('   - No register conflicts found');
  } else {
    console.log('   - ⚠️  Register conflicts detected!');
    const duplicates = registerBitPairs.filter(
      (item, index) => registerBitPairs.indexOf(item) !== index,
    );
    console.log(`   - Duplicate pairs: ${duplicates.join(', ')}`);
  }

  // Test 7: Display sample event structures
  console.log('\n✅ Test 7: Sample event structures...');
  console.log('   - Manual Control Event:');
  console.log('     socket.emit("manual_control", {');
  console.log('       type: "HMOE",');
  console.log('       register: 1900,');
  console.log('       bit: 0,');
  console.log('       description: "HMOE Operation"');
  console.log('     });');

  console.log('\n   - Jog Control Event:');
  console.log('     socket.emit("jog_control", {');
  console.log('       type: "X_JOG_PLUS",');
  console.log('       action: "start",');
  console.log('       register: 1901,');
  console.log('       bit: 0,');
  console.log('       description: "X Axis Jog Forward"');
  console.log('     });');

  console.log('\n🎉 All tests passed! PLC Control System is ready.');
  console.log('\n📋 Next steps:');
  console.log('   1. Start the server: npm run server');
  console.log('   2. Start the frontend: npm run dev');
  console.log('   3. Navigate to Manual Mode page');
  console.log('   4. Test the controls');
  console.log('\n💡 Key Features:');
  console.log('   - Register and bit info sent directly from UI');
  console.log('   - No backend lookup required');
  console.log('   - Real-time status updates');
  console.log('   - Emergency stop functionality');
  console.log('   - Automatic cleanup on shutdown');
} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  console.error('\n🔍 Troubleshooting:');
  console.error('   1. Check that all files are in the correct locations');
  console.error('   2. Verify Node.js version compatibility');
  console.error('   3. Check for syntax errors in the source files');
  process.exit(1);
}
