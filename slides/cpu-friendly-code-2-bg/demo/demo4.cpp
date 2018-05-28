#include "common.inl"

#include <vector>
#include <list>
#include <algorithm>

struct ivec
{
    int x, y;
    int manhattan_length() const {
        return x + y;
    }
};

int isort(const void* p, const void* q) {
    int x = *(const int *)p;
    int y = *(const int *)q;
    if (x > y) return -1;
    else if (x < y) return 1;
    return 0;
}

void check(picobench::state& s)
{
    std::vector<ivec> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back({ rand(), rand() });
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for (auto& elem : v) {
            if (elem.x > elem.y) {
                qsort(&elem, 2, sizeof(int), isort);
                sum += elem.x;
            }
            else {
                sum += elem.y;
            }
        }
    }

    sanity_check(s.iterations(), sum);
}


void nocheck(picobench::state& s)
{
    std::vector<ivec> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back({ rand(), rand() });
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for (auto& elem : v) {
            qsort(&elem, 2, sizeof(int), isort);
            sum += elem.x;
        }
    }

    sanity_check(s.iterations(), sum);
}

#define ITERATIONS .iterations({ 100000, 200000 })

PICOBENCH(check) ITERATIONS;
PICOBENCH(nocheck) ITERATIONS;
