# Referencia web de Kernel-Sim 2.0

## Alcance

Inicio y planificación de CPU son la referencia de interfaz para las siguientes etapas. El resto de los accesos del espacio de trabajo muestran su estado pendiente. La aplicación funciona en el navegador con recursos locales y sin backend.

## Compilación

Requisitos para esta etapa: CMake, C++20, Ninja, Emscripten **4.0.15** y Node.js **22**. Activa el SDK de Emscripten en la terminal antes de ejecutar `emcmake`. En Windows con MSYS2 UCRT64, añade su directorio `bin` al `PATH` antes de configurar CMake.

```sh
cmake -S . -B out/native -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build out/native
ctest --test-dir out/native --output-on-failure

emcmake cmake -S . -B out/wasm -G Ninja -DCMAKE_BUILD_TYPE=Release
cmake --build out/wasm

cd web
npm ci
npm run dev
```

La CLI sigue en `build/kernel_cli` (`.exe` en Windows). WebAssembly y su cargador se generan en `web/public/engine/`. La compilación de producción copia ambos a `web/dist/engine/`. Si ya se dispone de `web/dist/`, sirve ese directorio por HTTP para abrir la aplicación.

## Verificación

```sh
cd web
NATIVE_CPU_TRACE=../out/native/cpu_trace_test npm test
npm run build
npx playwright install chromium
npm run e2e
```

En PowerShell, asigna `$env:NATIVE_CPU_TRACE = (Resolve-Path ../out/native/cpu_trace_test.exe).Path` antes de `npm test`. Con esta variable, Vitest compara los resultados, segmentos y todos los eventos del motor nativo con los de WebAssembly para las cinco políticas. El workflow de GitHub Actions prepara el artefacto de Pages cuando pasan sus verificaciones.

Para la carga de referencia, los promedios de espera y retorno son:

| Política | Espera | Retorno |
|---|---:|---:|
| FCFS | 4.50 | 8.00 |
| SJF | 3.75 | 7.25 |
| Round Robin, quantum 2 | 6.75 | 10.25 |

## Auditoría de la base

La primera compilación local falló al invocar GNU C++ con un `PATH` incompleto. El árbol original compiló al anteponer `C:\msys64\ucrt64\bin`. Se ejecutaron los comandos originales `help`, `sched sjf`, `sched rr` y `exit`.

| Área | Interfaz original | Consideración para la web |
|---|---|---|
| CPU y procesos | `CPUScheduler` escribe resultados finales en `Process`. `ProcessManager` controla procesos y reloj de la CLI. | El planificador anterior carece de trazas y usa un modelo distinto del administrador de procesos. Se conserva la CLI y se reutilizan `Process` y el cálculo de Jain. |
| Memoria | `PagerSimulator` ejecuta FIFO, LRU y PFF. `FrameAllocator` asigna marcos y `BuddyAllocator` administra el heap. | PFF se tratará como política adaptativa. Las trazas de páginas y bloques requieren adaptadores distintos. |
| Disco | `DiskScheduler` ejecuta FCFS y SSTF con llegada, servicio y cilindro. | Conservar el modelo de solicitudes al añadir políticas y escenarios dinámicos. |
| E/S | `Device` y `Printer` gestionan solicitudes y trabajos de impresión. | El adaptador web necesita un reloj lógico y estados serializables. |
| Sincronización | `ProducerConsumer` y `DiningPhilosophers` usan hilos nativos. | Los experimentos web requieren una simulación determinista de concurrencia. |

## Flujo de ejecución

Vue edita la carga en Pinia. Al ejecutar, el estado envía una copia de la configuración a un Web Worker. El Worker carga Emscripten, pasa los enteros a C++ y devuelve la traza con segmentos, snapshots y métricas. Los nombres de proceso se conservan como etiquetas de presentación. Cada edición invalida las trazas y respuestas anteriores. El controlador de reproducción mueve un cursor sobre snapshots, por lo que la velocidad y el retroceso no afectan los resultados.

Cada evento tiene ID ascendente, módulo, instante lógico, código de explicación, PID asociado, proceso activo, cola y estado por proceso. El Gantt representa segmentos de ejecución o inactividad. Al seleccionar uno, se recupera el snapshot del comienzo del segmento. La interfaz muestra los ocho eventos más recientes hasta el cursor.

## Reglas y métricas

- Cada tick se cierra primero con una finalización si corresponde. Se incorporan llegadas en orden de PID y después se procesa el vencimiento del quantum o la expropiación. Se despacha antes de consumir el siguiente tick.
- La cola FCFS usa orden de llegada y PID. Round Robin preserva el orden FIFO y reinserta al proceso después de las nuevas llegadas. SJF, SRTF y prioridad desempatan por llegada y luego por PID. SRTF expropia solo cuando el trabajo restante es estrictamente menor. En prioridad, un valor menor indica mayor prioridad.
- Retorno = finalización − llegada. Espera = retorno − ráfaga. Respuesta = primer despacho − llegada. Sus medias incluyen todos los procesos.
- Utilización = ticks ocupados / duración. Rendimiento = procesos terminados / duración. La duración empieza en cero e incluye la inactividad.
- Un cambio de contexto se cuenta por una transición directa entre PID distintos. La entrada o salida de inactividad y la renovación de quantum para el mismo PID no incrementan el contador. El cambio tiene costo temporal cero.
- La equidad sigue el índice de Jain de la CLI sobre ráfaga / retorno, el inverso de la desaceleración.
- Se aceptan entre 1 y 24 procesos, PIDs únicos de 1 a 9999, llegadas de 0 a 200, ráfagas de 1 a 100, prioridades de 0 a 99 y quantum de 1 a 100. Como máximo se simulan 2600 ticks. Los escenarios son deterministas.
- El modelo web de CPU usa ráfagas únicas sin E/S. Los experimentos que dependan de bloqueos pertenecen a una etapa posterior.

## Créditos

Kernel-Sim original por [@Alejossss](https://github.com/Alejossss).
