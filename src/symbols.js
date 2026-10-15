'use strict';

import {
  Bean,
  Bike,
  Broccoli,
  Bus,
  Car,
  Carrot,
  Circle,
  Dice5,
  Divide,
  Equal,
  Gamepad2,
  Hexagon,
  Joystick,
  LeafyGreen,
  Plane,
  Plus,
  Puzzle,
  Salad,
  Square,
  Star,
  TrainFront,
  Triangle,
  Trophy,
  Minus,
  X as Multiply,
  createElement
} from 'lucide';

export const SYMBOL_SETS = {
  vegetables: {
    label: 'Vegetables',
    symbols: [
      { name: 'Carrot', icon: Carrot },
      { name: 'Leafy green', icon: LeafyGreen },
      { name: 'Salad', icon: Salad },
      { name: 'Bean', icon: Bean },
      { name: 'Broccoli', icon: Broccoli }
    ]
  },
  vehicles: {
    label: 'Vehicles',
    symbols: [
      { name: 'Car', icon: Car },
      { name: 'Bike', icon: Bike },
      { name: 'Bus', icon: Bus },
      { name: 'Train', icon: TrainFront },
      { name: 'Plane', icon: Plane }
    ]
  },
  shapes: {
    label: 'Shapes',
    symbols: [
      { name: 'Circle', icon: Circle },
      { name: 'Square', icon: Square },
      { name: 'Triangle', icon: Triangle },
      { name: 'Star', icon: Star },
      { name: 'Hexagon', icon: Hexagon }
    ]
  },
  gaming: {
    label: 'Gaming',
    symbols: [
      { name: 'Gamepad', icon: Gamepad2 },
      { name: 'Joystick', icon: Joystick },
      { name: 'Dice', icon: Dice5 },
      { name: 'Puzzle', icon: Puzzle },
      { name: 'Trophy', icon: Trophy }
    ]
  },
  math: {
    label: 'Math',
    symbols: [
      { name: 'Plus', icon: Plus },
      { name: 'Minus', icon: Minus },
      { name: 'Multiply', icon: Multiply },
      { name: 'Divide', icon: Divide },
      { name: 'Equals', icon: Equal }
    ]
  }
};

export function getSymbol(setKey, value) {
  return SYMBOL_SETS[setKey]?.symbols[value - 1] || null;
}

export function createSymbolElement(symbol, className) {
  const element = createElement(symbol.icon, {
    'aria-hidden': 'true',
    class: className,
    focusable: 'false'
  });
  return element;
}

export function getSymbolSvg(symbol, color) {
  const element = createElement(symbol.icon, {
    width: 96,
    height: 96,
    stroke: color
  });
  return new XMLSerializer().serializeToString(element);
}
