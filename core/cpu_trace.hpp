#pragma once
#include "scheduler.hpp"

namespace os::cpu
{
    enum class Policy { fcfs, sjf, srtf, rr, priority };

    struct Job {
        Process process;
        int priority;
    };

    // The same serialized trace is used by native tests and the browser.
    std::string simulate_cpu(Policy policy, int quantum, const std::vector<Job>& jobs);
}
