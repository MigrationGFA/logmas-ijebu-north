$p = 'c:\Users\user\Desktop\projects\gfa\logmas-odeda\src\app\(dashboard)\dashboard\reports\page.tsx'
$nl = [string][char]10
$s = Get-Content $p -Raw

# R1: rebuild the PresetKey + helper-functions region cleanly (removes blank-line noise)
$region = @(
'type PresetKey =',
'  | "yesterday"',
'  | "this_week"',
'  | "this_month"',
'  | "last_month"',
'  | "last_6_months"',
'  | "all"',
'  | "custom";',
'',
'// Date range comparisons must run in Lagos time (WAT, UTC+1): toISOString()',
'// round trips through UTC and shifts every day by one, which is what made',
'// the report filters off by one.',
'const toLocalISO = (d: Date): string =>',
'  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;',
'',
'function endOfMonth(d: Date): Date {',
'  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);',
'}',
'',
'function startOfWeekISO(d: Date): Date {',
'  // Monday-based week (ISO): 0 = Monday ... 6 = Sunday',
'  const weekday = (d.getDay() + 6) % 7;',
'  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - weekday, 0, 0, 0, 0);',
'}',
'',
'// Local (Lagos, UTC+1) display helper for date strings like "2026-10-09".',
'const formatReportDate = (d: string | undefined | null): string =>',
'  d ? new Date(`${d}T00:00:00+01:00`).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" }) : "-";',
'',
'function endOfWeekISO(d: Date): Date {',
'  const weekday = (d.getDay() + 6) % 7;',
'  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + (6 - weekday), 23, 59, 59, 999);',
'}',
'',
''
)
$regionText = ($region -join $nl)
$s = [regex]::Replace($s, '(?s)type PresetKey =.*?function computePreset\(', { $regionText + 'function computePreset(' })

# R2: repair filterRange/appliedRange state (appliedRange was inserted inside the other useState)
$s = [regex]::Replace($s, '(?s)const \[filterRange, setFilterRange\] = useState<\{ from\?: string; to\?: string \} \| undefined>\(.*?computePreset\("this_month"\),.*?computePreset\("this_month"\),\s*\);', { '  const [filterRange, setFilterRange] = useState<{ from?: string; to?: string } | undefined>(' + $nl + '    computePreset("this_month"),' + $nl + '  );' + $nl + '  const [appliedRange, setAppliedRange] = useState<{ from?: string; to?: string }>({});' })

# R3: remaining UTC-snap calls -> local (this_month / last_6_months)
$s = $s -replace 'toDateStr\(start\), to: toDateStr\(now\)', 'toLocalISO(start), to: toLocalISO(now)'

# R4: add this_week case after yesterday
$ins = '    case "this_week": {' + $nl + '      const start = startOfWeekISO(now);' + $nl + '      const end = endOfWeekISO(now);' + $nl + '      return { from: toLocalISO(start), to: toLocalISO(end) };' + $nl + '    }'
$s = $s -replace '(?s)(case "yesterday":.*?toLocalISO\(y\) \};\s+})', ('$1' + $nl + $ins)

# R5: add this_week to PRESETS
$s = $s -replace '(\{ key: "yesterday", label: "Yesterday" \},)(\s*\n\s*\{ key: "this_month")', ('$1' + $nl + '  { key: "this_week", label: "This Week" },' + '$2')

# R6: remove blank lines introduced around the setAppliedRange additions
$s = $s -replace '(?m)^([ \t]*)setFilterRange\(computePreset\(key\)\);[ \t]*\n[ \t]*setAppliedRange\(computePreset\(key\)\);', ('$1setFilterRange(computePreset(key));' + $nl + '$1setAppliedRange(computePreset(key));')
$s = $s -replace '(?m)^([ \t]*)setFilterRange\(\{ from: fromDate, to: toDate \}\);[ \t]*\n[ \t]*setAppliedRange\(\{ from: fromDate, to: toDate \}\);', ('$1setFilterRange({ from: fromDate, to: toDate });' + $nl + '$1setAppliedRange({ from: fromDate, to: toDate });')

# R7: trim trailing blank lines at EOF
$s = [regex]::Replace($s, '[ \t\r\n]+$', $nl)

Set-Content -Path $p -Value $s -NoNewline
Write-Host 'reports page fixes applied'
