//
// Copyright 2023 DXOS.org
//
import React from 'react';

import { Graph } from '@braneframe/plugin-graph';
import { Breadcrumb, Button, useTranslation } from '@dxos/aurora';

import { TREE_VIEW_PLUGIN } from '../types';

export const TreeItemHeading = ({ data: node }: { data: Graph.Node }) => {
  const { t } = useTranslation(TREE_VIEW_PLUGIN);
  return (
    <Breadcrumb.Root aria-label={t('breadcrumb label')} classNames='shrink min-is-0'>
      <Breadcrumb.List>
        {node.parent && (
          <>
            <Breadcrumb.ListItem>
              <Breadcrumb.Link asChild>
                <Button variant='ghost' classNames='shrink text-sm pli-0 gap-1 overflow-hidden'>
                  {node.parent.icon && <node.parent.icon className='shrink-0' />}
                  <span className='min-is-0  flex-1 truncate'>
                    {Array.isArray(node.parent.label) ? t(...node.parent.label) : node.parent.label}
                  </span>
                </Button>
              </Breadcrumb.Link>
            </Breadcrumb.ListItem>
            <Breadcrumb.Separator />
          </>
        )}
        <Breadcrumb.ListItem>
          <Breadcrumb.Current classNames='shrink text-sm font-medium flex items-center gap-1 overflow-hidden'>
            {node.icon && <node.icon className='shrink-0' />}
            <span className='min-is-0 flex-1 truncate'>
              {Array.isArray(node.label) ? t(...node.label) : node.label}
            </span>
          </Breadcrumb.Current>
        </Breadcrumb.ListItem>
      </Breadcrumb.List>
    </Breadcrumb.Root>
  );
};