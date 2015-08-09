// index of element in matrix
uint index(uint row, uint column)
{
    return column*4 + row;
}

const int N = 1000;

//~ // c = a*b
__kernel void matrix_mul(__global float* a, __global float* b, __global float* c)
{
    const uint n = get_global_id(0)*N;

    for(int i=n; i<n+N; ++i)
    {
        c[i] = 0;

        uint m = i/16; // index of matrix
        m*=16; // offset of matrix
        uint row = i%4; // row of current element within the matrix
        uint col = i/4 % 4; // column of current element within the matrix

        for(uint k=0; k<4; ++k)
        {
            c[i] += a[m + index(row, k)] * b[m + index(k, col)];
        }
    }
}
