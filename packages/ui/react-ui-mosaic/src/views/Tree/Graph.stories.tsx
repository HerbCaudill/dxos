//
// Copyright 2023 DXOS.org
//

import '@dxos-theme';

// import React from 'react';

import { faker } from '@dxos/random';
import { withLayout, withTheme } from '@dxos/storybook-utils';

import { Tree } from './Tree';
// import { GraphTree } from './testing';
// import { Mosaic } from '../../mosaic';

faker.seed(3);

export default {
  title: 'ui/react-ui-mosaic/Tree',
  component: Tree,
  // render: ({ id = 'tree', debug }: { id: string; debug: boolean }) => {
  //   return (
  //     <Mosaic.Root debug={debug}>
  //       <Mosaic.DragOverlay />
  //       <GraphTree id={id} debug={debug} />
  //     </Mosaic.Root>
  //   );
  // },
  decorators: [withTheme, withLayout({ fullscreen: true })],
  parameters: {
    layout: 'fullscreen',
  },
};

// export const Graph = {
//   args: { debug: true },
// };
