cmake_minimum_required(VERSION 3.2)

project(cfcdemo)

set(CMAKE_CXX_STANDARD 11)

# picobench
set(picobench_dir ${CMAKE_CURRENT_SOURCE_DIR}/picobench)
add_library(picobench INTERFACE)
target_include_directories(picobench INTERFACE ${picobench_dir})
target_sources(picobench INTERFACE ${picobench_dir}/picobench.hpp)

# chobo-shl
set(chobo_shl_dir ${CMAKE_CURRENT_SOURCE_DIR}/chobo)
add_library(chobo_shl INTERFACE)
target_include_directories(chobo_shl INTERFACE ${chobo_shl_dir})
target_sources(chobo_shl INTERFACE ${chobo_shl_dir}/flat_map.hpp)

macro(add_exe name src)
    add_executable(${name} ${src})
    target_link_libraries(${name} picobench)
    target_link_libraries(${name} chobo_shl)
endmacro()

# benchmarks
add_exe(demo1 demo1.cpp)
add_exe(demo2 demo2.cpp)
add_exe(demo3 demo3.cpp)
add_exe(demo4 demo4.cpp)
add_exe(demo5 demo5.cpp)
add_exe(demo6 demo6.cpp)
# add_exe(cache-locality cache-locality.cpp)
