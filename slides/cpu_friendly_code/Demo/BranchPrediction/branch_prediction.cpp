#include <iostream>
#include <chrono>
#include <vector>
#include <string>
#include <algorithm>
#include <cassert>

using namespace std;
using namespace chrono;

#include "../Common/profile_scope.inl"

const size_t TESTS = 100;
const size_t N = 100000;


int main()
{
    vector<vector<int>> numbers(TESTS);

    /////////////////////////////////
    // fill data
    for (auto& v : numbers)
    {
        v.reserve(N);
        for (size_t j = 0; j < N; ++j)
        {
            v.push_back(rand());
        }
    }

    int usum = 0;
    {
        PROFILE_SCOPE("unsorted");

        for (auto& v : numbers)
        {
            for (auto n : v)
            {
                if (n % 2)
                {
                    usum += n;
                }
            }
        }
    }


    /////////////////////////////////
    // sort data
    for (auto& v : numbers)
    {
        sort(v.begin(), v.end(), [](int a, int b)
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
    }

    int ssum = 0;
    {
        PROFILE_SCOPE("sorted  ");

        for (auto& v : numbers)
        {
            for (auto n : v)
            {
                if (n % 2)
                {
                    ssum += n;
                }
            }
        }
    }

    assert(usum == ssum);
    cout << usum << endl;
    cout << ssum << endl;

    return 0;
}
