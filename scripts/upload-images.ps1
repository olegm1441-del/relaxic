# Relaxic — выгрузка папки «картинки» в репозиторий. Windows / PowerShell.
$ErrorActionPreference = "Stop"

$RepoUrl = "https://github.com/olegm1441-del/relaxic.git"
$Branch  = "main"
$Dest    = "public/img/incoming"

function Say($t){ Write-Host $t -ForegroundColor Red }
function Dim($t){ Write-Host $t -ForegroundColor DarkGray }

Say ""
Say "  RELAXIC X  выгрузка картинок"
Say ""

if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
  throw "Git не установлен. Поставьте GitHub Desktop — он ставит git вместе с собой."
}

# 1. Папка «картинки»
$Src = $null
foreach ($d in @("$HOME\Desktop\картинки","$HOME\Downloads\картинки",
                 "$HOME\Рабочий стол\картинки","$HOME\Загрузки\картинки",
                 "$HOME\Desktop\kartinki","$HOME\Downloads\kartinki")) {
  if (Test-Path $d) { $Src = $d; break }
}
if ($args.Count -ge 1 -and (Test-Path $args[0])) { $Src = $args[0] }
if (-not $Src) { throw "Не нашёл папку «картинки» на Рабочем столе и в Загрузках." }
Dim "  папка:       $Src"

# 2. Репозиторий
$Repo = $null
foreach ($d in @("$HOME\Documents\GitHub\relaxic","$HOME\GitHub\relaxic",
                 "$HOME\Documents\relaxic","$HOME\relaxic")) {
  if (Test-Path "$d\.git") { $Repo = $d; break }
}
if (-not $Repo) {
  $Repo = "$HOME\Documents\GitHub\relaxic"
  Dim "  репозиторий не найден — клонирую в $Repo"
  New-Item -ItemType Directory -Force -Path (Split-Path $Repo) | Out-Null
  git clone --branch $Branch $RepoUrl $Repo
}
Dim "  репозиторий: $Repo"

Set-Location $Repo
git fetch origin $Branch --quiet 2>$null
git checkout $Branch --quiet 2>$null
git pull --rebase origin $Branch --quiet 2>$null

# 3. Распаковка паков и отбор без дублей
New-Item -ItemType Directory -Force -Path $Dest | Out-Null
$Tmp = Join-Path $env:TEMP ("relaxic_" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $Tmp | Out-Null

$zips = Get-ChildItem -Path $Src -Filter *.zip -File
foreach ($z in $zips) {
  Expand-Archive -Path $z.FullName -DestinationPath (Join-Path $Tmp $z.BaseName) -Force
}
if ($zips.Count -gt 0) { Dim "  распаковано паков: $($zips.Count)" }

Get-ChildItem -Path $Src -File -Include @("*.png","*.jpg","*.jpeg","*.webp") -Recurse -Depth 1 |
  ForEach-Object { Copy-Item $_.FullName $Tmp -Force -ErrorAction SilentlyContinue }

$ext = @("*.png","*.jpg","*.jpeg","*.webp","*.avif")
$all = Get-ChildItem -Path $Tmp -Recurse -File -Include $ext |
       Where-Object { $_.FullName -notmatch "__MACOSX" }
if ($all.Count -eq 0) { throw "Картинок не нашлось. Проверьте relaxic_pack_*.zip в папке." }

# Транслит кириллических имён
$map = @{
  'ё'='e';'ж'='zh';'ч'='ch';'ш'='sh';'щ'='sch';'ю'='yu';'я'='ya';'ъ'='';'ь'='';
  'а'='a';'б'='b';'в'='v';'г'='g';'д'='d';'е'='e';'з'='z';'и'='i';'й'='j';'к'='k';
  'л'='l';'м'='m';'н'='n';'о'='o';'п'='p';'р'='r';'с'='s';'т'='t';'у'='u';'ф'='f';
  'х'='h';'ц'='c';'ы'='y';'э'='e'
}
function Translit($t){
  $o = ""
  foreach ($c in $t.ToLower().ToCharArray()) {
    $k = [string]$c
    if ($map.ContainsKey($k)) { $o += $map[$k] }
    elseif ($k -match '[a-z0-9]') { $o += $k }
    else { $o += '-' }
  }
  ($o -replace '-+','-').Trim('-')
}

$seen = @{}; $kept = 0; $dupes = 0
foreach ($f in $all) {
  $h = (Get-FileHash $f.FullName -Algorithm SHA1).Hash
  if ($seen.ContainsKey($h)) { $dupes++; continue }
  $seen[$h] = $true
  $name = Translit([IO.Path]::GetFileNameWithoutExtension($f.Name))
  if (-not $name) { $name = "img-" + $h.Substring(0,10) }
  $target = Join-Path $Dest ($name + $f.Extension)
  $k = 2
  while (Test-Path $target) { $target = Join-Path $Dest ("$name-$k" + $f.Extension); $k++ }
  Copy-Item $f.FullName $target -Force
  $kept++
}
Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue

$mb = [math]::Round((Get-ChildItem $Dest -Recurse -File |
       Measure-Object Length -Sum).Sum / 1MB, 1)
Say ""
Say "  картинок:    $kept"
if ($dupes -gt 0) { Dim "  дублей пропущено: $dupes" }
Dim "  объём:       $mb МБ"
Write-Host "  ! PNG уйдут как есть — сожму на сервере." -ForegroundColor Yellow

$files = @{ Count = $kept }

# 4. Отправляем
git add $Dest
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) { Say ""; Say "  Новых картинок нет."; exit 0 }

git commit -q -m "Картинки: загружено $($files.Count) файлов"
Say "  отправляю на GitHub..."
foreach ($i in 1,2,4,8) {
  git push origin $Branch
  if ($LASTEXITCODE -eq 0) {
    Say ""; Say "  Готово. $($files.Count) файлов в репозитории."
    Dim "  Напишите в чат: «картинки залил»."
    exit 0
  }
  Dim "  сеть подвела, повтор через $i с"; Start-Sleep -Seconds $i
}
throw "Не смог отправить. Проверьте вход в GitHub Desktop."
