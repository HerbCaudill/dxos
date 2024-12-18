//
// Copyright 2023 DXOS.org
//

import '@dxos-theme';

import React from 'react';

import { faker } from '@dxos/random';
import { withLayout, withTheme } from '@dxos/storybook-utils';

import { Stack, type StackProps } from './Stack';
import { DemoStack } from './testing';
import { Mosaic } from '../../mosaic';
import { ComplexCard, SimpleCard } from '../../testing';

faker.seed(3);

export default {
  title: 'ui/react-ui-mosaic/Stack',
  component: Stack,
  render: (
    args: StackProps & {
      types: string[];
      count: number;
    },
  ) => {
    return (
      <Mosaic.Root debug={args.debug}>
        <Mosaic.DragOverlay />
        <DemoStack {...args} />
      </Mosaic.Root>
    );
  },
  decorators: [withTheme, withLayout({ fullscreen: true })],
  parameters: {
    layout: 'fullscreen',
  },
};

export const Default = {
  args: {
    Component: SimpleCard,
    count: 8,
    debug: true,
  },
};

export const Horizontal = {
  args: {
    Component: ComplexCard,
    direction: 'horizontal',
    count: 8,
    debug: true,
  },
};

export const Complex = {
  args: {
    Component: ComplexCard,
    types: ['document', 'image'],
    count: 8,
    debug: true,
  },
};
