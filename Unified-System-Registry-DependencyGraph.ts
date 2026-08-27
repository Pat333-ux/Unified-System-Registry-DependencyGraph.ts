// Unified-System-Registry-DependencyGraph.ts
// Deterministic dependency graph for Beast System 3.0.
// Validates engine→engine dependencies, detects cycles, and ensures
// invariant‑aligned structural integrity.

import {
  UnifiedSystemRegistry,
  EngineDeclaration,
  EngineId
} from "./Unified-System-Registry-Core";

export class DependencyGraph {
  constructor(private readonly registry: UnifiedSystemRegistry) {}

  build(): Map<EngineId, ReadonlyArray<EngineId>> {
    const graph = new Map<EngineId, ReadonlyArray<EngineId>>();

    for (const engine of this.registry.listEngines()) {
      graph.set(engine.id, engine.dependsOn);
    }

    return graph;
  }

  detectCycles(): ReadonlyArray<ReadonlyArray<EngineId>> {
    const graph = this.build();
    const visited = new Set<EngineId>();
    const stack = new Set<EngineId>();
    const cycles: EngineId[][] = [];

    const visit = (node: EngineId) => {
      if (stack.has(node)) {
        cycles.push([...stack, node]);
        return;
      }

      if (visited.has(node)) return;

      visited.add(node);
      stack.add(node);

      const deps = graph.get(node) ?? [];
      for (const dep of deps) {
        visit(dep);
      }

      stack.delete(node);
    };

    for (const engine of graph.keys()) {
      visit(engine);
    }

    return cycles;
  }

  assertNoCycles(): void {
    const cycles = this.detectCycles();
    if (cycles.length > 0) {
      throw new Error(
        `Deterministic violation: dependency cycles detected: ${JSON.stringify(
          cycles
        )}`
      );
    }
  }

  dependenciesOf(engineId: EngineId): ReadonlyArray<EngineId> {
    const graph = this.build();
    const deps = graph.get(engineId);
    if (!deps) throw new Error(`Engine not found: ${engineId}`);
    return deps;
  }
}

// Example usage
export function createDependencyGraph(reg: UnifiedSystemRegistry) {
  const graph = new DependencyGraph(reg);
  graph.assertNoCycles();
  return graph.build();
}
