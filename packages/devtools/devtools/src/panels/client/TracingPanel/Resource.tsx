//
// Copyright 2023 DXOS.org
//

import React, { FC } from 'react';

import { sanitizeClassName } from '@dxos/tracing';
import { Resource } from '@dxos/protocols/proto/dxos/tracing';

export const ResourceName: FC<{ className?: string; resource: Resource }> = ({ className, resource }) => (
  <span className={className}>
    {sanitizeClassName(resource.className)}
    <span className='text-gray-400'>#{resource.instanceId}</span>
  </span>
);