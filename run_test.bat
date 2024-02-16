@echo off
cd cmm
call npm run build
call npm run build:scripts
call npm run test
