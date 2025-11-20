# Kernel-Sim 🧵🧠

**Kernel-Sim** es un mini simulador de sistema operativo pensado para practicar conceptos de un kernel real desde la consola:  
procesos, planificación de CPU, memoria, disco, E/S y sincronización.

Todo se maneja con comandos de texto en una consola interactiva, así que puedes “jugar” con los algoritmos sin tener que escribir código extra.

---

## Funcionalidades principales

Desde la consola puedes:

- 🧾 **Gestionar procesos**

  - Crear procesos con nombre, ráfaga de CPU y tiempo de llegada.
  - Ver la tabla de procesos y sus colas.
  - Simular el paso del tiempo con un “reloj” (`run`).

- ⏱️ **Probar planificadores de CPU**

  - Comparar **SJF** (Shortest Job First) y **Round Robin**.
  - Ver tiempos de espera, retorno y una métrica de “justicia” entre procesos.

- 🧠 **Simular memoria**

  - Fallos de página con **FIFO** y **LRU**.
  - Política adaptativa **PFF** (Page Fault Frequency).
  - Asignación de marcos por proceso (igualitaria y proporcional).
  - Un **heap tipo Buddy** para ver cómo se reparte la memoria dinámica.

- 💽 **Simular disco**

  - Recorrido del cabezal con **FCFS** y **SSTF**.
  - Generar salida en CSV para analizar los resultados.

- 🖨️ **Cola de impresión**

  - Pequeña simulación de una impresora con trabajos en cola.

- 🔁 **Sincronización**
  - Problema **Productor–Consumidor** con buffer limitado.
  - Problema de los **Filósofos comensales**.

---

## Requisitos

Para compilar y ejecutar el proyecto necesitas:

- **CMake** 3.15 o superior.
- Un compilador **C++ moderno con soporte C++20**  
  (por ejemplo: g++ 11+, clang 12+ o Visual Studio 2019+).
- Opcional, solo si quieres usar el script de gráficas:
  - **Python 3**
  - Paquetes: `pandas` y `matplotlib`

---

## Cómo compilar

Desde la carpeta raíz del proyecto:

```bash
cmake -S . -B build
cmake --build build
```

Esto generará el ejecutable en la carpeta `build/`:

- En Linux / macOS / WSL: `build/kernel_cli`
- En Windows: `build\kernel_cli.exe`

---

## Cómo ejecutar

Después de compilar:

```bash
# Linux / macOS / WSL
./build/kernel_cli

# Windows
.\build\kernel_cli.exe
```

Verás algo como:

```text
Consola de Kernel-Sim
Escribe 'help' para ver ayuda.
os>
```

- Escribe `help` para mostrar todos los comandos disponibles.
- Escribe `exit` o `quit` para salir.

---

## Primeros pasos (ejemplos rápidos)

### 1. Procesos y ejecución básica

```text
os> proc crear web 6 0
os> proc crear db  10 1
os> proc crear io  4 3
os> proc tabla
os> proc colas
os> proc run 8
os> proc tabla
```

- `proc crear <nombre> <rafaga> <llegada>`: crea un proceso.
- `proc tabla`: muestra la tabla de procesos.
- `proc run <ticks>`: avanza el “reloj” del simulador.

---

### 2. Planificador de CPU (SJF y Round Robin)

```text
# SJF (no expropiativo)
os> sched sjf  1,0,6  2,1,3  3,2,8  4,4,2

# Round Robin con quantum 3
os> sched rr 3  1,0,9  2,2,4  3,3,5  4,5,2
```

Cada tupla es `id,llegada,rafaga`.  
El simulador imprime una tabla con los tiempos de cada proceso.

---

### 3. Memoria (FIFO / LRU / PFF)

```text
# FIFO con 3 marcos
os> mem fifo 3  7 0 1 2 0 3 0 4 2 3 0 3 2

# LRU con 3 marcos
os> mem lru 3  7 0 1 2 0 3 0 4 2 3 0 3 2
```

El programa muestra la referencia de páginas, los fallos, aciertos y tasas.

También puedes generar un CSV para luego graficar:

```text
os> mem csv fifo demo_fifo  3  7 0 1 2 0 3 0 4 2 3 0 3 2
```

Esto crea un archivo `demo_fifo.csv` con datos de marcos y fallos.

---

### 4. Disco (FCFS / SSTF)

```text
# FCFS
os> disk fcfs 50  1,0,5,80  2,1,3,20  3,2,4,120

# SSTF
os> disk sstf 50  1,0,5,80  2,1,3,20  3,2,4,120
```

Donde cada tupla es `id,llegada,servicio,cilindro` y el primer número (`50`) es la posición inicial del cabezal.

---

### 5. Sincronización

Productor–Consumidor:

```text
os> sync pc start 3 2 5 100 150 --silencio
os> sync pc stat
os> sync pc stop
```

Filósofos comensales:

```text
os> sync ph start 5 200 200 --silencio
os> sync ph stat
os> sync ph stop
```

---

## Scripts de ejemplo

En la carpeta `scripts/` hay archivos de texto con secuencias de comandos listas para copiar/pegar:

- `full_demo.txt` – recorrido completo por la mayoría de funcionalidades.
- `proc_sjf_vs_rr.txt` – ejemplos de comparación de planificadores.
- `mem_fifo_lru_pff.txt` – pruebas rápidas de memoria.
- `disk_fcfs_sstf.txt` – pruebas de disco.

> No son scripts ejecutables; la idea es abrirlos y copiar los bloques a la consola de `Kernel-Sim`.

---

## Gráfica de fallos vs marcos (opcional)

Si quieres ver una gráfica a partir de un CSV generado con `mem csv`, usa el script de Python:

```bash
pip install -r requirements.txt

python scripts/fallos_vs_marcos.py demo_fifo.csv
```

El script espera que el CSV tenga al menos las columnas `frames` y `faults`.

---

## Estructura del proyecto

```text
cli/           # Programa principal y consola interactiva
modules/
  cpu/         # Procesos y planificación de CPU
  mem/         # Memoria: páginas, asignación, heap Buddy
  disk/        # Algoritmos de planificación de disco
  io/          # Simulación simple de impresora
  sync/        # Productor–consumidor y filósofos comensales
  common/      # Tipos y utilidades compartidas
docs/          # Notas y explicaciones de algunos módulos
scripts/       # Comandos de ejemplo y utilidades en Python
CMakeLists.txt # Configuración de CMake
```

---

## Notas finales

- El objetivo del proyecto es **didáctico**: que puedas ver “en vivo” cómo se comportan los algoritmos típicos de un sistema operativo.
- Si algo no compila en tu entorno, revisa que tu compilador tenga soporte para **C++20**.
