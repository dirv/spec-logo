import React from 'react';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { MenuButtons } from '../src/MenuButtons';

describe('MenuButtons', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy]);
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}>{component}</StoreContext.Provider>);
  }

  function button(text) {
    return wrapper.find('button').findWhere(b => b.text() === text);
  }

  describe('undo button', () => {
    it('renders', () => {
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Undo').exists()).toBeTruthy();
    });

    it('is disabled if there is no history', () => {
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Undo').prop('disabled')).toBeTruthy();
    });

    it('is enabled if an action occurs', () => {
      store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Undo').prop('disabled')).toBeFalsy();
    });

    it('dispatches an action of UNDO when clicked', () => {
      store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
      wrapper = mountWithStore(<MenuButtons />);
      button('Undo').simulate('click');
      expectRedux(store)
        .toDispatchAnAction()
        .matching({ type: 'UNDO' });
    });
  });

  describe('redo button', () => {
    it('renders', () => {
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Redo').exists()).toBeTruthy();
    });

    it('is disabled if undo has not occurred yet', () => {
      store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Redo').prop('disabled')).toBeTruthy();
    });

    it('is enabled if an undo occurred', () => {
      store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
      store.dispatch({ type: 'UNDO' });
      wrapper = mountWithStore(<MenuButtons />);
      expect(button('Redo').prop('disabled')).toBeFalsy();
    });

    it('dispatches an action of REDO when clicking the button', () => {
      store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
      wrapper = mountWithStore(<MenuButtons />);
      button('Undo').simulate('click');
      button('Redo').simulate('click');
      expectRedux(store)
        .toDispatchAnAction()
        .matching({ type: 'REDO' });
    });
  });
});
