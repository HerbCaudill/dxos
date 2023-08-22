//
// Copyright 2023 DXOS.org
//

import '@dxosTheme';
import React from 'react';

import { AlertDialog, Button } from '@dxos/aurora';

import { useViewportContext, Viewport, ViewportScopedProps } from './Viewport';

type StorybookViewportProps = {};

const Views = ({ __viewportScope }: ViewportScopedProps<{}>) => {
  const { setActiveView } = useViewportContext('StorybookViews', __viewportScope);
  return (
    <Viewport.Views>
      <Viewport.View id='one' classNames='p-4'>
        <p>One</p>
        <p className='invisible'>Two</p>
        <p className='invisible'>Three</p>
        <Button onClick={() => setActiveView('two')}>Next</Button>
      </Viewport.View>
      <Viewport.View id='two' classNames='p-4'>
        <p className='invisible'>One</p>
        <p>Two</p>
        <p className='invisible'>Three</p>
        <Button onClick={() => setActiveView('three')}>Next</Button>
      </Viewport.View>
      <Viewport.View id='three' classNames='p-4'>
        <p className='invisible'>One</p>
        <p className='invisible'>Two</p>
        <p>Three</p>
        <Button onClick={() => setActiveView('one')}>Next</Button>
      </Viewport.View>
    </Viewport.Views>
  );
};

const StorybookViewport = (props: StorybookViewportProps) => {
  return (
    <AlertDialog.Root defaultOpen>
      <AlertDialog.Overlay>
        <AlertDialog.Content classNames='p-0'>
          <Viewport.Root defaultActiveView='one'>
            <Views />
          </Viewport.Root>
        </AlertDialog.Content>
      </AlertDialog.Overlay>
    </AlertDialog.Root>
  );
};

export default {
  component: StorybookViewport,
};

export const Default = {
  args: {},
};