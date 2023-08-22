//
// Copyright 2023 DXOS.org
//

import { File as FileIcon, FloppyDisk, Folder, Plugs, X } from '@phosphor-icons/react';
import { getIndices } from '@tldraw/indices';
import React from 'react';

import { Graph } from '@braneframe/plugin-graph';

import { FILES_PLUGIN, FILES_PLUGIN_SHORT_ID, LocalDirectory, LocalEntity, LocalFile, LocalFilesAction } from './types';

export const isLocalFile = (data: unknown): data is LocalFile =>
  data && typeof data === 'object' ? 'title' in data : false;

export const handleToLocalDirectory = async (
  handle: any /* FileSystemDirectoryHandle */,
  path = '',
): Promise<LocalDirectory> => {
  const permission = await handle.queryPermission({ mode: 'readwrite' });
  const childrenPath = path.length > 0 ? `${path}:${handle.name}` : handle.name;
  const children = permission === 'granted' ? await getDirectoryChildren(handle, childrenPath) : [];
  return {
    id: `${FILES_PLUGIN_SHORT_ID}:${path}${handle.name.replaceAll(/\./g, '-')}`,
    title: handle.name,
    handle,
    permission,
    children,
  };
};

export const handleToLocalFile = async (handle: any /* FileSystemFileHandle */, path = ''): Promise<LocalFile> => {
  const permission = await handle.queryPermission({ mode: 'readwrite' });
  const text = permission === 'granted' ? await handle.getFile().then((file: any) => file.text()) : undefined;
  path = path.length > 0 ? `${path}:` : path;
  return {
    id: `${FILES_PLUGIN_SHORT_ID}:${path}${handle.name.replaceAll(/\./g, '-')}`,
    title: handle.name,
    handle,
    permission,
    text,
  };
};

export const legacyFileToLocalFile = async (file: File) => {
  const text = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('loadend', (event) => {
      const text = event.target?.result;
      resolve(String(text));
    });
    reader.readAsText(file);
  });

  return {
    id: `${FILES_PLUGIN_SHORT_ID}:${file.name.replaceAll(/\.| /g, '-')}`,
    title: file.name,
    text,
  };
};

export const getDirectoryChildren = async (
  handle: any /* FileSystemDirectoryHandle */,
  path: string,
): Promise<LocalEntity[]> => {
  const children = [];
  for await (const entry of handle.values()) {
    if (entry.kind === 'file' && entry.name.endsWith('.md')) {
      children.push(await handleToLocalFile(entry, path));
    } else if (entry.kind === 'directory') {
      // TODO(wittjosiah): Handle subdirectories.
      // children.push(await handleToLocalDirectory(entry, path));
    }
  }
  return children;
};

export const findFile = (files: LocalEntity[], [id, ...path]: string[]): LocalFile | undefined => {
  const file = files.find((n) => n.id === id);
  if (file && !('children' in file)) {
    return file;
  } else if (!file || path.length === 0) {
    return undefined;
  }

  return findFile(file.children, path);
};

export const handleSave = async (file: LocalFile) => {
  const handle = file.handle as any;
  if (handle) {
    const writeable = await handle.createWritable();
    await writeable.write(file.text);
    await writeable.close();
  } else {
    handleLegacySave(file);
  }

  file.modified = false;
};

const handleLegacySave = (file: LocalFile) => {
  const contents = file.text || '';
  const blob = new Blob([contents], { type: 'text/markdown' });
  const a = document.createElement('a');
  a.setAttribute('href', window.URL.createObjectURL(blob));
  a.setAttribute('download', file.title);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

export const localEntityToGraphNode = (entity: LocalEntity, index: string, parent: Graph.Node) => {
  if ('children' in entity) {
    return localDirectoryToGraphNode(entity, index, parent);
  } else {
    return localFileToGraphNode(entity, index, parent);
  }
};

const localDirectoryToGraphNode = (directory: LocalDirectory, index: string, parent: Graph.Node<LocalDirectory>) => {
  const [node] = parent.add({
    id: directory.id,
    label: directory.title,
    icon: (props) => <Folder {...props} />,
    data: directory,
    properties: {
      index,
      disabled: directory.permission !== 'granted',
    },
  });

  if (directory.permission !== 'granted') {
    node.addAction({
      id: 're-open',
      label: ['re-open directory label', { ns: FILES_PLUGIN }],
      icon: (props) => <Plugs {...props} />,
      intent: {
        plugin: FILES_PLUGIN,
        action: LocalFilesAction.RECONNECT,
        data: { id: directory.id },
      },
      properties: {
        disposition: 'toolbar',
      },
    });
  }

  node.addAction({
    id: 'close-directory',
    label: ['close directory label', { ns: FILES_PLUGIN }],
    icon: (props) => <X {...props} />,
    intent: {
      plugin: FILES_PLUGIN,
      action: LocalFilesAction.CLOSE,
      data: { id: directory.id },
    },
  });

  const childIndices = getIndices(directory.children.length);
  directory.children.forEach((entity, index) => localEntityToGraphNode(entity, childIndices[index], node));

  return node;
};

const localFileToGraphNode = (file: LocalFile, index: string, parent: Graph.Node<LocalDirectory>) => {
  const [node] = parent.add({
    id: file.id,
    label: file.title,
    icon: (props) => <FileIcon {...props} />,
    data: file,
    properties: {
      index,
      disabled: file.permission !== 'granted',
      modified: file.modified,
    },
  });

  if (file.permission === 'granted') {
    node.addAction({
      id: 'save',
      label: [file.handle ? 'save label' : 'save as label', { ns: FILES_PLUGIN }],
      icon: (props) => <FloppyDisk {...props} />,
      intent: {
        plugin: FILES_PLUGIN,
        action: LocalFilesAction.SAVE,
        data: { id: file.id },
      },
    });
  } else {
    node.addAction({
      id: 're-open',
      label: ['re-open file label', { ns: FILES_PLUGIN }],
      icon: (props) => <Plugs {...props} />,
      intent: {
        plugin: FILES_PLUGIN,
        action: LocalFilesAction.RECONNECT,
        data: { id: file.id },
      },
      properties: {
        disposition: 'toolbar',
      },
    });
  }

  node.addAction({
    id: 'close-file',
    label: ['close file label', { ns: FILES_PLUGIN }],
    icon: (props) => <X {...props} />,
    intent: {
      plugin: FILES_PLUGIN,
      action: LocalFilesAction.CLOSE,
      data: { id: file.id },
    },
  });

  return node;
};