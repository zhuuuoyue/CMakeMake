@echo off
cd cmm
call npm run build:dist
call npm run build:scripts
call npm run package
