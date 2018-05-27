#include "common.inl"

#include <vector>
#include <map>
#include "flat_map.hpp"

static const int TESTS = 100;

int find_func(int iters)
{
    // return (iters - 1 - (rand() % (iters/2))) * 2;
    return (rand() % iters) * 2;
}

void vector(picobench::state& s)
{
    srand(s.iterations());
    std::vector<std::vector<int>> vecs(TESTS);
    std::vector<int> finds(TESTS);
    for (int t = 0; t < TESTS; ++t)
    {
        vecs.reserve(s.iterations());
        finds[t] = find_func(s.iterations());
    }

    for (int i = 0; i < s.iterations(); ++i)
    {
        for (int t = 0; t < TESTS; ++t)
        {
            vecs[t].push_back(i * 2);
        }
    }


    int sum = 0;
    {
        picobench::scope scope(s);
        for (int t = 0; t < TESTS; ++t)
        {
            auto& vec = vecs[t];
            auto to_find = finds[t];
            int i = 0;
            for (auto elem : vec)
            {
                if (elem == to_find)
                {
                    sum += i;
                    break;
                }

                ++i;
            }
        }
    }

    sanity_check(s.iterations(), sum);
}

void map(picobench::state& s)
{
    srand(s.iterations());
    std::vector<std::map<int, int>> maps(TESTS);
    std::vector<int> finds(TESTS);
    for (int t = 0; t < TESTS; ++t)
    {
        finds[t] = find_func(s.iterations());
    }

    for (int i = 0; i < s.iterations(); ++i)
    {
        for (int t = 0; t < TESTS; ++t)
        {
            maps[t][i * 2] = i;
        }
    }

    int sum = 0;
    {
        picobench::scope scope(s);
        for (int t = 0; t < TESTS; ++t)
        {
            auto to_find = finds[t];
            auto& m = maps[t];
            auto found = m.find(to_find);
            sum += found->second;
        }
    }

    sanity_check(s.iterations(), sum);
}


void flat_map(picobench::state& s)
{
    srand(s.iterations());
    std::vector<chobo::flat_map<int, int>> maps(TESTS);
    std::vector<int> finds(TESTS);
    for (int t = 0; t < TESTS; ++t)
    {
        finds[t] = find_func(s.iterations());
    }

    for (int i = 0; i < s.iterations(); ++i)
    {
        for (int t = 0; t < TESTS; ++t)
        {
            maps[t][i * 2] = i;
        }
    }

    int sum = 0;
    {
        picobench::scope scope(s);
        for (int t = 0; t < TESTS; ++t)
        {
            auto to_find = finds[t];
            auto& m = maps[t];
            auto found = m.find(to_find);
            sum += found->second;
        }
    }

    sanity_check(s.iterations(), sum);
}

PICOBENCH(vector);
PICOBENCH(map);
// PICOBENCH(flat_map);
