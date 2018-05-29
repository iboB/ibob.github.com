#include "common.inl"

#include <vector>

#ifdef _MSC_VER

#pragma intrinsic(_BitScanForward)

inline uint32_t count_bits(uint32_t a) {
    unsigned long bit = 0;
    _BitScanReverse(&bit, a);
    return uint32_t(bit + 1);
}

#else

inline uint32_t count_bits(uint32_t a) {
    return 32 - uint32_t(__builtin_clz(a));
}

#endif

inline uint32_t lame_count_bits(uint32_t a) {
    int bits = 0;
    while (a)
    {
        ++bits;
        a >>= 1;
    }
    return bits;
}

void no_intrin(picobench::state& s)
{
    std::vector<uint32_t> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(rand() + 1);
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for (const auto& elem : v) {
            sum += lame_count_bits(elem);
        }
    }

    sanity_check(s.iterations(), sum);
}

void intrin(picobench::state& s)
{
    std::vector<uint32_t> v;
    srand(s.iterations());
    v.reserve(s.iterations());

    for (int i = 0; i<s.iterations(); ++i) {
        v.push_back(rand() + 1);
    }

    int sum = 0;

    {
        picobench::scope scope(s);
        for (const auto& elem : v) {
            sum += count_bits(elem);
        }
    }

    sanity_check(s.iterations(), sum);
}

#define ITERATIONS .iterations({ 50000, 100000 })

PICOBENCH(no_intrin) ITERATIONS;
PICOBENCH(intrin) ITERATIONS;
