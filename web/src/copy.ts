import { t } from './preferences'
const events: Record<string, [string,string]> = {
  initial: ['Initial state','Estado inicial'],
  arrival: ['Arrives and enters the ready queue','Llega y entra en la cola de listos'],
  finish: ['Completes its CPU burst','Completa su ráfaga de CPU'],
  quantum: ['Quantum expires; moves to the back of the queue','Agota su quantum y vuelve al final de la cola'],
  preempt: ['Yields to a process with less time remaining','Cede la CPU a un proceso con menos tiempo restante'],
  fcfs: ['Dispatched in arrival order','Seleccionado por orden de llegada'],
  sjf: ['Dispatched with the shortest burst','Seleccionado por la ráfaga más corta'],
  srtf: ['Dispatched with the shortest remaining time','Seleccionado por el menor tiempo restante'],
  rr: ['Dispatched from the front of the circular queue','Seleccionado desde el frente de la cola circular'],
  priority: ['Dispatched with the lowest priority number','Seleccionado por el menor número de prioridad'],
  tick: ['Continues execution','Continúa su ejecución'],
  idle: ['CPU idle: ready queue is empty','CPU inactiva: cola de listos vacía'],
}
const errors: Record<string, [string,string]> = {
  invalid_policy: ['Select a valid policy.','Selecciona una política válida.'],
  invalid_quantum: ['Quantum must be an integer from 1 to 100.','El quantum debe ser un entero entre 1 y 100.'],
  process_count: ['Add between 1 and 24 processes.','Agrega entre 1 y 24 procesos.'],
  invalid_pid: ['PIDs must be unique integers from 1 to 9999.','Los PID deben ser enteros únicos entre 1 y 9999.'],
  invalid_process: ['Check names and numeric limits for each process.','Revisa los nombres y límites numéricos de cada proceso.'],
  engine_failure: ['The WebAssembly engine could not complete the run.','El motor WebAssembly no pudo completar la ejecución.'],
}
export const reason = (code: string) => t(...(events[code] ?? [code,code]))
export const validationMessage = (code: string) => t(...(errors[code] ?? [code,code]))
export const descriptions: [string,string][] = [
  ['Runs the oldest ready process to completion.','Ejecuta hasta el final el proceso listo que lleva más tiempo esperando.'],
  ['Runs the shortest available burst to completion.','Ejecuta hasta el final la ráfaga disponible más corta.'],
  ['Preempts when a ready process has strictly less remaining work.','Expropia cuando otro proceso listo tiene estrictamente menos trabajo restante.'],
  ['Gives each ready process a fixed quantum and rotates the queue.','Asigna un quantum fijo a cada proceso listo y rota la cola.'],
  ['Runs the process with the lowest priority number to completion.','Ejecuta hasta el final el proceso con menor número de prioridad.'],
]
export const scenarios = [
  { names:['Reference workload','Carga de referencia'], detail:['Four processes with staggered arrivals.','Cuatro procesos con llegadas escalonadas.'], policy:0 },
  { names:['Convoy effect','Efecto convoy'], detail:['Compare FCFS and SJF. Short jobs can queue behind a long job.','Compara FCFS y SJF. Los trabajos cortos pueden quedar detrás de uno largo.'], policy:0, jobs:[[0,12,0],[0,2,0],[1,1,0]] },
  { names:['Starvation risk','Riesgo de inanición'], detail:['Use Priority. A continuing stream of higher-priority work could indefinitely delay P2.','Usa Prioridad. Un flujo continuo de trabajos de mayor prioridad podría demorar indefinidamente a P2.'], policy:4, jobs:[[0,3,0],[1,5,9],[2,3,0],[4,3,0],[6,3,0]] },
  { names:['Preemptive vs. non-preemptive','Expropiativo frente a no expropiativo'], detail:['Compare SJF and SRTF when a shorter job arrives while P1 is running.','Compara SJF y SRTF cuando llega un trabajo más corto mientras se ejecuta P1.'], policy:2, jobs:[[0,8,0],[2,2,0],[4,1,0]] },
] satisfies { names:[string,string]; detail:[string,string]; policy:number; jobs?:number[][] }[]
