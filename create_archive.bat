@echo off
cd cmm
call npm run build:dist
call npm run package
