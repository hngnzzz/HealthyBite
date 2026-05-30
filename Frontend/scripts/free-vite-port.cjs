const { execFileSync } = require('node:child_process')

const PORT = 5173

function run(command, args) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim()
}

function getListeningPids(port) {
  let output = ''

  try {
    output = run('netstat', ['-ano', '-p', 'tcp'])
  } catch {
    return []
  }

  const pids = new Set()
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) {
      continue
    }

    const columns = line.trim().split(/\s+/)
    const localAddress = columns[1] || ''
    const pid = columns[columns.length - 1]

    if (localAddress.endsWith(`:${port}`) && /^\d+$/.test(pid)) {
      pids.add(pid)
    }
  }

  return [...pids]
}

function getProcessInfo(pid) {
  const script = [
    `$p = Get-CimInstance Win32_Process -Filter "ProcessId = ${pid}"`,
    'if ($p) {',
    '  [pscustomobject]@{',
    '    Name = $p.Name;',
    '    CommandLine = $p.CommandLine;',
    '    ExecutablePath = $p.ExecutablePath',
    '  } | ConvertTo-Json -Compress',
    '}',
  ].join('; ')

  try {
    const json = run('powershell.exe', ['-NoProfile', '-Command', script])
    return json ? JSON.parse(json) : null
  } catch {
    return null
  }
}

function isOldViteNode(processInfo) {
  if (!processInfo) {
    return false
  }

  const name = String(processInfo.Name || '').toLowerCase()
  const commandLine = String(processInfo.CommandLine || '').toLowerCase()

  return name === 'node.exe' && commandLine.includes('vite')
}

const pids = getListeningPids(PORT)

for (const pid of pids) {
  const processInfo = getProcessInfo(pid)

  if (!isOldViteNode(processInfo)) {
    console.error(
      `Port ${PORT} is in use by PID ${pid}` +
        (processInfo?.Name ? ` (${processInfo.Name})` : '') +
        '. Not killing because it does not look like a Vite node process.',
    )
    process.exit(1)
  }

  run('taskkill', ['/PID', pid, '/F'])
  console.log(`Killed old Vite dev server on port ${PORT}: PID ${pid}`)
}
