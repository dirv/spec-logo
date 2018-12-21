import { parseLine } from '../src/parser';

const pen = { paint: true, down: true };
const turtle = { x: 0, y: 0, angle: 0 };
const initialState = { pen, turtle, drawCommands: [] };

describe('parser', () => {
  it('moves forward', () => {
    const result = parseLine('forward 10', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
    ]);
  });

  it('moves forward by a different amount', () => {
    const result = parseLine('forward 20', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 20, y2: 0 }
    ]);
  });

  it('starts at a different position', () => {
    const result = parseLine('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 10, y1: 10, x2: 30, y2: 10 }
    ]);
  });

  it('returns the new turtle position', () => {
    const result = parseLine('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.turtle.x).toEqual(30);
    expect(result.turtle.y).toEqual(10);
  });

  it('maintains the same angle when moving forward', () => {
    const result = parseLine('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 30 } });
    expect(result.turtle.angle).toEqual(30);
  });

  it('does not issue a draw command if the command is a rotation', () => {
    const result = parseLine('right 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.drawCommands).toEqual([]);
  });

  it('rotates right', () => {
    const result = parseLine('right 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 90 });
  });

  it('rotates right by a different amount', () => {
    const result = parseLine('right 30', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 30 });
  });

  it('rotates right by adding on to existing rotation', () => {
    const result = parseLine('right 30', { ...initialState, turtle: { x: 0, y: 0, angle: 90 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 120 });
  });

  it('moves backward', () => {
    const result = parseLine('backward 10', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: -10, y2: 0 }
    ]);
  });

  it('rotates left', () => {
    const result = parseLine('left 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: -90 });
  });

  it('includes the last entered line in the command', () => {
    const result = parseLine('unknown 90', initialState);
    expect(result.lastLine).toEqual('unknown 90');
  });

  describe('errors', () => {
    it('returns a basic error for an unknown command', () => {
      const result = parseLine('unknown 90', initialState);
      expect(result.error).toEqual({
        description: 'Unknown function: unknown',
        position: {
          end: 6,
          start: 0
        }
      });
    });

    it('returns a basic error for a different unknown command', () => {
      const result = parseLine('still-unknown 90', initialState);
      expect(result.error).toEqual({
        description: 'Unknown function: still-unknown',
        position: {
          end: 12,
          start: 0
        }
      });
    });

    it('records multiple events', () => {
      let state = parseLine('forward 10', initialState);
      state = parseLine('forward 10', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 20, y2: 0 }
      ]);
    });

    it('returns error if value is not an integer', () => {
      const result = parseLine('forward notnumber', initialState);
      expect(result.error).toEqual({
        description: 'Argument is not an integer'
      });
    });
  });

  it('maintains draw commands when rotating', () => {
    let state = parseLine('forward 10', initialState);
    state = parseLine('right 10', state);
    expect(state.drawCommands.length).toEqual(1);
  });

  it('maintains draw commands on error', () => {
    let state = parseLine('forward 10', initialState);
    state = parseLine('unknown-command', state);
    expect(state.drawCommands.length).toEqual(1);
  });

  describe('multi-line support', () => {
    it('accepts commands over multiple lines', () => {
      let state = parseLine('forward', initialState);
      state = parseLine('10', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
      ]);
    });
  });

  describe('no-argument functions', () => {
    it('accepts the penup command', () => {
      const state = parseLine('penup', initialState);
      expect(state.pen.down).toEqual(false);
    });

    it('accepts the pendown command', () => {
      const state = parseLine('pendown', { ...initialState, pen: { ...pen, down: false } });
      expect(state.pen.down).toEqual(true);
    });

    it('accepts the wait command', () => {
      const state = parseLine('wait 5', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'wait', seconds: 5 }
      ]);
    });
  });

  describe('repeat', () => {
    it.skip('repeats an instruction many times', () => {
      let state = parseLine('repeat 3 [ forward 10 ]', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 20, y2: 0 },
        { drawCommand: 'drawLine', x1: 20, y1: 0, x2: 30, y2: 0 },
      ]);
    });
  });
});
