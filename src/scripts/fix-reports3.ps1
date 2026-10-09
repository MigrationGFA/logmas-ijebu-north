$p = 'c:\Users\user\Desktop\projects\gfa\logmas-odeda\src\app\(dashboard)\dashboard\reports\page.tsx'
$nl = [string][char]10
$s = Get-Content $p -Raw

# restore 2-space indent on the filterRange declaration (regex matched without leading spaces)
$s = $s -replace '(?m)^    const \[filterRange, setFilterRange\]', '  const [filterRange, setFilterRange]'

# collapse blank line between the setFilterRange / setAppliedRange pairs
$s = $s -replace '(?m)^([ \t]*)setFilterRange\(computePreset\(key\)\);[ \t]*\n[ \t]*\n[ \t]*setAppliedRange\(computePreset\(key\)\);', ('$1setFilterRange(computePreset(key));' + $nl + '$1setAppliedRange(computePreset(key));')
$s = $s -replace '(?m)^([ \t]*)setFilterRange\(\{ from: fromDate, to: toDate \}\);[ \t]*\n[ \t]*\n[ \t]*setAppliedRange\(\{ from: fromDate, to: toDate \}\);', ('$1setFilterRange({ from: fromDate, to: toDate });' + $nl + '$1setAppliedRange({ from: fromDate, to: toDate });')

Set-Content -Path $p -Value $s -NoNewline
Write-Host 'indent + blank-line fixes applied'
