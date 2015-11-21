@echo off
if not exist emcc_debug mkdir emcc_debug
cd emcc_debug
cmake -DCMAKE_TOOLCHAIN_FILE=../emscripten.toolchain.cmake -DCMAKE_BUILD_TYPE=Debug -DCMAKE_MAKE_PROGRAM=mingw32-make -G "Unix Makefiles" ..
cd ..