#include <iostream>
#include <chrono>
#include <vector>
#include <string>
#include <algorithm>
#include <cassert>

using namespace std;
using namespace chrono;

#include "../Common/profile_scope.inl"

int sum = 0;

struct Random
{
    Random()
    {
        r = rand();
    }

    ~Random()
    {
        sum += r;
    }

    int r;
};

const size_t N = 10000;

int main()
{
    srand(123);

    {
        PROFILE_SCOPE("allocate");
        for (size_t i = 0; i < N; ++i)
        {
            vector<Random*> rands;
            const size_t s = rand() % 100 + 1;
            rands.resize(s);
            for (size_t j = 0; j < s; ++j)
            {
                rands[j] = new Random();
            }

            for (size_t j = 0; j < s; ++j)
            {
                delete rands[j];
            }
        }
    }

    srand(123);

    int sum1 = sum;
    sum = 0;

    {
        PROFILE_SCOPE("Memory pool");

        char* buf = new char[1000 * sizeof(Random)];
        char* ptr = buf;

        for (size_t i = 0; i < N; ++i)
        {
            vector<Random*> rands;
            const size_t s = rand() % 100 + 1;
            rands.resize(s);
            for (size_t j = 0; j < s; ++j)
            {
                rands[j] = new(ptr) Random();
                ptr += sizeof(Random);
            }

            for (size_t j = 0; j < s; ++j)
            {
                rands[j]->~Random();
            }

            ptr = buf;
        }

        delete[] buf;
    }

    assert(sum1 == sum);
    cout << sum1 << endl;
    cout << sum << endl;

}