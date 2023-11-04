//
// Copyright 2023 DXOS.org
//

import { Code, type IconProps } from '@phosphor-icons/react';
import React from 'react';

import { SPACE_PLUGIN, SpaceAction } from '@braneframe/plugin-space';
import { Folder, Script as ScriptType } from '@braneframe/types';
import { resolvePlugin, type PluginDefinition, parseIntentPlugin, LayoutAction } from '@dxos/app-framework';
import { type Filter, type EchoObject, type Schema, TextObject, isTypedObject } from '@dxos/client/echo';

import { ScriptMain, ScriptSection } from './components';
import translations from './translations';
import { SCRIPT_PLUGIN, ScriptAction, type ScriptPluginProvides } from './types';

// TODO(burdon): Make generic and remove need for filter.
const isObject = <T extends EchoObject>(object: unknown, schema: Schema, filter: Filter<T>): T | undefined => {
  return isTypedObject(object) && object.__typename === schema.typename ? (object as T) : undefined;
};

export type ScriptPluginProps = {
  mainUrl: string;
};

export const ScriptPlugin = ({ mainUrl }: ScriptPluginProps): PluginDefinition<ScriptPluginProvides> => {
  return {
    meta: {
      id: SCRIPT_PLUGIN,
    },
    provides: {
      metadata: {
        records: {
          [ScriptType.schema.typename]: {
            placeholder: ['object title placeholder', { ns: SCRIPT_PLUGIN }],
            icon: (props: IconProps) => <Code {...props} />,
          },
        },
      },
      translations,
      graph: {
        builder: ({ parent, plugins }) => {
          if (!(parent.data instanceof Folder)) {
            return;
          }

          const intentPlugin = resolvePlugin(plugins, parseIntentPlugin);

          parent.actionsMap[`${SPACE_PLUGIN}/create`]?.addAction({
            id: `${SCRIPT_PLUGIN}/create`,
            label: ['create object label', { ns: SCRIPT_PLUGIN }],
            icon: (props) => <Code {...props} />,
            invoke: () =>
              intentPlugin?.provides.intent.dispatch([
                {
                  plugin: SCRIPT_PLUGIN,
                  action: ScriptAction.CREATE,
                },
                {
                  action: SpaceAction.ADD_TO_FOLDER,
                  data: { folder: parent.data },
                },
                {
                  action: LayoutAction.ACTIVATE,
                },
              ]),
            properties: {
              testId: 'scriptPlugin.createObject',
            },
          });
        },
      },
      stack: {
        creators: [
          {
            id: 'create-stack-section-script',
            testId: 'scriptPlugin.createSectionSpaceScript',
            label: ['create stack section label', { ns: SCRIPT_PLUGIN }],
            icon: (props: any) => <Code {...props} />,
            intent: {
              plugin: SCRIPT_PLUGIN,
              action: ScriptAction.CREATE,
            },
          },
        ],
      },
      surface: {
        component: (data, role) => {
          switch (role) {
            case 'main':
              return isObject(data.active, ScriptType.schema, ScriptType.filter()) ? (
                <ScriptMain source={(data.active as any).source} mainUrl={mainUrl} />
              ) : null;
            case 'slide':
              return isObject(data.slide, ScriptType.schema, ScriptType.filter()) ? (
                <ScriptMain
                  source={(data.slide as any).source}
                  mainUrl={mainUrl}
                  view={'preview-only'}
                  className={'p-24'}
                />
              ) : null;
            case 'section':
              return isObject(data.object, ScriptType.schema, ScriptType.filter()) ? (
                <ScriptSection source={(data.object as any).source} mainUrl={mainUrl} className={'h-[500px] py-2'} />
              ) : null;
          }
        },
      },
      intent: {
        resolver: (intent, plugins) => {
          switch (intent.action) {
            case ScriptAction.CREATE: {
              return { object: new ScriptType({ source: new TextObject(code) }) };
            }
          }
        },
      },
    },
  };
};

const code = [
  "import React from 'react';",
  "import { Filter, useSpace, useQuery } from '@dxos/react-client/echo';",
  "import { Chart } from '@braneframe/plugin-explorer';",
  '',
  'const Component = () => {',
  '  const space = useSpace();',
  "  const objects = useQuery(space, Filter._typename('dxos.org/schema/person'));",
  '  return <Chart items={objects} accessor={object => ({ x: object.lat, y: object.lng })} />',
  '}',
  '',
  'export default Component;',
].join('\n');