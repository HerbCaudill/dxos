//
// Copyright 2024 DXOS.org
//

import React, { useCallback, useMemo } from 'react';

import { FormatEnum } from '@dxos/echo-schema';
import { invariant } from '@dxos/invariant';
import { type DxGrid } from '@dxos/lit-grid';
import {
  editorKeys,
  type EditorKeyEvent,
  GridCellEditor,
  type GridCellEditorProps,
  type EditorKeyOrBlurHandler,
  type EditorBlurHandler,
  type GridScopedProps,
  useGridContext,
} from '@dxos/react-ui-grid';
import { type FieldProjection } from '@dxos/schema';

import { completion } from './extension';
import { type TableModel } from '../../model';
import { type GridCell, toGridCell } from '../../util';

export type TableCellEditorProps = {
  model?: TableModel;
  onEnter?: (cell: GridCell) => void;
  onFocus?: DxGrid['refocus'];
  onQuery?: (field: FieldProjection, text: string) => Promise<{ label: string; data: any }[]>;
};

export const TableCellEditor = ({
  model,
  onEnter,
  onFocus,
  onQuery,
  __gridScope,
}: GridScopedProps<TableCellEditorProps>) => {
  const { editing } = useGridContext('TableCellEditor', __gridScope);
  const fieldProjection = useMemo<FieldProjection | undefined>(() => {
    if (!model || !editing) {
      return;
    }

    const { col } = toGridCell(editing.index);
    const field = model.projection.view.fields[col];
    const fieldProjection = model.projection.getFieldProjection(field.id);
    invariant(fieldProjection);
    return fieldProjection;
  }, [model, editing]);

  const handleClose = useCallback<EditorKeyOrBlurHandler>(
    (value, event) => {
      if (!model || !editing || !fieldProjection) {
        return;
      }

      const cell = toGridCell(editing.index);
      onEnter?.(cell);
      if (event && onFocus) {
        onFocus(determineNavigationAxis(event), determineNavigationDelta(event));
      }
    },
    [model, editing, onFocus, onEnter, fieldProjection, determineNavigationAxis, determineNavigationDelta],
  );

  const handleBlur = useCallback<EditorBlurHandler>(
    (value) => {
      if (!model || !editing) {
        return;
      }

      const cell = toGridCell(editing.index);
      if (value !== undefined) {
        model.setCellData(cell, value);
      }
    },
    [model, editing],
  );

  const extension = useMemo(() => {
    if (!fieldProjection) {
      return [];
    }

    const extension = [
      editorKeys({
        onClose: handleClose,
        ...(editing?.initialContent && { onNav: handleClose }),
      }),
    ];

    if (onQuery) {
      switch (fieldProjection.props.format) {
        case FormatEnum.Ref: {
          extension.push([
            completion({
              onQuery: (text) => onQuery(fieldProjection, text),
              onMatch: (data) => {
                if (model && editing) {
                  const cell = toGridCell(editing.index);
                  model.setCellData(cell, data);
                  onEnter?.(cell);
                  onFocus?.();
                }
              },
            }),
          ]);
          break;
        }
      }
    }

    return extension;
  }, [model, editing, fieldProjection, handleClose]);

  const getCellContent = useCallback<GridCellEditorProps['getCellContent']>(() => {
    if (model && editing) {
      const value = model.getCellData(toGridCell(editing.index));
      return value !== undefined ? String(value) : '';
    }
  }, [model, editing]);

  return <GridCellEditor extension={extension} getCellContent={getCellContent} onBlur={handleBlur} />;
};

const determineNavigationAxis = ({ key }: EditorKeyEvent): 'col' | 'row' | undefined => {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'Enter': {
      return 'row';
    }

    case 'ArrowLeft':
    case 'ArrowRight':
    case 'Tab':
      return 'col';
  }
};

const determineNavigationDelta = ({ key, shift }: EditorKeyEvent): -1 | 1 => {
  switch (key) {
    case 'ArrowUp':
    case 'ArrowLeft':
      return -1;

    case 'ArrowDown':
    case 'ArrowRight':
      return 1;
  }

  return shift ? -1 : 1;
};
