import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { ScriptName } from '../src/ScriptName';

describe('ScriptName', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy]);
  });

  function mountWithStore(component) {
    return mount(<Provider store={store}>{component}</Provider>);
  }

  function inputField() {
    return wrapper.find('input');
  }

  it('renders an input box with the script name from the store', () => {
    wrapper = mountWithStore(<ScriptName />);
    expect(inputField().prop('value')).toEqual('Unnamed script');
  });

  it('has a class name of isEditing when the input field has focus', () => {
    wrapper = mountWithStore(<ScriptName />);
    inputField().simulate('focus');
    wrapper = wrapper.update();
    expect(inputField().hasClass('isEditing')).toBeTruthy();
  });

  it('does not initially have a class name of isEditing', () => {
    wrapper = mountWithStore(<ScriptName />);
    expect(inputField().hasClass('isEditing')).toBeFalsy();
  });

  describe('when the user hits Enter', () => {
    beforeEach(() => {
      wrapper = mountWithStore(<ScriptName />);
      inputField().simulate('focus');
      inputField().simulate('change', { target: { value: 'new name' } });
      inputField().simulate('keypress', { key: 'Enter' });
      wrapper = wrapper.update();
    });

    it('submits the new name when the user hits Enter', () => {
      expectRedux(store)
        .toDispatchAnAction()
        .matching({ type: 'SUBMIT_SCRIPT_NAME', text: 'new name' });
    });

    it('removes the isEditing class name', () => {
      expect(inputField().hasClass('isEditing')).toBeFalsy();
    });

    it('dispatches a prompt focus request', () => {
      expectRedux(store)
      .toDispatchAnAction()
      .matching({ type: 'PROMPT_FOCUS_REQUEST' });
    });
  });

  describe('when the user moves focus somewhere else', () => {
    beforeEach(() => {
      wrapper = mountWithStore(<ScriptName />);
      inputField().simulate('focus');
      inputField().simulate('change', { target: { value: 'new name' } });
      inputField().simulate('blur');
      wrapper = wrapper.update();
    });

    it('submits the new name when the field loses focus', () => {
      expectRedux(store)
        .toDispatchAnAction()
        .matching({ type: 'SUBMIT_SCRIPT_NAME', text: 'new name' });
    });
  });
});
