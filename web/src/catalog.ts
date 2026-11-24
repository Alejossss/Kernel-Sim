import { Cpu, Layers3, MemoryStick, HardDrive, Workflow, Printer, GitCompareArrows, FlaskConical, Terminal } from 'lucide-vue-next'
import { t } from './preferences'

export const modules = [
  { id:'cpu', icon:Cpu, color:'cyan', title:() => t('CPU Scheduling','Planificación de CPU'), detail:() => t('See how a scheduler shares processor time across competing processes.','Observa cómo se reparte el tiempo del procesador entre procesos.'), algorithms:['FCFS','SJF','SRTF','RR','Priority'], path:'/cpu' },
  { id:'virtual', icon:Layers3, color:'violet', title:() => t('Virtual Memory','Memoria virtual'), detail:() => t('Track page faults and compare replacement policies across frames.','Sigue los fallos de página y compara políticas de reemplazo.'), algorithms:['FIFO','LRU','Optimal','Clock','PFF'] },
  { id:'allocation', icon:MemoryStick, color:'teal', title:() => t('Memory Allocation','Asignación de memoria'), detail:() => t('Inspect memory blocks, allocation decisions and fragmentation.','Inspecciona bloques, decisiones de asignación y fragmentación.'), algorithms:['First Fit','Best Fit','Worst Fit','Buddy'] },
  { id:'disk', icon:HardDrive, color:'amber', title:() => t('Disk Scheduling','Planificación de disco'), detail:() => t('Follow the disk head as it services a queue of requests.','Sigue el cabezal de disco mientras atiende solicitudes.'), algorithms:['FCFS','SSTF','SCAN','C-SCAN','LOOK','C-LOOK'] },
  { id:'sync', icon:Workflow, color:'pink', title:() => t('Process Synchronization','Sincronización de procesos'), detail:() => t('Explore shared resources, contention and circular waits.','Explora recursos compartidos, contención y esperas circulares.'), algorithms:['Mutex','Semaphores','Deadlocks'] },
  { id:'io', icon:Printer, color:'slate', title:() => t('I/O Management','Gestión de E/S'), detail:() => t('Trace how device queues handle work over time.','Sigue cómo las colas de dispositivos despachan trabajos.'), algorithms:['Printer','Storage','Network'] },
]
export const tools = [
  { id:'compare', icon:GitCompareArrows, title:() => t('Compare Algorithms','Comparar algoritmos') },
  { id:'lab', icon:FlaskConical, title:() => t('Experiment Laboratory','Laboratorio de experimentos') },
  { id:'terminal', icon:Terminal, title:() => t('Terminal','Terminal') },
]
