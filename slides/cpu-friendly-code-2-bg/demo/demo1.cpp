#include "common.inl"

#include <vector>
#include <list>

struct ivec
{
    int x, y;
    int manhattan_length() const {
        return x + y;
    }
};

void vector(picobench::state& s)
{
    std::vector<ivec> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i=0; i<s.iterations(); ++i) {
        v.push_back({rand(), rand()});
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for(const auto& elem : v) {
            sum += elem.manhattan_length();
        }
    }

    sanity_check(s.iterations(), sum);
}

void list(picobench::state& s)
{
    std::list<ivec> l;
    srand(s.iterations());

    for (int i=0; i<s.iterations(); ++i) {
        l.push_back({rand(), rand()});
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for(const auto& elem : l) {
            sum += elem.manhattan_length();
        }
    }

    sanity_check(s.iterations(), sum);
}

PICOBENCH(vector);
PICOBENCH(list);
