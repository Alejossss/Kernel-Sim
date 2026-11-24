export const policies = ['FCFS', 'SJF', 'SRTF', 'Round Robin', 'Priority'] as const
export interface Job { pid: number | string; name: string; arrival: number | string; burst: number | string; priority: number | string }
export interface Input { policy: number; quantum: number | string; jobs: Job[] }
export interface Snapshot { id: number; time: number; type: string; reason: string; pid: number; running: number; ready: number[]; processes: { pid: number; remaining: number; status: string }[] }
export interface Segment { start: number; end: number; pid: number }
export interface Trace {
  events: Snapshot[]
  segments: Segment[]
  results: { pid: number; waiting: number; turnaround: number; response: number; finish: number }[]
  duration: number
  metrics: Record<'waiting' | 'turnaround' | 'response' | 'throughput' | 'utilization' | 'switches' | 'fairness', number>
}
interface Engine {
  _malloc(size: number): number
  _free(pointer: number): void
  _run_cpu(policy: number, quantum: number, count: number, pointer: number): number
  HEAP32: Int32Array
  UTF8ToString(pointer: number): string
}
export type Reply = Trace | { error: string }
const base = new URL(import.meta.env.BASE_URL, globalThis.location?.origin ? globalThis.location.href : 'http://localhost/')
export const engineUrl = new URL('engine/kernel_engine.mjs', base).href

export function execute(engine: Engine, input: Input): Reply {
  if (input.jobs.length < 1 || input.jobs.length > 24) return { error: 'process_count' }
  const fields = input.jobs.flatMap(p => [p.pid, p.arrival, p.burst, p.priority])
  const numeric = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && Math.abs(v) <= 2147483647
  if (!fields.every(numeric) || input.jobs.some(p => !p.name.trim() || p.name.length > 30)) return { error: 'invalid_process' }
  if (input.policy === 3 && !numeric(input.quantum)) return { error: 'invalid_quantum' }
  if (!numeric(input.policy)) return { error: 'invalid_policy' }
  const pointer = engine._malloc(fields.length * 4)
  if (!pointer) return { error: 'engine_failure' }
  try {
    engine.HEAP32.set(fields, pointer / 4)
    return JSON.parse(engine.UTF8ToString(engine._run_cpu(input.policy, Number(input.quantum), input.jobs.length, pointer))) as Reply
  } finally {
    engine._free(pointer)
  }
}
