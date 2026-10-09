$p = 'c:\Users\user\Desktop\projects\gfa\logmas-odeda\src\services\apiReports.ts'
$nl = [string][char]10
$s = Get-Content $p -Raw
$changed = 0

# ReportInvoice: payer contact + provenance fields after `paidAt: string | null;`
$fieldsInvoice = @(
'  paidAt: string | null;',
'  // Payer contact + provenance fields — consumed by the dashboard tables',
'  // and the CSV exports on the reports page.',
'  applicationNumber?: string | null;',
'  service?: { name?: string; revenueHead?: string } | null;',
'  paymentStatus?: string;',
'  createdAt?: string;',
'  phone?: string | null;',
'  email?: string | null;',
'  date_of_payment?: string | null;'
) -join $nl
$before = $s
$s = $s -replace '  paidAt: string \| null;', $fieldsInvoice
if ($s -ne $before) { $changed++ }

# ReportReceipt: fields before its closing brace (anchored by levyType + paidAt)
$fieldsReceipt = @(
'  invoiceNumber?: string | null;',
'  applicationNumber?: string | null;',
'  service?: { name?: string; revenueHead?: string } | null;',
'  issuedAt?: string;',
'  phone?: string | null;',
'  email?: string | null;',
'  date_of_payment?: string | null;'
) -join $nl
$patternReceipt = '(?m)^(  levyType: string;\r?\n  paidAt: string;\r?\n)\}'
$before = $s
$s = [regex]::Replace($s, $patternReceipt, { param($m) $m.Groups[1].Value + $fieldsReceipt + $nl + '}' })
if ($s -ne $before) { $changed++ }

# ExportInvoice (server CSV endpoint): contact fields before closing brace
$fieldsExport = @(
'  phone?: string | null;',
'  email?: string | null;',
'  date_of_payment?: string | null;'
) -join $nl
$patternExportInv = '(?m)^(  createdAt: string;\r?\n)\}'
$before = $s
$s = [regex]::Replace($s, $patternExportInv, { param($m) $m.Groups[1].Value + $fieldsExport + $nl + '}' })
if ($s -ne $before) { $changed++ }

# ExportReceipt (server CSV endpoint): contact fields before closing brace
$patternExportRcp = '(?m)^(  paidAt: string;\r?\n)\}'
$before = $s
$s = [regex]::Replace($s, $patternExportRcp, { param($m) $m.Groups[1].Value + $fieldsExport + $nl + '}' })
if ($s -ne $before) { $changed++ }

Set-Content -Path $p -Value $s -NoNewline
Write-Host ('apiReports fields applied: ' + $changed + '/4')
