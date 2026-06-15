#!/usr/bin/env gjs -m
// Smoke test for the pure block math. Run: gjs -m test/blocks-test.js
import { sumTokens, computeBlocks, activeBlock, FIVE_HOURS_MS } from '../claude-usage@aidan.local/blocks.js';

let failures = 0;
function check(name, cond) {
    if (cond) {
        print(`  ok   ${name}`);
    } else {
        print(`  FAIL ${name}`);
        failures++;
    }
}

const H = 60 * 60 * 1000;
const base = 1_000_000_000_000; // arbitrary ms epoch

// sumTokens
check('sumTokens with cache',
    sumTokens({ input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 2, cache_creation_input_tokens: 3 }, true) === 20);
check('sumTokens without cache',
    sumTokens({ input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 2, cache_creation_input_tokens: 3 }, false) === 15);
check('sumTokens null', sumTokens(null) === 0);

// computeBlocks: messages within 5h coalesce into one block
const close = [
    { ts: base, tokens: 100 },
    { ts: base + 1 * H, tokens: 200 },
    { ts: base + 2 * H, tokens: 300 },
];
let blocks = computeBlocks(close);
check('close messages -> 1 block', blocks.length === 1);
check('block token sum', blocks[0].tokens === 600);

// a >5h gap starts a new block
const gapped = [
    { ts: base, tokens: 100 },
    { ts: base + 6 * H, tokens: 50 },
];
blocks = computeBlocks(gapped);
check('inactivity gap -> 2 blocks', blocks.length === 2);

// a long continuous run > 5h from start opens a new block
const long = [
    { ts: base, tokens: 1 },
    { ts: base + 4 * H, tokens: 1 },
    { ts: base + 5 * H, tokens: 1 }, // >= window from start -> new block
];
blocks = computeBlocks(long);
check('5h-from-start -> new block', blocks.length === 2);

// activeBlock: reset time + active detection
blocks = computeBlocks(close);
const now = base + 2 * H + 10 * 60 * 1000; // 10 min after last msg
const ab = activeBlock(blocks, now);
check('active block found', ab !== null);
check('reset = start + 5h', ab.resetAt === base + FIVE_HOURS_MS);
check('active tokens', ab.tokensUsed === 600);

// elapsed window -> no active block
const later = base + 6 * H;
check('elapsed window -> inactive', activeBlock(blocks, later) === null);

print('');
print(failures === 0 ? 'ALL TESTS PASSED' : `${failures} TEST(S) FAILED`);
if (failures > 0)
    imports.system.exit(1);
