import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react';
import { elkLayout, CanvasDirection } from './elkLayout';
import useDimensions from 'react-cool-dimensions';
import isEqual from 'react-fast-compare';
import { EdgeData, NodeData } from '../types';
import { useZoom } from '../utils/useZoom';

export interface ElkRoot {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  children?: any[];
  edges?: any[];
  direction?: CanvasDirection;
}

export interface LayoutProps {
  maxHeight: number;
  maxWidth: number;
  nodes: NodeData[];
  edges: EdgeData[];
  pannable: boolean;
  zoomable: boolean;
  center: boolean;
  direction: CanvasDirection;
  onLayoutChange: (layout: ElkRoot) => void;
}

export const useLayout = ({
  maxWidth,
  maxHeight,
  nodes = [],
  edges = [],
  pannable,
  center,
  direction,
  zoomable,
  onLayoutChange
}: LayoutProps) => {
  const scrolled = useRef<boolean>(false);
  const { ref, width, height } = useDimensions<HTMLDivElement>();
  const [layout, setLayout] = useState<ElkRoot | null>(null);
  const [xy, setXY] = useState<[number, number]>([0, 0]);
  const canvasHeight = pannable ? maxHeight : height;
  const canvasWidth = pannable ? maxWidth : width;
  const { svgRef, scale } = useZoom({ disabled: true }); // !zoomable });

  useEffect(() => {
    const promise = elkLayout(nodes, edges, { direction });

    promise
      .then((result) => {
        if (!isEqual(layout, result)) {
          setLayout(result);
          onLayoutChange(result);
        }
      })
      .catch((err) => {
        if (err.name !== 'CancelError') {
          console.error('Layout Error:', err);
        }
      });

    return () => promise.cancel();
  }, [nodes, edges]);

  const centerCanvas = useCallback(() => {
    const scrollX = (canvasWidth - height) / 2;
    const scrollY = (canvasHeight - width) / 2;

    const x = canvasWidth / 2 - layout.width / 2;
    const y = canvasHeight / 2 - layout.height / 2;

    if (center) {
      setXY([x, y]);
    }

    if (pannable) {
      ref?.current?.scrollTo(scrollY, scrollX);
    }
  }, [canvasWidth, canvasHeight, height, width, layout]);

  useLayoutEffect(() => {
    const scroller = ref.current;
    if (scroller && !scrolled.current && layout && height && width) {
      centerCanvas();
      scrolled.current = true;
    }
  }, [
    canvasWidth,
    pannable,
    canvasHeight,
    layout,
    height,
    width,
    center,
    centerCanvas
  ]);

  return {
    xy,
    svgRef,
    scale,
    containerRef: ref,
    canvasHeight,
    canvasWidth,
    containerWidth: width,
    containerHeight: height,
    layout,
    centerCanvas
  };
};
