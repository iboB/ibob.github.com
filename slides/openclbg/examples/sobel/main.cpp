#include <iostream>
#include <fstream>
#include <vector>
#include <sstream>

#include <boost/gil/image.hpp>
#include <boost/gil/extension/io/jpeg_io.hpp>
#include <boost/timer/timer.hpp>

#include <CL/opencl.h>

using namespace std;
using namespace boost::gil;

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

// used to populate a raw image from the input jpeg
struct PixelsWriter
{
    vector<uint8_t>* data;

    PixelsWriter(vector<uint8_t>* d)
        : data(d)
    {}

    void operator()(rgb8_pixel_t p) const
    {
        data->push_back(at_c<0>(p));
        data->push_back(at_c<1>(p));
        data->push_back(at_c<2>(p));
        data->push_back(0); // we need 32 bit images
    }
};


// generate pixels from a GIL view
// output is rgbargbargba...
template <typename View>
vector<uint8_t> readPixelsFrom(const View& view)
{
    vector<uint8_t> ret;

    auto dims = view.dimensions();

    ret.reserve(dims.x * dims.y * 4);

    PixelsWriter p(&ret);
    for_each_pixel(view, p);

    return ret;
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
    string clCode = LoadFile("sobel.cl");
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
    // read image
    t.start("Reading image");
    rgb8_image_t img;
    jpeg_read_image("lady.jpg", img);    
    auto pixels = readPixelsFrom(const_view(img));
    vector<uint8_t> output(pixels.size(), 1);
    t.report();

    ///////////////////////////////////////////////////////////////////////////////////////
    // prepare input for the cl program
    t.start("Working");
    auto inputBuffer = clCreateBuffer(context, CL_MEM_READ_ONLY | CL_MEM_COPY_HOST_PTR, pixels.size(), &pixels.front(), nullptr);
    auto outputBuffer = clCreateBuffer(context, CL_MEM_WRITE_ONLY | CL_MEM_USE_HOST_PTR, output.size(), &output.front(), nullptr);

    auto kernel = clCreateKernel(program, "sobel", nullptr);

    status = clSetKernelArg(kernel, 0, sizeof(cl_mem), &inputBuffer);
    status = clSetKernelArg(kernel, 1, sizeof(cl_mem), &outputBuffer);

    size_t globalWorkItems[] = { img.dimensions().x, img.dimensions().y };
    size_t localWorkItems[] = { 1, 1 };

    ///////////////////////////////////////////////////////////////////////////////////////
    // execution
    cl_event ndrEvent;
    clEnqueueNDRangeKernel(commandQueue, kernel, 2, nullptr, globalWorkItems, localWorkItems, 0, nullptr, &ndrEvent);
    clFlush(commandQueue);
    clWaitForEvents(1, &ndrEvent);
    clReleaseEvent(ndrEvent);
    t.report();
    
    ///////////////////////////////////////////////////////////////////////////////////////
    // write image back
    t.start("Writing image:");
    vector<uint8_t> outputRGB;
    outputRGB.reserve(img.dimensions().y * img.dimensions().x * img._view.num_channels());
    for (size_t i = 0; i < output.size(); i += 4)
    {
        outputRGB.push_back(output[i]);
        outputRGB.push_back(output[i + 1]);
        outputRGB.push_back(output[i + 2]);
    }

    auto imgOut = interleaved_view(img.dimensions().x, img.dimensions().y, reinterpret_cast<const rgb8_pixel_t*>(&outputRGB.front()), img.dimensions().x * img._view.num_channels());
    jpeg_write_view("test.jpg", imgOut, 90);
    t.report();

    ///////////////////////////////////////////////////////////////////////////////////////
    // release resources
    clReleaseKernel(kernel);
    clReleaseProgram(program);
    clReleaseMemObject(inputBuffer);
    clReleaseMemObject(outputBuffer);
    clReleaseCommandQueue(commandQueue);
    clReleaseContext(context);

    return 0;
}
