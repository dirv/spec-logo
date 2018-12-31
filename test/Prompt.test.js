import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { Prompt } from '../src/Prompt';

describe('Prompt', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy]);
    store.dispatch({ type: 'SUBMIT_EDIT_LINE',
      text: 'repeat 4\n[ forward 10'
    });
  });

  function mountWithStore(component) {
    return mount(<Provider store={store}><table>{component}</table></Provider>);
  }

  function inputField() {
    return wrapper.find('input');
  }

  it('renders a tbody', () => {
    wrapper = mountWithStore(<Prompt />);
    expect(wrapper.find('tbody').exists()).toBeTruthy();
  });

  it('renders a table cell with a prompt indicator as the first cell in each row', () => {
    wrapper = mountWithStore(<Prompt />);
    const td = wrapper.find('tr').at(0).childAt(0);
    expect(td.text()).toEqual('>');
    expect(td.hasClass('promptIndicator')).toBeTruthy();
  });

  it('renders a table cell with the line text for each already submitted row', () => {
    wrapper = mountWithStore(<Prompt />);
    let td = wrapper.find('tr').at(0).childAt(1);
    expect(td.text()).toEqual('repeat 4');
    td = wrapper.find('tr').at(1).childAt(1);
    expect(td.text()).toEqual('[ forward 10');
  });

  it('renders an input field for the last line of text', () => {
    wrapper = mountWithStore(<Prompt />);
    const lastTr = wrapper.find('tr').last();
    expect(lastTr.childAt(1).find('input').exists()).toBeTruthy();
  });

  it('renders the prompt indicator for the last line of text', () => {
    wrapper = mountWithStore(<Prompt />);
    const lastTr = wrapper.find('tr').last();
    expect(lastTr.childAt(0).text()).toEqual('>');
    expect(lastTr.childAt(0).hasClass('promptIndicator')).toBeTruthy();
  });

  it('dispatches an action with the updated edit line when the user hits enter on the text field', () => {
    wrapper = mountWithStore(<Prompt />);
    inputField().simulate('change', { target: { value: 'right 90 ]' } });
    inputField().simulate('keypress', { key: 'Enter' });
    expectRedux(store)
      .toDispatchAnAction()
      .matching({ type: 'SUBMIT_EDIT_LINE', text: 'repeat 4\n[ forward 10\nright 90 ]' });
  });

  describe('instruction id increments after submitting edit line', () => {
    beforeEach(() => {
      wrapper = mountWithStore(<Prompt />);
      inputField().simulate('change', { target: { value: 'right 90 ]' } });
      inputField().simulate('keypress', { key: 'Enter' });
      wrapper = wrapper.update();
    });

    it('blanks the edit field', () => {
      expect(inputField().prop('value')).toEqual('');
    });

    it('removes the trs other than the edit field', () => {
      expect(wrapper.find('tr').length).toEqual(1);
    });
  });

  it('does not blank the edit field if the instruction id has not changed', () => {
    wrapper = mountWithStore(<Prompt />);
    inputField().simulate('change', { target: { value: 'right 90' } });
    inputField().simulate('keypress', { key: 'Enter' });
    wrapper = wrapper.update();
    expect(inputField().prop('value')).toEqual('right 90');
  });

  describe('prompt focus', () => {
    it('calls focus on the underlying DOM element if promptFocusRequest is true', async () => {
      store.dispatch({ type: 'PROMPT_FOCUS_REQUEST' });
      wrapper = mountWithStore(<Prompt />);
      await new Promise(setTimeout);
      expect(document.activeElement.tagName).toEqual('INPUT');
      wrapper.unmount();
    });

    it('does not call focus on the underlying DOM element if promptFocusRequest is false', async () => {
      wrapper = mountWithStore(<Prompt />);
      expect(document.activeElement.tagName).toEqual('BODY');
    });

    it('dispatches an action notifying that the prompt has focused', async () => {
      store.dispatch({ type: 'PROMPT_FOCUS_REQUEST' });
      wrapper = mountWithStore(<Prompt />);
      await new Promise(setTimeout);
      expectRedux(store)
        .toDispatchAnAction()
        .matching({ type: 'PROMPT_HAS_FOCUSED' });
    });

    it('does not dispatch an action if promptFocusRequest was not set', async() => {
      store.dispatch({ type: 'PROMPT_FOCUS_REQUEST' });
      wrapper = mountWithStore(<Prompt />);
      await new Promise(setTimeout);
      expectRedux(store)
        .toNotDispatchAnAction()
        .matching({ type: 'PROMPT_HAS_FOCUSED' });
    });
  });
});
