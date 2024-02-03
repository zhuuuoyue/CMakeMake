@echo off
set solution_dir=%cd%\src

cd tools/cmm
node dist/main.js --solution_dir %solution_dir%

cd ../..
if not exist build mkdir build
cd build
cmake ../src

pause
