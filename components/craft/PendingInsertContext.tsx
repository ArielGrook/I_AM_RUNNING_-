'use client';

import { useEditor } from '@craftjs/core';
import React, { createContext, useCallback, useContext, useState } from 'react';

type ComponentMap = Record<string, React.ComponentType<any>>;

type PendingInsertContextValue = {
  pendingComponent: string | null;
  setPendingComponent: (name: string | null) => void;
  insertComponent: (componentName: string, position: number) => void;
  rootContainerId: string | null;
  sectionIds: string[];
};

const PendingInsertContext = createContext<PendingInsertContextValue | null>(null);

export function usePendingInsert() {
  const ctx = useContext(PendingInsertContext);
  if (!ctx) {
    throw new Error('usePendingInsert must be used within PendingInsertProvider');
  }
  return ctx;
}

export function PendingInsertProvider({
  componentMap,
  children,
}: {
  componentMap: ComponentMap;
  children: React.ReactNode;
}) {
  const { query, actions } = useEditor();
  const [pendingComponent, setPendingComponent] = useState<string | null>(null);

  const nodes = useEditor((state) => state.nodes) ?? {};
  const rootNode = nodes['ROOT'];
  const rootChildIds = (rootNode?.data?.nodes ?? []) as string[];
  const rootContainerId = rootChildIds[0] ?? null;
  const rootContainer = rootContainerId ? nodes[rootContainerId] : null;
  const sectionIds = (rootContainer?.data?.nodes ?? []) as string[];

  const insertComponent = useCallback(
    (componentName: string, position: number) => {
      const Component = componentMap[componentName];
      if (!Component || !rootContainerId) return;
      try {
        const nodeTree = query
          .parseReactElement(React.createElement(Component))
          .toNodeTree();
        actions.addNodeTree(nodeTree, rootContainerId, position);
      } catch (err) {
        console.error('Insert component failed:', err);
      }
      setPendingComponent(null);
    },
    [componentMap, rootContainerId, query, actions]
  );

  const value: PendingInsertContextValue = {
    pendingComponent,
    setPendingComponent,
    insertComponent,
    rootContainerId,
    sectionIds,
  };

  return (
    <PendingInsertContext.Provider value={value}>
      {children}
    </PendingInsertContext.Provider>
  );
}
