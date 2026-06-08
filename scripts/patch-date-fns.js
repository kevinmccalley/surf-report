// Turbopack enforces the exports map strictly, blocking internal relative
// imports like date-fns/format.js → ./_lib/defaultLocale.js even though
// those files exist on disk. This script adds the missing _lib/* wildcard
// to date-fns/package.json after npm install so Turbopack can resolve them.
const fs = require('fs')
const path = require('path')

const pkgPath = path.resolve(__dirname, '../node_modules/date-fns/package.json')

if (!fs.existsSync(pkgPath)) {
  console.log('[patch-date-fns] date-fns not installed yet, skipping')
  process.exit(0)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

if (pkg.exports && !pkg.exports['./_lib/*']) {
  pkg.exports['./_lib/*'] = {
    import: './_lib/*.js',
    require: './_lib/*.cjs',
    default: './_lib/*.js',
  }
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2))
  console.log('[patch-date-fns] Added _lib/* to exports map')
} else {
  console.log('[patch-date-fns] Already patched or no exports field, skipping')
}
