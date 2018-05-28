#define PICOBENCH_IMPLEMENT
#include "picobench.hpp"

int main()
{
    picobench::runner runner;

#if defined(NDEBUG)
    runner.set_default_state_iterations({ 20, 50, 100, 1000, 10000 });
    runner.set_default_samples(10);
#else
    runner.set_default_state_iterations({ 100, 1000 });
    runner.set_default_samples(3);
#endif

    auto report = runner.run_benchmarks(123);
    report.to_text(std::cout);
    return 0;
}

#include <map>

std::map<int, int> sanity;

void sanity_check(int iters, int value)
{
    auto f = sanity.find(iters);
    if (f == sanity.end())
    {
        sanity[iters] = value;
    }
    else if (f->second != value)
    {
        std::cerr << "Sanity check failed!\n";
    }
}
