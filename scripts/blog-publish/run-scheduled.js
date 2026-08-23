// Run daily via Windows Task Scheduler. Checks schedule.json for the earliest
// "scheduled" entry whose date has arrived, publishes it, and marks it done.
// Safe to run more than once a day — a second run the same day is a no-op
// once the entry's status flips to "published".

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SCHEDULE_PATH = path.join(__dirname, 'schedule.json');
const RUNNER_LOG_PATH = path.join(__dirname, 'runner-log.txt');
const PUBLISH_SCRIPT = path.join(__dirname, 'publish-post.js');

function log(line) {
  const stamped = `[${new Date().toISOString()}] ${line}`;
  console.log(stamped);
  fs.appendFileSync(RUNNER_LOG_PATH, stamped + '\n');
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const schedule = JSON.parse(fs.readFileSync(SCHEDULE_PATH, 'utf8'));
  const today = todayISO();

  const due = schedule
    .filter(e => e.status === 'scheduled' && e.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (due.length === 0) {
    log(`No post due (today: ${today}). Nothing to do.`);
    return;
  }

  const entry = due[0];
  if (due.length > 1) {
    log(`WARNING: ${due.length} posts are overdue — publishing the oldest (${entry.slug}) only. Check schedule.json.`);
  }

  log(`Publishing "${entry.title}" (${entry.slug}), scheduled for ${entry.date}...`);

  const args = [PUBLISH_SCRIPT, entry.slug, entry.altText];
  if (entry.featured) args.push('--featured');

  try {
    const output = execFileSync('node', args, { encoding: 'utf8' });
    log(output.trim());
    entry.status = 'published';
    entry.publishedAt = new Date().toISOString();
    fs.writeFileSync(SCHEDULE_PATH, JSON.stringify(schedule, null, 2));
    log(`Marked "${entry.slug}" as published in schedule.json.`);
  } catch (e) {
    log(`FAILED to publish "${entry.slug}": ${e.message}`);
    log(e.stdout ? e.stdout.toString() : '');
    log(e.stderr ? e.stderr.toString() : '');
    process.exitCode = 1;
  }
}

main();
