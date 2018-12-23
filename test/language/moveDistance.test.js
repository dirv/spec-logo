import { moveDistance } from '../../src/language/moveDistance';

const value = v => ({ get: () => v });

describe('moveDistance', () => {
  let result;

  function doMove(state, distance) {
    result = moveDistance(state, value(distance));
  }

  describe('when angle is 0', () => {
    it('increases turtle x', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 0 } }, 100);
      expect(result.turtle.x).toEqual(100);
    });

    it('adds a new draw command when moving forward', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 0 } }, 100);
      expect(result.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 100, y2: 0 }
      ]);
    });

    it('maintains existing draw commands', () => {
      doMove({ drawCommands: [1, 2, 3], turtle: { x: 0, y: 0, angle: 0 } }, 100);
      expect(result.drawCommands.slice(0, 3)).toEqual([1, 2, 3]);
    });

    it('maintains existing turtle properties', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 0 } }, 100);
      expect(result.turtle.angle).toEqual(0);
    });

    it('descreases x when moving with a negative direction', () => {
      doMove({ a: 123, drawCommands: [], turtle: { x: 0, y: 0, angle: 0 } }, -100);
      expect(result.turtle.x).toEqual(-100);
    });
  });

  describe('when angle is 90', () => {
    it('increases turtle y', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 90 } }, 100);
      expect(result.turtle.y).toEqual(100);
    });
  });

  const radians = angle => Math.PI * angle / 180;
  describe('when angle is 30', () => {
    it('uses cos to calculate x', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 30 } }, 100);
      expect(result.turtle.x).toEqual(Math.cos(radians(30)) * 100);
    });

    it('uses sin to calculate y', () => {
      doMove({ drawCommands: [], turtle: { x: 0, y: 0, angle: 30 } }, 100);
      expect(result.turtle.y).toEqual(Math.sin(radians(30)) * 100);
    });
  });
});
