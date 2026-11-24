#include "cpu_trace.hpp"
#include <emscripten/emscripten.h>

extern "C" {
    EMSCRIPTEN_KEEPALIVE const char* run_cpu(int policy, int quantum, int count, const int* input)
    {
        static std::string result;
        std::vector<os::cpu::Job> jobs;
        if (count >= 1 && count <= 24 && input) {
            for (int i = 0; i < count; ++i, input += 4)
                jobs.push_back({{input[0], input[1], input[2]}, input[3]});
        }
        result = os::cpu::simulate_cpu(static_cast<os::cpu::Policy>(policy), quantum, jobs);
        return result.c_str();
    }
}
