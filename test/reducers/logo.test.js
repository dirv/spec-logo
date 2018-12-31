import { logoReducer as reducer, defaultState } from '../../src/reducers/logo';
import * as parser from '../../src/parser';

describe('logoReducer', () => {
  it('returns default state when existing state is undefined', () => {
    expect(reducer(undefined, {})).toEqual(defaultState);
  });

  it('updates the script name when receiving a SUBMIT_SCRIPT_NAME action', () => {
    const initialState = { name: 'a' };
    const action = { type: 'SUBMIT_SCRIPT_NAME', text: 'b' };
    const result = reducer(initialState, action);
    expect(result.name).toEqual('b');
  });

  describe('when receiving a SUBMIT_EDIT_LINE action', () => {
    const parserSpy = jest.fn();
    const action = { type: 'SUBMIT_EDIT_LINE', text: 'statement' };

    beforeEach(() => {
      parser.parseStatement = parserSpy;
    });

    it('appends a new line onto the statement', () => {
      const result = reducer(undefined, action);
      expect(parserSpy).toHaveBeenCalledWith('statement\n', expect.anything());
    });

    it('passes through state with error removed', () => {
      const result = reducer({ a: 123, b: 234, error: 'an error' }, action);
      expect(parserSpy).toHaveBeenCalledWith(expect.anything(), {
        a: 123, b: 234, error: undefined
      });
    });
  });
});
