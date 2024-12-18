//
// Copyright 2023 DXOS.org
//

import { type PluginMeta } from '@dxos/app-framework';

export const CHESS_PLUGIN = 'dxos.org/plugin/chess';

export default {
  id: CHESS_PLUGIN,
  name: 'Chess',
  description: 'Play chess.',
  icon: 'ph--shield-chevron--regular',
  source: 'https://github.com/dxos/dxos/tree/main/packages/plugins/plugin-chess',
} satisfies PluginMeta;
