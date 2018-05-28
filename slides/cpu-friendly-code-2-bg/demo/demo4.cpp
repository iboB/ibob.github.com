#include "common.inl"

#include <vector>
#include <list>
#include <algorithm>

void unsorted(picobench::state& s)
{
    std::vector<int> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(rand());
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for (auto elem : v) {
            if (elem % 2) sum += elem;
        }
    }

    sanity_check(s.iterations(), sum);
}

void sorted(picobench::state& s)
{
    std::vector<int> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(rand());
    }

    std::sort(v.begin(), v.end(), [](int a, int b)
    {
        int am2 = a % 2;
        int bm2 = b % 2;

        if (am2 == bm2)
        {
            return a < b;
        }

        if (am2)
        {
            return true;
        }

        return false;
    });

    int sum = 0;

    {
        picobench::scope scope(s);
        for (auto elem : v) {
            if (elem % 2) sum += elem;
        }
    }

    sanity_check(s.iterations(), sum);
}

#define ITERATIONS .iterations({ 100000, 200000 })

PICOBENCH(unsorted) ITERATIONS;
PICOBENCH(sorted) ITERATIONS;
