#include <iostream>
#include <chrono>
#include <map>
#include <vector>
#include <string>
#include <cassert>

using namespace std;
using namespace chrono;

#include "../Common/profile_scope.inl"

const size_t TESTS = 10000;
const size_t N = 100;

int main()
{
    vector<vector<int>> vector_tests(TESTS);
    vector<map<int, vector<size_t>>> map_tests(TESTS);
    vector<int> search_terms(TESTS);

    /////////////////////////////////
    // fill data
    for (size_t i = 0; i < TESTS; ++i)
    {
        vector_tests[i].reserve(N);

        auto& m = map_tests[i];
        auto& v = vector_tests[i];

        for (size_t j = 0; j < N; ++j)
        {
            int r = rand();
            m[r].push_back(j);
            v.push_back(r);
        }

        search_terms[i] = v[rand()%N];
    }

    int map_sanity_check = 0;

    {
        PROFILE_SCOPE("maps");

        for (size_t i = 0; i < TESTS; ++i)
        {
            auto& m = map_tests[i];
            auto s = search_terms[i];

            auto f = m.find(s);

            if (f != m.end())
            {
                for (auto& i : f->second)
                {
                    map_sanity_check += i;
                }
            }
        }
    }

    int vector_sanity_check = 0;

    {
        PROFILE_SCOPE("vectors");

        for (size_t i = 0; i < TESTS; ++i)
        {
            auto& v = vector_tests[i];
            auto s = search_terms[i];

            for (size_t j = 0; j < N; ++j)
            {
                if (s == v[j])
                {
                    vector_sanity_check += j;
                }
            }
        }
    }

    assert(map_sanity_check == vector_sanity_check);
    cout << map_sanity_check << endl;
    cout << vector_sanity_check << endl;

    return 0;
}
