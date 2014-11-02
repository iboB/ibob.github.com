#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

#include <boost/timer/timer.hpp>
#include <mathgp/mathgp.h>
#include <mathgp/stdext.h>

#include <CL/opencl.h>

using namespace std;
using namespace mathgp;

const unsigned A_LOT = 200000;

// simple timer
class timer
{
public:
    void start(const char* name)
    {
        _name = name;
        t.start();
    }

    void report()
    {
        t.stop();
        boost::timer::nanosecond_type time = t.elapsed().wall;
        std::cout << _name << ": " << double(time)/1000000 << " ms" << std::endl;
    }

private:
    boost::timer::cpu_timer t;
    const char* _name;
};

// random from 0 to 1
float Rnd01()
{
    return float(rand()) / RAND_MAX;
}

// random from -1 to 1
float Rnd11()
{
    return Rnd01() * 2 - 1;
}

// load an entire file into a string
string LoadFile(const char* filename)
{
    ifstream fin(filename, ios::in | ios::binary);

    if (!fin.is_open())
    {
        ostringstream sout;
        sout << "cannot open " << filename;
        throw runtime_error(sout.str());
    }

    streamoff begin = fin.tellg();
    fin.seekg(0, ios::end);
    size_t fileSize = size_t(fin.tellg() - begin);
    fin.seekg(0, ios::beg);

    char* fileContents = new char[fileSize + 1];

    fin.read(fileContents, fileSize);

    fileContents[fileSize] = 0;

    return fileContents;
}

int main(int argc, char* argv[])
{
    timer t;

    ///////////////////////////////////////////////////////////////////////////////////////
    // initialization
    cl_uint numPlatforms = 0;
    clGetPlatformIDs(0, nullptr, &numPlatforms);
    vector<cl_platform_id> platforms(numPlatforms);
    clGetPlatformIDs(numPlatforms, &platforms.front(), nullptr);
    auto platform = platforms.front();

    auto deviceType = CL_DEVICE_TYPE_GPU;

    if (argc == 1 || strcmp(argv[1], "gpu") == 0)
    {
        cout << "Running on gpu..." << endl;

    }
    else if (strcmp(argv[1], "cpu") == 0)
    {
        cout << "Running on cpu..." << endl;
        deviceType = CL_DEVICE_TYPE_CPU;
    }
    else
    {
        cout << "Error: Unsupported device." << endl;
        return 1;
    }

    cl_uint numDevices = 0;    
    clGetDeviceIDs(platform, deviceType, 0, nullptr, &numDevices);
    if (numDevices == 0)
    {
        cout << "Error: No supported devices" << endl;
        return 2;
    }

    vector<cl_device_id> devices(numDevices);
    clGetDeviceIDs(platform, deviceType, numDevices, &devices.front(), nullptr);
    auto device = devices.front();

    auto context = clCreateContext(nullptr, 1, &device, nullptr, nullptr, nullptr);
    auto commandQueue = clCreateCommandQueue(context, device, 0, nullptr);

    ///////////////////////////////////////////////////////////////////////////////////////
    // load cl program
    string clCode = LoadFile("matrix_mul.cl");
    const char* code = clCode.c_str();
    size_t size = clCode.length();
    auto program = clCreateProgramWithSource(context, 1, &code, &size, nullptr);
    cl_int status = clBuildProgram(program, 1, &device, nullptr, nullptr, nullptr);

    if (status != CL_SUCCESS)
    {
        // report build errors if any
        if (status == CL_BUILD_PROGRAM_FAILURE)
        {
            size_t buildLogSize = 0;
            clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG, buildLogSize, nullptr, &buildLogSize);
            
            char* buildLog = new char[buildLogSize + 1];

            clGetProgramBuildInfo(program, device, CL_PROGRAM_BUILD_LOG, buildLogSize, buildLog, NULL);

            cout << "Build errors: " << endl;
            cout << buildLog << endl;
            delete[] buildLog;
            return 5;
        }
    }

    ///////////////////////////////////////////////////////////////////////////////////////
    // generate input
    t.start("Generating input");
    vector<matrix> inputA(A_LOT);
    vector<matrix> inputB(A_LOT);
    for (unsigned i = 0; i < A_LOT; ++i)
    {
        auto& a = inputA[i];
        auto& b = inputB[i];
        for (int j = 0; j < 16; ++j)
        {
            a.at(j) = Rnd11();
            b.at(j) = Rnd11();
        }
    }
    t.report();

    ///////////////////////////////////////////////////////////////////////////////////////
    // software simulation
    t.start("Software simulation");
    vector<matrix> outputCPU(A_LOT);
    for (unsigned i = 0; i < A_LOT; ++i)
    {
        outputCPU[i] = inputA[i] * inputB[i];
    }
    t.report();

    ///////////////////////////////////////////////////////////////////////////////////////
    // prepare input for the cl program
    vector<matrix> outputCL(A_LOT);
    t.start("Working");
    auto inputBufferA = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, A_LOT * sizeof(matrix), inputA.front().as_array(), nullptr);
    auto inputBufferB = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, A_LOT * sizeof(matrix), inputB.front().as_array(), nullptr);
    auto outputBuffer = clCreateBuffer(context, CL_MEM_WRITE_ONLY, A_LOT * sizeof(matrix), nullptr, nullptr);

    auto kernel = clCreateKernel(program, "matrix_mul", nullptr);

    status = clSetKernelArg(kernel, 0, sizeof(cl_mem), &inputBufferA);
    status = clSetKernelArg(kernel, 1, sizeof(cl_mem), &inputBufferB);
    status = clSetKernelArg(kernel, 2, sizeof(cl_mem), &outputBuffer);

    ///////////////////////////////////////////////////////////////////////////////////////
    // execution
    size_t globalWorkItems = A_LOT * 16;
    cl_event ndrEvent;
    clEnqueueNDRangeKernel(commandQueue, kernel, 1, nullptr, &globalWorkItems, nullptr, 0, nullptr, &ndrEvent);

    //size_t globalWorkItems[] = { 4, A_LOT * 4 };
    //size_t localWorkItems[] = { 4, 4 };
    //cl_event ndrEvent;
    //clEnqueueNDRangeKernel(commandQueue, kernel, 2, nullptr, globalWorkItems, localWorkItems, 0, nullptr, &ndrEvent);

    clFlush(commandQueue);
    clWaitForEvents(1, &ndrEvent);
    clReleaseEvent(ndrEvent);
    
    clEnqueueReadBuffer(commandQueue, outputBuffer, CL_TRUE, 0, A_LOT * sizeof(matrix), outputCL.front().as_array(), 0, nullptr, nullptr);

    t.report();
    ///////////////////////////////////////////////////////////////////////////////////////
    // check output
    t.start("Checking output");

    matrix cpu = matrix::zero();
    matrix opencl = matrix::zero();

    for (unsigned i = 0; i < A_LOT; ++i)
    {
        cpu += outputCPU[i];
        opencl += outputCL[i];
    }

    //cout << cpu << endl;
    //cout << opencl << endl;

    cout << "Matching results: " << boolalpha << (cpu == opencl) << endl;

    t.report();

    ///////////////////////////////////////////////////////////////////////////////////////
    // release resources
    clReleaseKernel(kernel);
    clReleaseProgram(program);
    clReleaseMemObject(inputBufferA);
    clReleaseMemObject(inputBufferB);
    clReleaseMemObject(outputBuffer);
    clReleaseCommandQueue(commandQueue);
    clReleaseContext(context);

    return 0;
}
