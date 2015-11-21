#include <iostream>
#include <vector>
#include <array>

using namespace std;

vector<int> binary_palindromes;

bool is_binary_palindrome(int n)
{
    array<bool, sizeof(int) * 8> bits;

    size_t size = 0;
    while (n)
    {
        bits[size++] = n & 1;
        n >>= 1;
    }

    for (size_t i = 0; i < size / 2; ++i)
    {
        if (bits[i] != bits[size - i - 1])
        {
            return false;
        }
    }

    return true;
}

void generate_binary_palindromes(size_t n)
{
    binary_palindromes.clear();
    binary_palindromes.reserve(n / 2);

    int i = 0;

    while (n != 0)
    {
        if (is_binary_palindrome(i))
        {
            binary_palindromes.push_back(i);
            --n;
        }
        ++i;
    }
}

int main()
{
    generate_binary_palindromes(200);

    cout << "Hello, js.talks() " << binary_palindromes[93] << "!" << endl;

    return 0;
}
