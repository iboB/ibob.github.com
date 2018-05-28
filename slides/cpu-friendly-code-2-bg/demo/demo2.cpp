#include "common.inl"

#include <vector>
#include <list>

template <typename C>
void push_back(C& c, int i)
{
    c.push_back(i);
}

template <typename C>
void push_front(C& c, int i)
{
    c.insert(c.begin(), i);
}

#define add_elem push_back

void vector(picobench::state& s)
{
    std::vector<int> v;
    srand(s.iterations());

    for(auto _ : s) {
        add_elem(v, rand());
    }

    int sum = 0;
    for (auto elem : v) sum += elem;
    sanity_check(s.iterations(), sum);
}

void list(picobench::state& s)
{
    std::list<int> l;
    srand(s.iterations());

    for (auto _ : s) {
        add_elem(l, rand());
    }

    int sum = 0;
    for (auto elem : l) sum += elem;
    sanity_check(s.iterations(), sum);
}

PICOBENCH(vector);
PICOBENCH(list);
