/**
 * verify + the contrast audit, with the production server managed here.
 *
 * WHY THIS IS A SCRIPT AND NOT A LINE IN package.json
 *
 * `check:contrast` needs a real production server on :4000, because it
 * measures PAINTED pixels: it renders the page, clicks through every
 * theme in the lab, and reads the computed colour of every text node
 * against whatever is actually behind it. That is the only way to catch
 * the class of bug where a token pairs with the wrong surface and the
 * result is invisible text. A build cannot see it and neither can a
 * human reading the CSS.
 *
 * Needing a server is why it was left out of `verify`. The cost of that
 * was a guard nobody ran, and it drifted: its selectors went stale when
 * the lab markup was renamed, so it silently measured ZERO themes and
 * printed "clean" for however long. Fifteen genuine failures were
 * waiting behind that green tick.
 *
 * So: this starts the server, waits for it to actually answer, runs the
 * audit, and shuts the server down again whatever happens.
 *
 * Run before any deploy. `npm run verify` remains the fast inner loop.
 */
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const PORT = 4000;
const URL = `http://localhost:${PORT}/`;

function run(cmd, args, opts = {}) {
    const child = spawn(cmd, args, { stdio: 'inherit', shell: false, ...opts });
    return new Promise((resolve, reject) => {
        child.on('exit', (code) => (code === 0 ? resolve() : reject(
            new Error(`${cmd} ${args.join(' ')} exited ${code}`),
        )));
        child.on('error', reject);
    });
}

async function waitFor(url, tries = 40) {
    for (let i = 0; i < tries; i += 1) {
        try {
            const res = await fetch(url);
            if (res.ok) return true;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    return false;
}

let server;
try {
    /* verify runs the build, so the .next the server serves is current. */
    await run('npm', ['run', 'verify']);

    server = spawn('npm', ['run', 'start'], { stdio: 'ignore', detached: false });

    if (!await waitFor(URL)) {
        throw new Error(`server never answered on ${URL}`);
    }

    await run('npm', ['run', 'check:contrast']);
    /* Budgets checked against the live render, same reason as contrast:
       reading the served HTML is the only measurement that counts. */
    await run('npm', ['run', 'check:demo-weight']);
    console.log('\nverify:full - all guards green, contrast measured against a live render.');
} finally {
    if (server && !server.killed) {
        server.kill('SIGTERM');
        /* Give it a moment to release the port, so a second run does not
           hit EADDRINUSE against its own leftovers. */
        await Promise.race([once(server, 'exit'), new Promise((r) => setTimeout(r, 3000))]);
    }
}
