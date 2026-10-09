$c = 'c:\Users\user\Desktop\projects\gfa\logmas-odeda\src\app\(dashboard)\dashboard\reports\page.tsx'

if (Test-Path $c) {

  $s = Get-Content $c -Raw

  $l = $s.Split([Environment]::NewLine, [StringSplitOptions]::None)

  for ($i = 0; $i -lt $l.Length; $i++) {

    $ln = $l[$i]

    if ($ln -match 'toDateStr\(start\), to: toDateStr\(end\)') {

      $l[$i] = $ln -replace 'toDateStr\(start\), to: toDateStr\(end\)', 'toLocalISO(start), to: toLocalISO(endOfMonth(start))'

    }

    elseif ($ln -match 'toDateStr\(start\), to: toDateStr\(now\)') {

      $p = if ($i -gt 0) { $l[$i - 1] } else { '' }

      if ($p -match 'case "this_month"') {

        $l[$i] = $ln -replace 'toDateStr\(start\), to: toDateStr\(now\)', 'toLocalISO(start), to: toLocalISO(now)'

      }

      elseif ($p -match 'case "last_6_months"') {

        $l[$i] = $ln -replace 'toDateStr\(start\), to: toDateStr\(now\)', 'toLocalISO(start), to: toLocalISO(now)'

      }

    }

  }

  $s = $l -join "`n"

  Set-Content -Path $c -Value $s

  Write-Host 'computePreset fixes applied'

}


