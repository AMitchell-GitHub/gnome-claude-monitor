/* blocks.js — pure ccusage-style 5-hour rolling-window math. No I/O, no GTK.
 *
 * The 5-hour reset time is NOT stored anywhere by Claude Code, so we reconstruct
 * it from assistant-message timestamps the same way `ccusage blocks` does:
 *   - sort all usage entries by timestamp ascending
 *   - a "block" starts at its first message
 *   - a new block begins when a message arrives >= WINDOW after the block start,
 *     OR >= WINDOW after the previous message (an inactivity gap)
 *   - the active block's reset time = blockStart + WINDOW
 *
 * These functions are deliberately dependency-free so they can be unit-tested with
 * plain `gjs -m test/blocks-test.js`.
 */

export const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;

/** Sum the token fields of a Claude `message.usage` object. */
export function sumTokens(usage, countCache = true) {
    if (!usage)
        return 0;
    let t = (usage.input_tokens || 0) + (usage.output_tokens || 0);
    if (countCache)
        t += (usage.cache_read_input_tokens || 0) + (usage.cache_creation_input_tokens || 0);
    return t;
}

/**
 * Group sorted entries into rolling-window blocks.
 * @param {Array<{ts:number, tokens:number}>} entries sorted ascending by ts (ms epoch)
 * @returns {Array<{start:number, end:number, tokens:number}>}
 */
export function computeBlocks(entries, windowMs = FIVE_HOURS_MS) {
    const blocks = [];
    let cur = null;
    for (const e of entries) {
        if (cur === null) {
            cur = { start: e.ts, end: e.ts, tokens: e.tokens };
            blocks.push(cur);
            continue;
        }
        const sinceStart = e.ts - cur.start;
        const sinceLast = e.ts - cur.end;
        if (sinceStart >= windowMs || sinceLast >= windowMs) {
            cur = { start: e.ts, end: e.ts, tokens: e.tokens };
            blocks.push(cur);
        } else {
            cur.end = e.ts;
            cur.tokens += e.tokens;
        }
    }
    return blocks;
}

/**
 * Return the currently-active block, or null if the last block's window has elapsed.
 * @returns {{tokensUsed:number, resetAt:number, startedAt:number}|null}
 */
export function activeBlock(blocks, now, windowMs = FIVE_HOURS_MS) {
    if (!blocks.length)
        return null;
    const last = blocks[blocks.length - 1];
    const withinWindow = (now - last.start) < windowMs;
    const recentlyActive = (now - last.end) < windowMs;
    if (withinWindow && recentlyActive) {
        return {
            tokensUsed: last.tokens,
            resetAt: last.start + windowMs,
            startedAt: last.start,
        };
    }
    return null;
}
