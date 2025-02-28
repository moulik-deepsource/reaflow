import React, { useRef, useState } from 'react';
import { useHotkeys } from 'reakeys';
import { EdgeData, NodeData } from 'types';
import { removeNode } from './externalHelpers';

export interface SelectionProps {
  selections?: string[];
  nodes?: NodeData[];
  edges?: EdgeData[];
  onSelection?: (nodes: NodeData[], edges: EdgeData[], value: string[]) => void;
}

export interface SelectionResult {
  onClick?: (
    event: React.MouseEvent<SVGGElement, MouseEvent>,
    data: any
  ) => void;
  onCanvasClick?: (
    event?: React.MouseEvent<SVGGElement, MouseEvent>
  ) => void;
  onKeyDown?: (event: React.KeyboardEvent<SVGGElement>) => void;
  selections: string[];
  clearSelections: (value?: string[]) => void;
  addSelection: (value: string) => void;
  removeSelection: (value: string) => void;
  toggleSelection: (value: string) => void;
  setSelections: (value: string[]) => void;
}

export const useSelection = ({
  selections = [],
  nodes = [],
  edges = [],
  onSelection = () => undefined
}: SelectionProps): SelectionResult => {
  const [internalSelections, setInternalSelections] = useState<string[]>(selections);
  const [metaKeyDown, setMetaKeyDown] = useState<boolean>(false);

  // TODO: Fix this reference issue in reakeys
  const selectionRef = useRef<string[]>(internalSelections);
  selectionRef.current = internalSelections;

  const nodesRef = useRef<NodeData[]>(nodes);
  nodesRef.current = nodes;

  const edgeRef = useRef<EdgeData[]>(edges);
  edgeRef.current = edges;

  const addSelection = (item: string) => {
    const has = internalSelections.includes(item);
    if (!has) {
      const next = [...internalSelections, item];

      onSelection(
        nodes,
        edges,
        next
      );

      setInternalSelections(next);
    }
  };

  const removeSelection = (item: string) => {
    const has = internalSelections.includes(item);
    if (has) {
      const next = internalSelections.filter(i => i !== item);

      onSelection(
        nodes,
        edges,
        next
      );

      setInternalSelections(next);
    }
  };

  const toggleSelection = (item: string) => {
    const has = internalSelections.includes(item);
    if (has) {
      removeSelection(item);
    } else {
      addSelection(item);
    }
  };

  const clearSelections = (next = []) => {
    setInternalSelections(next);
  };

  const onClick = (event, data) => {
    event.preventDefault();
    event.stopPropagation();

    if (!metaKeyDown) {
      clearSelections([data.id]);
    } else {
      toggleSelection(data.id);
    }

    setMetaKeyDown(false);
  };

  const onKeyDown = (event) => {
    event.preventDefault();
    setMetaKeyDown(event.metaKey || event.ctrlKey);
  };

  const onCanvasClick = () => {
    clearSelections();
    setMetaKeyDown(false);
  };

  useHotkeys([
    {
      name: 'Select All',
      keys: 'mod+a',
      callback: event => {
        event.preventDefault();

        const next = nodesRef.current.map(n => n.id);
        onSelection(
          nodesRef.current,
          edgeRef.current,
          next
        );

        setInternalSelections(next);
      }
    },
    {
      name: 'Delete Selections',
      keys: 'backspace',
      callback: event => {
        event.preventDefault();

        const result = removeNode(
          nodesRef.current,
          edgeRef.current,
          selectionRef.current
        );

        onSelection(
          result.nodes,
          result.edges,
          []
        );

        setInternalSelections([]);
      }
    },
    {
      name: 'Deselect Selections',
      keys: 'escape',
      callback: event => {
        event.preventDefault();
        setInternalSelections([]);
      }
    }
  ]);

  return {
    onClick,
    onKeyDown,
    onCanvasClick,
    selections: internalSelections,
    clearSelections,
    addSelection,
    removeSelection,
    toggleSelection,
    setSelections: setInternalSelections
  };
};
