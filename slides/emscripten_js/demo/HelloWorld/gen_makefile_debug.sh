#!/bin/sh

mkdir -p makefile_debug
cd makefile_debug
cmake .. -DCMAKE_BUILD_TYPE=Debug -G "Unix Makefiles"
cd ..
