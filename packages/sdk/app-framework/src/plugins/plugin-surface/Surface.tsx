//
// Copyright 2022 DXOS.org
//

import React, {
  Fragment,
  type ForwardedRef,
  type PropsWithChildren,
  type ReactNode,
  Suspense,
  createContext,
  forwardRef,
  isValidElement,
  memo,
  useContext,
  useEffect,
  useState,
} from 'react';

import { raise } from '@dxos/debug';
import { log } from '@dxos/log';

import { ErrorBoundary } from './ErrorBoundary';
import { type SurfaceComponent, type SurfaceResult, useSurfaceRoot } from './SurfaceRootContext';

/**
 * Direction determines how multiple components are laid out.
 */
export type Direction = 'inline' | 'inline-reverse' | 'block' | 'block-reverse';

/**
 * SurfaceProps are the props that are passed to the Surface component.
 */
export type SurfaceProps = PropsWithChildren<{
  /**
   * Optional ID for debugging.
   */
  id?: string;

  /**
   * Role defines how the data should be rendered.
   */
  role?: string;

  /**
   * Names allow nested surfaces to be specified in the parent context, similar to a slot.
   * Defaults to the value of `role` if not specified.
   */
  name?: string;

  /**
   * The data to be rendered by the surface.
   */
  data?: Record<string, unknown>;

  /**
   * Configure nested surfaces (indexed by the surface's `name`).
   */
  surfaces?: Record<string, Pick<SurfaceProps, 'data' | 'surfaces'>>;

  /**
   * If specified, the Surface will be wrapped in an error boundary.
   * The fallback component will be rendered if an error occurs.
   */
  fallback?: ErrorBoundary['props']['fallback'];

  /**
   * If specified, the Surface will be wrapped in a suspense boundary.
   * The placeholder component will be rendered while the surface component is loading.
   */
  placeholder?: ReactNode;

  /**
   * If more than one component is resolved, the limit determines how many are rendered.
   */
  limit?: number | undefined;

  /**
   * If more than one component is resolved, the direction determines how they are laid out.
   * NOTE: This is not yet implemented.
   */
  direction?: Direction;

  /**
   * Additional props to pass to the component.
   * These props are not used by Surface itself but may be used by components which resolve the surface.
   */
  [key: string]: unknown;
}>;

let count = 0;

/**
 * A surface is a named region of the screen that can be populated by plugins.
 */
export const Surface = memo(
  forwardRef<HTMLElement, SurfaceProps>(
    ({ id: _id, role, name = role, fallback, placeholder, ...rest }, forwardedRef) => {
      const props = { role, name, fallback, ...rest };
      const { debugInfo } = useSurfaceRoot();

      // Track debug info.
      const [id] = useState<string>(() => _id ?? `surface-${++count}`);
      useEffect(() => {
        debugInfo?.set(id, { id, created: Date.now(), name, role, renderCount: 0 });
        return () => {
          debugInfo?.delete(id);
        };
      }, [id]);

      if (debugInfo?.get(id)) {
        debugInfo.get(id)!.renderCount++;
      }

      const context = useContext(SurfaceContext);
      const data = props.data ?? ((name && context?.surfaces?.[name]?.data) || {});

      const resolver = <SurfaceResolver {...props} id={id} ref={forwardedRef} />;
      const suspense = placeholder ? <Suspense fallback={placeholder}>{resolver}</Suspense> : resolver;

      return fallback ? (
        <ErrorBoundary data={data} fallback={fallback}>
          {suspense}
        </ErrorBoundary>
      ) : (
        suspense
      );
    },
  ),
);

const SurfaceContext = createContext<SurfaceProps | undefined>(undefined);

export const useSurface = (): SurfaceProps =>
  useContext(SurfaceContext) ?? raise(new Error('Surface context not found'));

/**
 * Root surface component.
 */
const SurfaceResolver = forwardRef<HTMLElement, SurfaceProps>((props, forwardedRef) => {
  const { components } = useSurfaceRoot();
  const parent = useContext(SurfaceContext);
  const nodes = resolveNodes(components, props, parent, forwardedRef);
  const currentContext: SurfaceProps = {
    ...props,
    surfaces: {
      ...((props.name && parent?.surfaces?.[props.name]?.surfaces) || {}),
      ...props.surfaces,
    },
  };

  return <SurfaceContext.Provider value={currentContext}>{nodes}</SurfaceContext.Provider>;
});

/**
 * Resolve surface nodes from across all component.
 */
const resolveNodes = (
  components: Record<string, SurfaceComponent>,
  props: SurfaceProps,
  context: SurfaceProps | undefined,
  forwardedRef: ForwardedRef<HTMLElement>,
): ReactNode[] => {
  const data = {
    ...((props.name && context?.surfaces?.[props.name]?.data) || {}),
    ...props.data,
  };

  const candidates = Object.entries(components)
    .map(([key, component]): [string, SurfaceResult] | undefined => {
      // TODO(burdon): Avoid variable return types in plugin contract.
      const result = component({ ...props, data }, forwardedRef);
      if (!result || typeof result !== 'object') {
        return undefined;
      }

      // Normalize tuple.
      if ('node' in result) {
        return [key, result];
      } else if (isValidElement(result)) {
        return [key, { node: result }];
      } else {
        log.warn('invalid result', { result });
        return undefined;
      }
    })
    .filter((result): result is [string, SurfaceResult] => Boolean(result))
    .sort(([, { disposition: a = 'default' }], [, { disposition: b = 'default' }]) => {
      return a === b ? 0 : a === 'hoist' || b === 'fallback' ? -1 : b === 'hoist' || a === 'fallback' ? 1 : 0;
    });

  // TODO(burdon): Does this prematurely process the node?
  const nodes = candidates.map(([key, result]) => <Fragment key={key}>{result.node}</Fragment>);
  return props.limit ? nodes.slice(0, props.limit) : nodes;
};