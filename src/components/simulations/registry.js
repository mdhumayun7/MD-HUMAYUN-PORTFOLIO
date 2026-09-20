import { lazy } from 'react'

// ===========================================================================
//  SIMULATION REGISTRY
//
//  TO ADD A SIMULATION:
//    1. create src/components/simulations/MyThingSim.jsx
//       -> default-export nothing; export a named component
//       -> wrap your UI in <SimShell title note onReset controls>
//    2. add one line to the map below
//    3. set `simulationId: 'my-thing'` on the project in src/data/projects.js
//
//  Components are lazy-loaded, so a demo only downloads when a visitor
//  scrolls to the project that uses it.
// ===========================================================================

export const simulations = {
  'swarm-commander': lazy(() =>
    import('./SwarmCommanderSim').then((m) => ({ default: m.SwarmCommanderSim })),
  ),
  'ddos-pipeline': lazy(() =>
    import('./DdosPipelineSim').then((m) => ({ default: m.DdosPipelineSim })),
  ),
  'latent-space': lazy(() =>
    import('./LatentSpaceSim').then((m) => ({ default: m.LatentSpaceSim })),
  ),
  'threshold-sweep': lazy(() =>
    import('./ThresholdSweepSim').then((m) => ({ default: m.ThresholdSweepSim })),
  ),
  'rag-retrieval': lazy(() =>
    import('./RagRetrievalSim').then((m) => ({ default: m.RagRetrievalSim })),
  ),
}

export function getSimulation(id) {
  return id ? simulations[id] || null : null
}
