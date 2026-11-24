#include "cpu_trace.hpp"
#include <stdexcept>
#include <string_view>

using namespace os::cpu;

void expect(const std::string& trace, std::string_view value)
{
    if (trace.find(value) == std::string::npos)
        throw std::runtime_error("Missing from trace: " + std::string(value));
}

int main(int argc, char** argv)
{
    const std::vector<Job> reference{{{1,0,5},1},{{2,1,3},2},{{3,2,4},0},{{4,4,2},3}};
    if (argc == 2) {
        std::cout << simulate_cpu(static_cast<Policy>(std::stoi(argv[1])), 2, reference);
        return 0;
    }
    expect(simulate_cpu(Policy::fcfs, 2, reference), "\"waiting\":4.5,\"turnaround\":8");
    expect(simulate_cpu(Policy::sjf, 2, reference), "\"waiting\":3.75,\"turnaround\":7.25");
    expect(simulate_cpu(Policy::rr, 2, reference), "\"waiting\":6.75,\"turnaround\":10.25");
    expect(simulate_cpu(Policy::srtf, 2, {{{1,0,5},0},{{2,1,1},0}}), "\"type\":\"preempt\"");
    expect(simulate_cpu(Policy::priority, 2, {{{2,2,1},1},{{1,2,1},1},{{3,2,1},0}}),
           "{\"start\":0,\"end\":2,\"pid\":0},{\"start\":2,\"end\":3,\"pid\":3},{\"start\":3,\"end\":4,\"pid\":1}");
    expect(simulate_cpu(Policy::rr, 0, reference), "invalid_quantum");
    expect(simulate_cpu(Policy::fcfs, 2, {}), "process_count");
    expect(simulate_cpu(Policy::fcfs, 2, {{{1,0,0},0}}), "invalid_process");
    expect(simulate_cpu(Policy::fcfs, 2, {{{1,0,1},0},{{1,0,1},0}}), "invalid_pid");
    for (const auto policy : {Policy::sjf, Policy::rr}) {
        std::vector<Process> originals;
        for (const auto& job : reference) originals.push_back(job.process);
        const auto stats = policy == Policy::sjf ? CPUScheduler::sjf_non_preemptive(originals)
                                                 : CPUScheduler::round_robin(originals, 2);
        const auto trace = simulate_cpu(policy, 2, reference);
        for (const auto& p : originals) {
            expect(trace, "{\"pid\":" + std::to_string(p.id) + ",\"waiting\":" + std::to_string(p.waiting) +
                   ",\"turnaround\":" + std::to_string(p.turnaround) + ",\"response\":" +
                   std::to_string(p.start - p.arrival) + ",\"finish\":" + std::to_string(p.finish));
        }
        const auto fairness = std::stod(trace.substr(trace.find("\"fairness\":") + 11));
        if (std::abs(fairness - stats.jain_fairness) > 1e-10)
            throw std::runtime_error("Jain index differs from the CLI");
    }
}
