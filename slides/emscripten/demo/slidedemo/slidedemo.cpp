#include <vector>
#include <cmath>

using namespace std;

extern "C"
{
    double slide_demo(int n)
    {
        ++n;
        vector<bool> sieve(n, true);

        sieve[0] = false;
        sieve[1] = false;

        int sqrtmax = int(sqrt(double(n)));

        double sum = 0;

        for (int i = 2; i <= sqrtmax; ++i)
        {
            if (!sieve[i])
                continue;

            for (int j = i*i; j < n; j += i)
            {
                sieve[j] = false;
            }
        }

        for (int i = 0; i < n; ++i)
        {
            if (sieve[i])
            {
                sum += i;
            }
        }

        return sum;
    }
}