@echo off
echo [%date% %time%] script iniciado >> C:\SmartTrash\log.txt
cd /d C:\SmartTrash

:espera
netstat -an | findstr ":3306" | findstr "LISTENING" >nul
if errorlevel 1 (
  ping -n 6 127.0.0.1 >nul
  goto espera
)

echo [%date% %time%] mysql ok, iniciando node >> C:\SmartTrash\log.txt
"C:\Program Files\nodejs\node.exe" server.js >> C:\SmartTrash\log.txt 2>&1