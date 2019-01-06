import { withUndoRedo } from '../../src/reducers/withUndoRedo';

describe('withUndoRedo', () => {
  let reducerSpy;
  let withUndoRedoFn;

  beforeEach(() => {
    reducerSpy = jest.fn();
    withUndoRedoFn = withUndoRedo(reducerSpy);
  });

  it('initially sets an empty array of past values', () => {
    expect(withUndoRedoFn(undefined)).toHaveProperty('past', []);
  });

  it('initially sets an empty array of future values', () => {
    expect(withUndoRedoFn(undefined)).toHaveProperty('future', []);
  });

  it('initially sets a present value of whatever the reducer returns', () => {
    reducerSpy.mockReturnValue({ a: 123 });
    expect(withUndoRedoFn(undefined)).toHaveProperty('present', { a: 123 });
  });

  describe('undo', () => {
    const undoAction = { type: 'UNDO' };

    it('sets the present to the latest past entry', () => {
      const entry = { a: 123 };
      const updated = withUndoRedoFn({ past: [ {}, entry ], future: [] }, undoAction);
      expect(updated.present).toBe(entry);
    });

    it('removes the latest entry from the past array', () => {
      const entry = { a: 123 };
      const updated = withUndoRedoFn({ past: [ entry, {} ], future: [] }, undoAction);
      expect(updated.past).toEqual([ entry ]);
    });

    it('adds the current present to the end of the future array', () => {
      const existing = { a: 123 };
      const entry = { b: 234 };
      const updated = withUndoRedoFn({ past: [ {} ], present: entry, future: [ existing ] }, undoAction);
      expect(updated.future).toEqual([ existing, entry ]);
    });
  });

  describe('redo', () => {
    const redoAction = { type: 'REDO' };

    it('sets the present to the latest future entry', () => {
      const entry = { a: 123 };
      const updated = withUndoRedoFn({ past: [ {} ], future: [ {}, entry] }, redoAction);
      expect(updated.present).toBe(entry);
    });

    it('removes the latest entry from the future array', () => {
      const entry = { a: 123 };
      const updated = withUndoRedoFn({ past: [ ], future: [ entry, {} ] }, redoAction);
      expect(updated.future).toEqual([ entry ]);
    });

    it('adds the current present to the end of the past array', () => {
      const existing = { a: 123 };
      const entry = { b: 234 };
      const updated = withUndoRedoFn({ past: [ existing ], present: entry, future: [ {} ] }, redoAction);
      expect(updated.past).toEqual([ existing, entry ]);
    });
  });

  describe('all other actions', () => {
    const otherAction = { type: 'OTHER' };
    const present = { a: 123, nextInstructionId: 0 };
    const newPresent = { b: 234, nextInstructionId: 1 };

    beforeEach(() => {
      reducerSpy.mockReturnValue(newPresent);
    });

    it('forwards action to the inner reducer', () => {
      withUndoRedoFn({ present, past: [] }, otherAction);
      expect(reducerSpy).toHaveBeenCalledWith(present, otherAction);
    });

    it('sets present to the result of the inner reducer', () => {
      const result = withUndoRedoFn({ present, past: [] }, otherAction);
      expect(result.present).toEqual(newPresent);
    });

    it('resets the future to nothing', () => {
      const result = withUndoRedoFn({ future: [{ a: 123 }], present, past: [] }, otherAction);
      expect(result.future).toEqual([]);
    });

    it('adds the current present to the end of the past array', () => {
      const existing = { a: 123 };
      const result = withUndoRedoFn({ past: [ existing ], present }, otherAction);
      expect(result.past).toEqual([ existing, present ]);
    });

    describe('nextInstructionId does not increment', () => {
      it('does not modify past', () => {
        const existing = { a: 123 };
        reducerSpy.mockReturnValue({ nextInstructionId: 0 });
        const result = withUndoRedoFn({ past: [ existing ], present }, otherAction);
        expect(result.past).toEqual([ existing ]);
      });
    });
  });
});
