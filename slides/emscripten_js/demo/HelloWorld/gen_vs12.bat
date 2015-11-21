@echo off
if not exist vs12 mkdir vs12
cd vs12
cmake .. -G "Visual Studio 12 2013"
cd ..