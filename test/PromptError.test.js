import React from 'react';
import { Provider } from 'react-redux';
import { mount } from 'enzyme';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { PromptError } from '../src/PromptError';

describe('PromptError', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy]);
  });

  function mountWithStore(component) {
    return mount(<Provider store={store}><table>{component}</table></Provider>);
  }

  it('renders a tbody', () => {
    wrapper = mountWithStore(<PromptError />);
    expect(wrapper.find('tbody').exists()).toBeTruthy();
  });

  it('renders a single td with a colspan of 2', () => {
    wrapper = mountWithStore(<PromptError />);
    expect(wrapper.find('td').length).toEqual(1);
    expect(wrapper.find('td').prop('colSpan')).toEqual('2');
  });

  it('has no error text in the table cell', () => {
    wrapper = mountWithStore(<PromptError />);
    expect(wrapper.find('td').text()).toEqual('');
  });

  describe('with error present', () => {
    beforeEach(() => {
      store = configureStore([storeSpy], {
        script: { error: { description: 'error message' } }
      });
    });

    it('displays the error from state in a table cell', () => {
      wrapper = mountWithStore(<PromptError />);
      expect(wrapper.find('td').text()).toEqual('error message');
    });
  });
});
