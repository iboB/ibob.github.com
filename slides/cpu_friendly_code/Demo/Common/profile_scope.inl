
#if defined(_MSC_VER) || defined(__MINGW32__)

#define WIN32_LEAN_AND_MEAN
#include <Windows.h>

const long long FREQ = []() -> long long
{
    LARGE_INTEGER frequency;
    QueryPerformanceFrequency(&frequency);
    return frequency.QuadPart;
}();

struct high_res_clock
{
    typedef long long rep;
    typedef std::nano period;
    typedef std::chrono::duration<rep, period> duration;
    typedef std::chrono::time_point<high_res_clock> time_point;
    static const bool is_steady = true;

    static time_point now()
    {
        LARGE_INTEGER t;
        QueryPerformanceCounter(&t);
        return time_point(duration((t.QuadPart * rep(period::den)) / FREQ));
    }
};

#else
typedef std::chrono::high_resolution_clock high_res_clock;
#endif

struct profile_scope
{
    profile_scope(const string& l)
        : label(l)
    {
        clear_cache();
        start = high_res_clock::now();
    }

    ~profile_scope()
    {
        auto duration = high_res_clock::now() - start;
        cout << label << ": " <<
            (double(duration_cast<microseconds>(duration).count()) / 1000) << " ms" <<
            " (cc " << cc << ")" << endl;
    }

    void clear_cache()
    {
        const int CC = 32000;
        vector<int> v(CC);

        v[0] = rand();
        for (int i = 1; i < CC; ++i)
        {
            v[i] = v[i - 1] + v[rand() % i];
        }

        cc = v[rand() % v.size()];
    }

    string label;
    high_res_clock::time_point start;
    long long cc;
};

#define PROFILE_SCOPE(label) profile_scope __foo__(label)