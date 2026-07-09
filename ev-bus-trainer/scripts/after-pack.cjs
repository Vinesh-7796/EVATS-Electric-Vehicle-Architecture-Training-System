// afterPack hook for electron-builder.
// Embeds the app icon into the packaged .exe using rcedit
// (bypasses the broken winCodeSign symlink extraction on this machine).
const { execFileSync } = require('node:child_process')
const { join, resolve } = require('node:path')

// rcedit is already cached by electron-builder — find it.
// It lives in electron-builder's Cache under winCodeSign/<hash>/rcedit-x64.exe.
const { existsSync } = require('node:fs')
const os = require('node:os')
const path = require('node:path')

function findRcedit() {
  const cacheRoot = path.join(
    os.homedir(),
    'AppData',
    'Local',
    'electron-builder',
    'Cache',
    'winCodeSign'
  )
  // List directories in the cache and find any with rcedit-x64.exe.
  const { readdirSync } = require('node:fs')
  if (!existsSync(cacheRoot)) return null
  for (const entry of readdirSync(cacheRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const rcedit = path.join(cacheRoot, entry.name, 'rcedit-x64.exe')
    if (existsSync(rcedit)) return rcedit
  }
  return null
}

exports.default = async function afterPack(context) {
  const exeName = context.packager?.appInfo?.productName || 'EVATS'
  const exePath = context.electronPlatformName === 'win32'
    ? join(context.appOutDir, `${exeName}.exe`)
    : null

  if (!exePath || !existsSync(exePath)) {
    console.log(`[afterPack] No Windows exe to patch at: ${exePath}, skipping icon injection.`)
    return
  }

  const rcedit = findRcedit()
  if (!rcedit) {
    console.warn('[afterPack] rcedit-x64.exe not found in electron-builder cache. Icon not embedded.')
    console.warn('[afterPack] Run a build with signAndEditExecutable:true once (may need admin/developer mode) to populate the cache.')
    return
  }

  const iconPath = resolve(__dirname, '..', 'build', 'icon.ico')
  if (!existsSync(iconPath)) {
    console.warn('[afterPack] build/icon.ico not found. Icon not embedded.')
    return
  }

  console.log(`[afterPack] Embedding icon into exe...`)
  console.log(`[afterPack]   exe:  ${exePath}`)
  console.log(`[afterPack]   icon: ${iconPath}`)
  console.log(`[afterPack]   rcedit: ${rcedit}`)

  try {
    execFileSync(rcedit, [exePath, '--set-icon', iconPath], { stdio: 'inherit' })
    console.log('[afterPack] Icon embedded successfully.')
  } catch (err) {
    console.error('[afterPack] rcedit failed:', err.message)
    // Don't fail the build — icon is cosmetic, app still works.
  }
}
