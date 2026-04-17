'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
  rectIntersection,
  Active,
  Over,
} from '@dnd-kit/core';
import { createPortal } from 'react-dom';

interface DndRootContextType {
  activeItem: Active | null;
  overContainer: Over | null;
}

const DndRootContext = createContext<DndRootContextType | null>(null);

export const useDndRoot = () => {
  const context = useContext(DndRootContext);
  if (!context) throw new Error('useDndRoot must be used within DndRootProvider');
  return context;
};

interface DndRootProviderProps {
  children: React.ReactNode;
  onDragEnd?: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
}

export const DndRootProvider: React.FC<DndRootProviderProps> = ({ 
  children, 
  onDragEnd: externalOnDragEnd,
  onDragOver: externalOnDragOver,
  onDragStart: externalOnDragStart
}) => {
  const [activeItem, setActiveItem] = useState<Active | null>(null);
  const [overContainer, setOverContainer] = useState<Over | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveItem(event.active);
    externalOnDragStart?.(event);
  }, [externalOnDragStart]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    setOverContainer(event.over);
    externalOnDragOver?.(event);
  }, [externalOnDragOver]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveItem(null);
    setOverContainer(null);
    externalOnDragEnd?.(event);
  }, [externalOnDragEnd]);

  return (
    <DndRootContext.Provider value={{ activeItem, overContainer }}>
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </DndRootContext.Provider>
  );
};
