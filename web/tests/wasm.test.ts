import { execFileSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import createEngine from '../public/engine/kernel_engine.mjs'
import { execute, type Input, type Trace } from '../src/engine'
import { demo } from '../src/store'

const engine = await createEngine()
const run = (policy: number, input = demo()) => execute(engine, { ...input, policy })

describe('C++ WebAssembly scheduler', () => {
  it.each([[0,4.5,8],[1,3.75,7.25],[3,6.75,10.25]])('matches reference policy %i', (policy, waiting, turnaround) => {
    expect(run(policy)).toMatchObject({ metrics: { waiting, turnaround }, duration: 14 })
  })
  it('queues arrivals before a process with an expired quantum', () => {
    const trace = run(3) as Trace
    expect(trace.events.find(e => e.time === 2 && e.type === 'quantum')?.ready).toEqual([2,3,1])
    expect(trace.events.map(e => e.id)).toEqual(trace.events.map((_, i) => i))
  })
  it('validates duplicate identifiers and fractions', () => {
    const input = demo()
    input.jobs[1].pid = 1
    expect(run(0, input)).toEqual({ error:'invalid_pid' })
    input.jobs[1].pid = 2
    input.jobs[1].arrival = 1.5
    expect(run(0, input)).toEqual({ error:'invalid_process' })
  })
  it('reports idle time, legal limits and direct context switches', () => {
    const jobs = [{ pid:1, name:'P1', arrival:2, burst:2, priority:0 }, { pid:2, name:'P2', arrival:6, burst:2, priority:0 }]
    expect(run(0, { quantum:2, policy:0, jobs })).toMatchObject({
      segments:[{start:0,end:2,pid:0},{start:2,end:4,pid:1},{start:4,end:6,pid:0},{start:6,end:8,pid:2}],
      metrics:{ utilization:0.5, switches:0, response:0 },
    })
    const maxInput: Input = { policy:3, quantum:1, jobs:Array.from({length:24},(_,i) => ({pid:i+1,name:'P'+(i+1),arrival:200,burst:100,priority:99})) }
    expect(run(3,maxInput)).toMatchObject({ duration:2600 })
    maxInput.jobs.push({ ...maxInput.jobs[0], pid:25 })
    expect(run(3,maxInput)).toEqual({ error:'process_count' })
  })
})

it.skipIf(!process.env.NATIVE_CPU_TRACE).each([0,1,2,3,4])('matches the complete native trace for policy %i', policy => {
  const serialized = execFileSync(process.env.NATIVE_CPU_TRACE!, [String(policy)], { encoding:'utf8' })
  expect(run(policy)).toEqual(JSON.parse(serialized))
})
