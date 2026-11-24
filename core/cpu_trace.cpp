#include "cpu_trace.hpp"
#include "fairness.hpp"
#include <iomanip>
#include <locale>
#include <set>
#include <sstream>
#include <tuple>

namespace os::cpu
{
    std::string simulate_cpu(Policy policy, int quantum, const std::vector<Job>& jobs)
    {
        const auto error = [](const char* code) {
            return std::string{"{\"error\":\""} + code + "\"}";
        };
        if (policy < Policy::fcfs || policy > Policy::priority)
            return error("invalid_policy");
        if (jobs.empty() || jobs.size() > 24)
            return error("process_count");
        if (policy == Policy::rr && (quantum < 1 || quantum > 100))
            return error("invalid_quantum");

        struct State {
            Job job;
            int remaining;
            int start = -1;
            int finish = -1;
        };
        std::vector<State> states;
        std::set<int> ids;
        for (const auto& job : jobs) {
            const auto& p = job.process;
            if (p.id < 1 || p.id > 9999 || !ids.insert(p.id).second)
                return error("invalid_pid");
            if (p.arrival < 0 || p.arrival > 200 || p.burst < 1 || p.burst > 100 ||
                job.priority < 0 || job.priority > 99)
                return error("invalid_process");
            states.push_back({job, p.burst});
        }
        std::sort(states.begin(), states.end(), [](const State& a, const State& b) {
            return std::tie(a.job.process.arrival, a.job.process.id) <
                   std::tie(b.job.process.arrival, b.job.process.id);
        });

        std::vector<int> ready;
        int next = 0, running = -1, finished = 0, slice = 0;
        int switches = 0, previous = -1, busy = 0, time = 0, event = 0;
        const int count = static_cast<int>(states.size());
        const auto pid = [&](int index) { return index < 0 ? 0 : states[index].job.process.id; };
        const auto rank = [&](int index) {
            const auto& state = states[index];
            switch (policy) {
                case Policy::sjf: return state.job.process.burst;
                case Policy::srtf: return state.remaining;
                case Policy::priority: return state.job.priority;
                default: return 0;
            }
        };
        const char* selection[] = {"fcfs", "sjf", "srtf", "rr", "priority"};
        std::ostringstream out;
        out.imbue(std::locale::classic());
        out << std::setprecision(12) << "{\"events\":[";
        const auto emit = [&](const char* reason, int subject) {
            if (event) out << ',';
            out << "{\"id\":" << event++ << ",\"time\":" << time
                << ",\"module\":\"cpu\",\"type\":\"" << reason
                << "\",\"reason\":\"" << reason << "\",\"pid\":" << pid(subject)
                << ",\"running\":" << pid(running) << ",\"ready\":[";
            for (std::size_t i = 0; i < ready.size(); ++i)
                out << (i ? "," : "") << pid(ready[i]);
            out << "],\"processes\":[";
            for (int i = 0; i < count; ++i) {
                const auto& state = states[i];
                const char* status = state.finish >= 0 ? "finished" : i == running ? "running" :
                    std::find(ready.begin(), ready.end(), i) != ready.end() ? "ready" : "new";
                out << (i ? "," : "") << "{\"pid\":" << pid(i) << ",\"remaining\":"
                    << state.remaining << ",\"status\":\"" << status << "\"}";
            }
            out << "]}";
        };
        const auto order_ready = [&] {
            if (policy == Policy::rr || policy == Policy::fcfs) return;
            std::sort(ready.begin(), ready.end(), [&](int a, int b) {
                return std::pair{rank(a), a} < std::pair{rank(b), b};
            });
        };

        struct Segment { int start, end, pid; };
        std::vector<Segment> segments;
        emit("initial", -1);
        while (finished < count) {
            if (running >= 0 && states[running].remaining == 0) {
                const int completed = running;
                states[completed].finish = time;
                running = -1;
                ++finished;
                emit("finish", completed);
            }
            while (next < count && states[next].job.process.arrival == time) {
                const int arrived = next++;
                ready.push_back(arrived);
                order_ready();
                emit("arrival", arrived);
            }
            if (running >= 0 && policy == Policy::rr && slice == quantum) {
                const int expired = running;
                running = -1;
                ready.push_back(expired);
                emit("quantum", expired);
            }
            if (running >= 0 && policy == Policy::srtf && !ready.empty() &&
                rank(ready.front()) < rank(running)) {
                const int preempted = running;
                running = -1;
                ready.push_back(preempted);
                order_ready();
                emit("preempt", preempted);
            }
            if (finished == count) break;
            const bool dispatch = running < 0 && !ready.empty();
            if (dispatch) {
                running = ready.front();
                ready.erase(ready.begin());
                slice = 0;
                if (states[running].start < 0) states[running].start = time;
                if (previous >= 0 && previous != running) ++switches;
                emit(selection[static_cast<int>(policy)], running);
            } else {
                emit(running < 0 ? "idle" : "tick", running);
            }

            if (segments.empty() || dispatch || segments.back().pid != pid(running))
                segments.push_back({time, time + 1, pid(running)});
            else
                segments.back().end = time + 1;
            if (running >= 0) {
                --states[running].remaining;
                ++slice;
                ++busy;
            }
            previous = running;
            ++time;
        }

        double wait = 0, turnaround = 0, response = 0;
        InverseSlowdownFairness fairness;
        out << "],\"segments\":[";
        for (std::size_t i = 0; i < segments.size(); ++i) {
            const auto& s = segments[i];
            out << (i ? "," : "") << "{\"start\":" << s.start << ",\"end\":" << s.end
                << ",\"pid\":" << s.pid << '}';
        }
        out << "],\"results\":[";
        for (int i = 0; i < count; ++i) {
            const auto& s = states[i];
            const auto& p = s.job.process;
            const int turn = s.finish - p.arrival;
            const int waiting = turn - p.burst;
            const int first = s.start - p.arrival;
            wait += waiting;
            turnaround += turn;
            response += first;
            fairness.add(p.burst, turn);
            out << (i ? "," : "") << "{\"pid\":" << p.id << ",\"waiting\":" << waiting
                << ",\"turnaround\":" << turn << ",\"response\":" << first
                << ",\"finish\":" << s.finish << '}';
        }
        out << "],\"duration\":" << time << ",\"metrics\":{\"waiting\":" << wait / count
            << ",\"turnaround\":" << turnaround / count << ",\"response\":" << response / count
            << ",\"throughput\":" << static_cast<double>(count) / time
            << ",\"utilization\":" << static_cast<double>(busy) / time
            << ",\"switches\":" << switches << ",\"fairness\":" << fairness.value()
            << "}}";
        return out.str();
    }
}
