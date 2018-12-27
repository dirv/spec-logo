import { parseStatement } from '../src/parser';
import { builtInFunctions } from '../src/language/functionTable';

const pen = { paint: true, down: true };
const turtle = { x: 0, y: 0, angle: 0 };
const initialState = { pen, turtle,
  nextInstructionId: 0,
  drawCommands: [],
  allFunctions: builtInFunctions,
  collectedParameters: {},
  parsedInstructions: [],
  parsedTokens: []
};

describe('parseStatement', () => {
  it('moves forward', () => {
    const result = parseStatement('forward 10', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
    ]);
  });

  it('moves forward by a different amount', () => {
    const result = parseStatement('forward 20', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 20, y2: 0 }
    ]);
  });

  it('starts at a different position', () => {
    const result = parseStatement('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 10, y1: 10, x2: 30, y2: 10 }
    ]);
  });

  it('returns the new turtle position', () => {
    const result = parseStatement('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 0 } });
    expect(result.turtle.x).toEqual(30);
    expect(result.turtle.y).toEqual(10);
  });

  it('maintains the same angle when moving forward', () => {
    const result = parseStatement('forward 20', { ...initialState, turtle: { x: 10, y: 10, angle: 30 } });
    expect(result.turtle.angle).toEqual(30);
  });

  it('does not issue a draw command if the command is a rotation', () => {
    const result = parseStatement('right 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.drawCommands).toEqual([]);
  });

  it('rotates right', () => {
    const result = parseStatement('right 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 90 });
  });

  it('rotates right by a different amount', () => {
    const result = parseStatement('right 30', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 30 });
  });

  it('rotates right by adding on to existing rotation', () => {
    const result = parseStatement('right 30', { ...initialState, turtle: { x: 0, y: 0, angle: 90 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: 120 });
  });

  it('moves backward', () => {
    const result = parseStatement('backward 10', initialState );
    expect(result.drawCommands).toEqual([
      { drawCommand: 'drawLine', x1: 0, y1: 0, x2: -10, y2: 0 }
    ]);
  });

  it('rotates left', () => {
    const result = parseStatement('left 90', { ...initialState, turtle: { x: 0, y: 0, angle: 0 } });
    expect(result.turtle).toEqual({ x: 0, y: 0, angle: -90 });
  });

  describe('errors', () => {
    it('includes the last entered line in the command', () => {
      const result = parseStatement('unknown 90', initialState);
      expect(result.error.line).toEqual('unknown 90');
    });

    it('returns a basic error for an unknown command', () => {
      const result = parseStatement('unknown 90', initialState);
      expect(result.error.description).toEqual('Unknown function: unknown');
      expect(result.error.position).toEqual({ end: 6, start: 0 });
    });

    it('returns a basic error for a different unknown command', () => {
      const result = parseStatement('still-unknown 90', initialState);
      expect(result.error.description).toEqual('Unknown function: still-unknown');
      expect(result.error.position).toEqual({ end: 12, start: 0 });
    });

    it('records multiple events', () => {
      let state = parseStatement('forward 10', initialState);
      state = parseStatement('forward 10', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 20, y2: 0 }
      ]);
    });

    it('returns error if value is not an integer', () => {
      const result = parseStatement('forward notnumber', initialState);
      expect(result.error.description).toEqual('Argument is not an integer');
    });
  });

  it('maintains draw commands when rotating', () => {
    let state = parseStatement('forward 10', initialState);
    state = parseStatement('right 10', state);
    expect(state.drawCommands.length).toEqual(1);
  });

  it('maintains draw commands on error', () => {
    let state = parseStatement('forward 10', initialState);
    state = parseStatement('unknown-command', state);
    expect(state.drawCommands.length).toEqual(1);
  });

  describe('parsing', () => {
    it('accepts commands over multiple lines', () => {
      const state = parseStatement('forward\n10', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
      ]);
    });

    it('accepts multiple commands on the same line', () => {
      let state = parseStatement('forward 10 backward 10', initialState);
      expect(state.drawCommands.length).toEqual(2);
    });

    it('does not perform any commands if the statement was incomplete', () => {
      const state = parseStatement('forward', initialState);
      expect(state.drawCommands).toEqual([]);
    });

    it('returns the entire line of text if the statement was incomplete', () => {
      const state = parseStatement('forward 10 backward', initialState);
      expect(state.currentEditLine).toEqual('forward 10 backward');
    });

    it('returns a blank edit line of text if the statement was completed', () => {
      const state = parseStatement('forward 10 backward 10', initialState);
      expect(state.currentEditLine).toEqual('');
    });
  });

  describe('no-argument functions', () => {
    it('accepts the penup command', () => {
      const state = parseStatement('penup', initialState);
      expect(state.pen.down).toEqual(false);
    });

    it('accepts the pendown command', () => {
      const state = parseStatement('pendown', { ...initialState, pen: { ...pen, down: false } });
      expect(state.pen.down).toEqual(true);
    });

    it('accepts the wait command', () => {
      const state = parseStatement('wait 5', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'wait', seconds: 5 }
      ]);
    });
  });

  describe('repeat', () => {
    it('repeats an instruction many times', () => {
      let state = parseStatement('repeat 3 [ forward 10 ]', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 20, y2: 0 },
        { drawCommand: 'drawLine', x1: 20, y1: 0, x2: 30, y2: 0 },
      ]);
    });

    it('repeats multiple instructions', () => {
      let state = parseStatement('repeat 2 [ forward 10 backward 10 ]', initialState);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 0, y2: 0 },
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 0, y2: 0 }
      ]);
    });

    it('returns an error if the first argument is not a number', () => {
      let state = parseStatement('repeat c [ ]', initialState);
      expect(state.error.description).toEqual('Argument is not an integer');
    });

    it('returns an error if the last instruction is not complete', () => {
      let state = parseStatement('repeat 2 [ forward ]', initialState);
      expect(state.error.description).toEqual('The last command is not complete');
    });
  });

  describe('functions', () => {
    it('defines a function with no parameters that can be called', () => {
      let state = initialState;
      state = parseStatement('to drawsquare forward 10 end', state);
      state = parseStatement('drawsquare', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
      ]);
    });

    it('defines a function with multiple instructions', () => {
      let state = initialState;
      state = parseStatement('to drawsquare forward 10 backward 10 end', state);
      state = parseStatement('drawsquare', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 },
        { drawCommand: 'drawLine', x1: 10, y1: 0, x2: 0, y2: 0 }
      ]);
    });

    it('passes a single parameter to a function', () => {
      let state = initialState;
      state = parseStatement('to drawsquare :x forward :x end', state);
      state = parseStatement('drawsquare 10', state);
      expect(state.drawCommands).toEqual([
        { drawCommand: 'drawLine', x1: 0, y1: 0, x2: 10, y2: 0 }
      ]);
    });

    it('cannot override built-in functions', () => {
      const state = parseStatement('to to end', initialState);
      expect(state.error.description).toEqual('Cannot override the built-in function \'to\'');
    });

    it('can override user-defined functions', () => {
      let state = parseStatement('to abc end', initialState);
      state = parseStatement('to abc end', state);
      expect(state.error).not.toBeDefined();
    });
  });

  describe('case-insensitivity', () => {
    it('matches uppercase forward command', () => {
      let result = parseStatement('FORWARD 10', initialState);
      expect(result.drawCommands.length).toEqual(1);
    });

    it('matches uppercase function name', () => {
      let state = initialState;
      state = parseStatement('to drawsquare forward 10 end', state);
      state = parseStatement('DRAWSQUARE', state);
      expect(state.drawCommands.length).toEqual(1);
    });

    it('matches uppercase parameter name', () => {
      let state = initialState;
      state = parseStatement('to drawsquare :X forward :x end', state);
      state = parseStatement('drawsquare 10', state);
      expect(state.drawCommands.length).toEqual(1);
    });
  });

  describe('aliases', () => {
    it('matches fd alias', () => {
      let result = parseStatement('fd 10', initialState);
      expect(result.drawCommands.length).toEqual(1);
    });
  });

  describe('tokenizing', () => {
    let tokenSpy;

    beforeEach(() => {
      tokenSpy = jest.fn();
    });

    it('passes whitespace through to current instruction if there is one', () => {
      let result = parseStatement('; ', {
        allFunctions: [ { names: [';'], parseToken: tokenSpy, perform: () => {} } ],
        parsedTokens: []
      });

      expect(tokenSpy).toHaveBeenCalledWith(expect.anything(), { type: 'whitespace', text: ' ', lineNumber: 1 });
    });

    it('includes line numbers when parsing multiple lines', () => {
      let result = parseStatement('; \n ', {
        allFunctions: [ { names: [';'], parseToken: tokenSpy, perform: () => {} } ],
        parsedTokens: []
      });

      expect(tokenSpy).toHaveBeenCalledWith(expect.anything(), { type: 'whitespace', text: ' ', lineNumber: 1 });
      expect(tokenSpy).toHaveBeenCalledWith(expect.anything(), { type: 'whitespace', text: '\n', lineNumber: 1 });
      expect(tokenSpy).toHaveBeenCalledWith(expect.anything(), { type: 'whitespace', text: ' ', lineNumber: 2 });
    });

    it('batches up non-newline whitespace', () => {
      let result = parseStatement('; \t', {
        allFunctions: [ { names: [';'], parseToken: tokenSpy, perform: () => {} } ],
        parsedTokens: []
      });

      expect(tokenSpy).toHaveBeenCalledWith(expect.anything(), { type: 'whitespace', text: ' \t', lineNumber: 1 });
    });

    it('starts line numbers at existing script line number', () => {
      tokenSpy.mockReturnValue({ isComplete: true });
      let result = parseStatement('; ', {
        allFunctions: [ { names: [';'], parseToken: tokenSpy, perform: () => { } } ],
        parsedInstructions: [],
        parsedTokens: [{ lineNumber: 123 }]
      });

      expect(result.parsedTokens).toContainEqual({ type: 'token', text: ';', lineNumber: 124 });
    });
  });
});
