//
// Copyright 2023 DXOS.org
//

import { type PluginMeta } from '@dxos/app-framework';

export const SHEET_PLUGIN = 'dxos.org/plugin/sheet';

export default {
  id: SHEET_PLUGIN,
  name: 'Sheet',
  description: 'A simple spreadsheet plugin.',
  icon: 'ph--grid-nine--regular',
  source: 'https://github.com/dxos/dxos/tree/main/packages/plugins/plugin-sheet',
} satisfies PluginMeta;
