import { load, save } from '../../src/middleware/localStorage';

describe('localStorage', () => {
  const data = { a: 123 };
  let getItemSpy = jest.fn();
  let setItemSpy = jest.fn();

  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: getItemSpy,
        setItem: setItemSpy
      }});
    getItemSpy.mockReturnValue(JSON.stringify(data));
  });

  describe('load', () => {
    it('retrieves state from localStorage', () => {
      load();
      expect(getItemSpy).toHaveBeenCalledWith('state');
    });

    it('returns parsed JSON data from localStorage', () => {
      expect(load()).toEqual(data);
    });

    it('returns undefined if there is no state saved', () => {
      getItemSpy.mockReturnValue(null);
      expect(load()).not.toBeDefined();
    });
  });

  describe('save middleware', () => {
    const expectedValue = { a: 123 };
      const action = { type: 'ANYTHING' };
    let currentValue;
    let next;
    const store = {
      getState: () => currentValue
    };

    beforeEach(() => {
      next = jest.fn(_ => currentValue = expectedValue);
    });

    it('calls next with the action', () => {
      save(store)(next)(action);
      expect(next).toHaveBeenCalledWith(action);
    });

    it('returns the result of next action', () => {
      next.mockReturnValue({ a : 123 });
      expect(save(store)(next)(action)).toEqual({ a: 123 });
    });

    it('saves the current state of the store in localStorage', () => {
      save(store)(next)(action);
      expect(setItemSpy).toHaveBeenCalledWith('state', JSON.stringify(expectedValue));
    });
  });
});
