#include "common.inl"

#include <vector>
#include <list>
#include <algorithm>

void unsorted(picobench::state& s)
{
    std::vector<double> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(double(rand()) / RAND_MAX);
    }

    double prod = 1;

    {
        picobench::scope scope(s);
        for (auto elem : v) {
            if (elem < 0.5) prod *= elem;
        }
    }

    sanity_check(s.iterations(), prod);
}

void sorted(picobench::state& s)
{
    std::vector<double> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(double(rand()) / RAND_MAX);
    }

    std::sort(v.begin(), v.end());

    double prod = 1;

    {
        picobench::scope scope(s);
        for (auto elem : v) {
            if (elem < 0.5) prod *= elem;
        }
    }

    sanity_check(s.iterations(), prod);
}

#define ITERATIONS .iterations({ 100000, 200000 })

PICOBENCH(unsorted) ITERATIONS;
PICOBENCH(sorted) ITERATIONS;
