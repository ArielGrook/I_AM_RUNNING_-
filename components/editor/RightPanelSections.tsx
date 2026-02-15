'use client';

import React, { useCallback } from 'react';
import { usePuck } from '@puckeditor/core';
import { AnimationControls, type AnimationValue } from '@/components/editor/AnimationControls';
import { GradientBuilder } from '@/components/editor/GradientBuilder';
import type { PuckData } from '@/components/editor/PuckEditor';

function getContentFromData(data: PuckData): Array<{ type?: string; props?: Record<string, unknown>; id?: string }> {
  const content = data.content as unknown;
  if (Array.isArray(content)) return content;
  const root = data.root as Record<string, unknown> | undefined;
  if (root?.props && typeof root.props === 'object') {
    const props = root.props as Record<string, unknown>;
    const zone = props.zone as { content?: unknown[] } | undefined;
    if (zone?.content && Array.isArray(zone.content)) return zone.content;
    if (Array.isArray(props.content)) return props.content;
  }
  return [];
}

function setContentInData(data: PuckData, index: number, updateProps: (props: Record<string, unknown>) => Record<string, unknown>): PuckData {
  const content = getContentFromData(data);
  if (index < 0 || index >= content.length) return data;
  const nextContent = content.map((item, i) =>
    i === index ? { ...item, props: updateProps((item.props as Record<string, unknown>) || {}) } : item
  );
  if (Array.isArray(data.content)) return { ...data, content: nextContent };
  const root = data.root as Record<string, unknown> | undefined;
  if (root?.props && typeof root.props === 'object') {
    const props = root.props as Record<string, unknown>;
    const zone = props.zone as { content?: unknown[] } | undefined;
    if (zone?.content) {
      return { ...data, root: { ...root, props: { ...props, zone: { ...zone, content: nextContent } } } };
    }
    if (Array.isArray(props.content)) return { ...data, root: { ...root, props: { ...props, content: nextContent } } };
  }
  return { ...data, content: nextContent };
}

export function RightPanelSections({ itemSelector, children }: { itemSelector: { index: number; zone?: string } | null; children: React.ReactNode }) {
  const { appState, dispatch } = usePuck();
  const { data } = appState as { data: PuckData };
  const content = getContentFromData(data);
  const selectedItem = itemSelector != null && itemSelector.index >= 0 && itemSelector.index < content.length ? content[itemSelector.index] : null;
  const selectedProps = (selectedItem?.props as Record<string, unknown>) || {};
  const index = itemSelector?.index ?? -1;

  const setSelectedProps = useCallback(
    (patch: Record<string, unknown>) => {
      if (index < 0) return;
      dispatch({
        type: 'setData',
        data: (prev: PuckData) => setContentInData(prev, index, (props) => ({ ...props, ...patch })),
      } as { type: 'setData'; data: PuckData | ((prev: PuckData) => PuckData) });
    },
    [dispatch, index]
  );

  if (itemSelector == null || selectedItem == null) {
    return <>{children}</>;
  }

  const animationValue = (selectedProps.animation as AnimationValue | undefined) ?? null;
  const backgroundGradient = (selectedProps.backgroundGradient as string | undefined) ?? '';

  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Animations</h3>
        <AnimationControls value={animationValue} onChange={(v) => setSelectedProps({ animation: v })} />
      </section>
      <section className="space-y-3">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Advanced styles</h3>
        <div className="space-y-2">
          <span className="text-xs text-gray-600 dark:text-[#e5e5e5]">Background gradient</span>
          <GradientBuilder value={backgroundGradient} onChange={(v) => setSelectedProps({ backgroundGradient: v })} />
        </div>
      </section>
      {children}
    </div>
  );
}
