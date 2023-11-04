//
// Copyright 2023 DXOS.org
//

import React, { useEffect, useRef } from 'react';

import { clientServiceBundle } from '@dxos/client-protocol';
import { useClient } from '@dxos/react-client';
import { createProtoRpcPeer } from '@dxos/rpc';
import { createIFramePort } from '@dxos/rpc-tunnel';

// @ts-ignore
import frameSrc from './frame.html?raw';
import { type CompilerResult } from '../../compiler';

export type FrameContainerProps = {
  mainUrl: string;
  result: CompilerResult;
};

/**
 * IFrame container for the compiled script.
 */
export const FrameContainer = ({ mainUrl, result }: FrameContainerProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Connect iframe to client.
  const client = useClient();
  useEffect(() => {
    if (iframeRef.current) {
      const port = createIFramePort({
        channel: 'frame',
        iframe: iframeRef.current,
        origin: '*',
      });

      const rpc = createProtoRpcPeer({
        exposed: clientServiceBundle,
        handlers: (client as any)._services.services, // TODO(burdon): Remove cast.
        port,
      });

      rpc.open().catch(console.error);
      return () => {
        rpc.close().catch(console.error);
      };
    }
  }, [iframeRef]);

  const html = frameSrc.replace(
    '__IMPORT_MAP__',
    JSON.stringify({
      imports: createImportMap(mainUrl, result),
    }),
  );

  return <iframe ref={iframeRef} sandbox='allow-scripts' srcDoc={html} style={{ width: '100%', height: '100%' }} />;
};

// TODO(burdon): Comment.
const createImportMap = (mainUrl: string, result: CompilerResult) => {
  const createReexportingModule = (namedImports: string[], key: string) => {
    const code = `
      const { ${namedImports.join(',')} } = window.__DXOS_SANDBOX_MODULES__[${JSON.stringify(key)}];
      export { ${namedImports.join(',')} }
      export default window.__DXOS_SANDBOX_MODULES__[${JSON.stringify(key)}].default;
    `;

    return `data:text/javascript;base64,${btoa(code)}`;
  };

  return {
    '@frame/main': mainUrl,
    '@frame/bundle': `data:text/javascript;base64,${btoa(result.bundle)}`,
    ...Object.fromEntries(
      result.imports
        ?.filter((entry) => !entry.moduleUrl!.startsWith('http'))
        .map((entry) => [entry.moduleUrl!, createReexportingModule(entry.namedImports!, entry.moduleUrl!)]) ?? [],
    ),
  };
};