@echo off
setlocal

:: =================================================================================
:: GERADOR DE ESTRUTURA DE PROJETO
::
:: Autor: Jameson Abade
:: Data: 22/06/2025
::
:: Funcionalidades:
:: - Gera uma árvore de arquivos e pastas limpa.
:: - Exclui de forma eficaz pastas como 'node_modules', '.git', 'build', etc.
:: - Lida corretamente com pastas vazias, evitando erros.
:: - Salva o arquivo com codificação UTF-8 para uma exibição perfeita.
:: - Mantém a janela aberta no final para feedback.
:: =================================================================================

TITLE Gerando estrutura do projeto...
cls
echo.
echo Analisando a estrutura do projeto.
echo.

powershell -NoProfile -Command "try { $outputFile = 'estrutura_projeto.txt'; $excludeDirs = @('node_modules', '.git', '.vscode', 'dist', 'build', '__pycache__', 'obj', 'bin'); function Get-ProjectTree { param([string]$path, [string]$indent = '') $items = Get-ChildItem -Path $path -Force | Where-Object { $_.Name -notin $excludeDirs } | Sort-Object -Property { !$_.PSIsContainer }, Name; if ($null -eq $items -or $items.Count -eq 0) { return }; $lastItem = $items[-1]; foreach ($item in $items) { if ($item.Name -eq $lastItem.Name) { $prefix = 'L-- '; $newIndent = $indent + '    ' } else { $prefix = '+-- '; $newIndent = $indent + '    ' }; Add-Content -Path $outputFile -Value \"$indent$prefix$($item.Name)\" -Encoding UTF8; if ($item.PSIsContainer) { Get-ProjectTree -path $item.FullName -indent $newIndent } } }; $projectPath = Get-Location; $header = \"Gerado em: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')`n=================================================`n$($projectPath.Name)\"; Set-Content -Path $outputFile -Value $header -Encoding UTF8; Get-ProjectTree -path $projectPath.Path; exit 0 } catch { Write-Host 'ERRO ao executar o script PowerShell.'; exit 1 }"

if %errorlevel% neq 0 (
    echo.
    echo X ERRO: A analise falhou.
) else (
    echo.
    echo SUCESSO! Estrutura do projeto salva em 'estrutura_projeto.txt'.
    start "" "estrutura_projeto.txt"
)

echo.
echo Processo finalizado.
pause >nul
endlocal