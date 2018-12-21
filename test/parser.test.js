import { parseLine } from '../src/parser';

const pen = { paint: true };
const turtle = { x: 0, y: 0, angle: 0 };

describe('parser', () => {
  it('moves forward', () => {
    const result = parseLine('forward 10', { turtle, pen } );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
    ]);
  });

  it('moves forward by a different amount', () => {
    const result = parseLine('forward 20', { turtle, pen } );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 20, y2: 0 }
    ]);
  });

  it('starts at a different position', () => {
    const result = parseLine('forward 20', { pen, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 10, y1: 10, x2: 30, y2: 10 }
    ]);
  });

  it('returns the new turtle position', () => {
    const result = parseLine('forward 20', { pen, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.turtle.x).toEqual(30);
    expect(result.turtle.y).toEqual(10);
  });

  it('maintains the same angle when moving forward', () => {
    const result = parseLine('forward 20', { pen, turtle: { x: 10, y: 10, angle: 30 } });
    expect(result.turtle.angle).toEqual(30);
  });

  it('does not issue a draw command if the command is a rotation', () => {
    const result = parseLine('right 90', { pen, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.drawCommands).toEqual([]);
  });

  it('rotates right', () => {
    const result = parseLine('right 90', { pen, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 90 });
  });

  it('rotates right by a different amount', () => {
    const result = parseLine('right 30', { pen, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 30 });
  });

  it('rotates right by adding on to existing rotation', () => {
    const result = parseLine('right 30', { pen, turtle: { x: 0, y: 0, angle: 90 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 120 });
  });

  it('moves backward', () => {
    const result = parseLine('backward 10', { turtle, pen } );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: -10, y2: 0 }
    ]);
  });

  it('rotates left', () => {
    const result = parseLine('left 90', { pen, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: -90 });
  });

  it('returns a basic error for an unknown command', () => {
    const result = parseLine('unknown 90', { turtle, pen });
    expect(result.error).toEqual({
      userText: 'unknown 90',
      description: 'Unknown function: unknown',
      position: { start: 0, end: 6 }
    });
  });

  it('returns a basic error for a different unknown command', () => {
    const result = parseLine('still-unknown 90', { turtle, pen });
    expect(result.error).toEqual({
      userText: 'still-unknown 90',
      description: 'Unknown function: still-unknown',
      position: { start: 0, end: 12 }
    });
  });
});
