import { execute, type Input } from './engine'

self.onmessage = async ({ data }: MessageEvent<{ id: number; input?: Input; url: string }>) => {
  try {
    engine ??= import(/* @vite-ignore */ data.url).then(module => module.default())
    const wasm = await engine
    self.postMessage({ id: data.id, value: data.input ? execute(wasm, data.input) : null })
  } catch (error) {
    engine = undefined
    console.error(error)
    self.postMessage({ id: data.id, value: { error: 'engine_failure' } })
  }
}
let engine: Promise<Parameters<typeof execute>[0]> | undefined
