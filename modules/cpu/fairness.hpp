#pragma once
#include <algorithm>

namespace os::cpu
{
    // Jain's index over inverse slowdown, as defined by the original CLI.
    class InverseSlowdownFairness {
    public:
        void add(int burst, int turnaround)
        {
            const double utility = static_cast<double>(std::max(1, burst)) / std::max(1, turnaround);
            sum += utility;
            squares += utility * utility;
            ++count;
        }

        double value() const
        {
            return squares > 0.0 ? sum * sum / (count * squares) : 1.0;
        }

    private:
        double sum = 0.0;
        double squares = 0.0;
        int count = 0;
    };
}
