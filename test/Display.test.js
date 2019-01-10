import React from 'react';
import ReactDOM from 'react-dom';
import { mount } from 'enzyme';
import { StoreContext } from 'redux-react-hook';
import { expectRedux, storeSpy } from 'expect-redux';
import { configureStore } from '../src/store';
import { StaticCommands, AnimatedCommands, Drawing, ReduxConnectedDisplay } from '../src/Display';

let lineA = { drawCommand: 'drawLine', id: 123, x1: 10, y1: 10, x2: 20, y2: 10 };
let lineB = { drawCommand: 'drawLine', id: 234, x1: 20, y1: 10, x2: 20, y2: 20 };
let lineC = { drawCommand: 'drawLine', id: 345, x1: 20, y1: 20, x2: 30, y2: 30 };
let rotate90 = { drawCommand: 'rotate', id: 456, angle: 90 };
let rotate180 = { drawCommand: 'rotate', id: 456, angle: 180 };

describe('Drawing', () => {
  let store;
  let wrapper;

  function svg() {
    return wrapper.find('svg');
  }

  function mountSvg(component) {
    return mount(<svg>{component}</svg>);
  }

  function drawLine() {
    store.dispatch({ type: 'SUBMIT_EDIT_LINE', text: 'forward 10\n' });
  }

  it('renders an svg inside div#viewport', () => {
    wrapper = mount(<Drawing drawCommands={[]} />);
    expect(wrapper.find('div#viewport > svg').exists()).toBeTruthy();
  });

  it('sets a viewbox of +/- 300 in either axis and preserves aspect ratio', () => {
    wrapper = mount(<Drawing drawCommands={[]} />);
    expect(svg().exists()).toBeTruthy();
    expect(svg().prop('viewBox')).toEqual('-300 -300 600 600');
    expect(svg().prop('preserveAspectRatio')).toEqual('xMidYMid slice');
  });

  it('draws a line for a draw command in state', () => {
    wrapper = mount(<Drawing drawCommands={ [ lineA ] }/>);
    expect(svg().find('svg line').exists()).toBeTruthy();
    expect(svg().find('svg line').prop('x1')).toEqual(10);
    expect(svg().find('svg line').prop('y1')).toEqual(10);
  });

  describe('StaticCommands', () => {
    it('renders lines with correct co-ordinate values', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [lineA ] } />);
      expect(svg().find('line').prop('x1')).toEqual(10);
      expect(svg().find('line').prop('y1')).toEqual(10);
      expect(svg().find('line').prop('x2')).toEqual(20);
      expect(svg().find('line').prop('y2')).toEqual(10);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('draws every drawLine command', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA, lineB, lineC ] }/>);
      expect(svg().find('line').length).toEqual(3);
    });

    it('does not draw any commands for non-drawLine commands', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ { drawCommand: 'unknown' } ] }/>);
      expect(svg().find('line').length).toEqual(0);
    });

    it('sets a stroke width of 2 on each line', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('strokeWidth')).toEqual('2');
    });

    it('sets a stroke color of black on each line', () => {
      wrapper = mountSvg(<StaticCommands drawCommands={ [ lineA ] }/>);
      expect(svg().find('line').prop('stroke')).toEqual('black');
    });
  });

  describe('animating', () => {
    const initialTurtle = { x: 0, y: 0, angle: 0 };

    function mountAnimatedCommands(props) {
      return mountSvg(<AnimatedCommands startTime={0} turtle={initialTurtle} {...props} />);
    }

    describe('line svg elements', () => {
      it('initially sets end of line to beginning of line, ready for animation', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(svg().find('line').prop('x2')).toEqual(10);
        expect(svg().find('line').prop('y2')).toEqual(10);
      });

      it('draws every drawLine command', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA, lineB, lineC ] });
        expect(svg().find('line').length).toEqual(3);
      });

      it('does not draw any commands for non-drawLine commands', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ { drawCommand: 'unknown' } ] });
        expect(svg().find('line').length).toEqual(0);
      });

      it('sets a stroke width of 2 on each line', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(svg().find('line').prop('strokeWidth')).toEqual('2');
      });

      it('sets a stroke color of black on each line', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(svg().find('line').prop('stroke')).toEqual('black');
      });
    });

    describe('x2 coordinate', () => {
      it('sets the begin time to 0 when component first mounts', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).prop('begin')).toEqual(0);
      });

      describe('duration', () => {
        it('has a duration of 0.05s for a horizontal line of length 10', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
          const firstLine = svg().find('svg line');
          expect(firstLine.childAt(0).prop('dur')).toEqual(0.05);
        });

        it('has a duration based on the distance for any line', () => {
          wrapper = mountAnimatedCommands({ drawCommands: [ lineC ] });
          const distance = Math.sqrt(10 * 10 * 2);
          const firstLine = svg().find('svg line');
          expect(firstLine.childAt(0).prop('dur')).toEqual(distance * 0.005);
        });
      });

      it('sets the fill to freeze', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(0).prop('fill')).toEqual('freeze');
      });
    });

    describe('y2 coordinate', () => {
      it('renders animate element', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line').at(0);
        expect(firstLine.childAt(1).type()).toEqual('animate');
        expect(firstLine.childAt(1).prop('attributeName')).toEqual('y2');
        expect(firstLine.childAt(1).prop('to')).toEqual(10);
      });

      it('sets the begin time to 0 when component first mounts', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('begin')).toEqual(0);
      });

      it('has a duration of 0.05s', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('dur')).toEqual(0.05);
      });

      it('sets the fill to freeze', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const firstLine = svg().find('svg line');
        expect(firstLine.childAt(1).prop('fill')).toEqual('freeze');
      });
    });

    describe('Turtle', () => {

      function turtle() {
        return svg().find('polygon');
      }

      it('renders a polygon of an isosceles triangle shape at the current turtle position', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [], turtle: { x: 10, y: 10, angle: 0 } });
        expect(turtle().exists()).toBeTruthy();
        expect(turtle().prop('points')).toEqual('5,15, 10,3, 15,15');
      });

      it('renders a polygon with a stroke and fill', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [], turtle: { x: 10, y: 10, angle: 0 } });
        expect(turtle().prop('fill')).toEqual('green');
        expect(turtle().prop('strokeWidth')).toEqual('2');
        expect(turtle().prop('stroke')).toEqual('black');
      });

      it('renders a polygon with an initial rotation to the initial turtle angle', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [], turtle: { x: 10, y: 20, angle: 90 } });
        expect(turtle().prop('transform')).toEqual('rotate(180, 10, 20)');
      });

      it('renders an animateTransform for a rotate command', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ rotate90 ] });
        expect(turtle().find('animateTransform').exists()).toBeTruthy();
        expect(turtle().find('animateTransform').prop('attributeName')).toEqual('transform');
        expect(turtle().find('animateTransform').prop('type')).toEqual('rotate');
        expect(turtle().find('animateTransform').prop('fill')).toEqual('freeze');
      });

      it('sets the duration to 1s for 180 degree turn', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ rotate180 ] });
        expect(turtle().find('animateTransform').prop('dur')).toEqual(1);
      });

      it('sets the duration to 0.5s for 90 degree turn', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ rotate90 ] });
        expect(turtle().find('animateTransform').prop('dur')).toEqual(0.5);
      });

      it('renders an animate element for points for a drawLine command', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(turtle().find('animate').exists()).toBeTruthy();
        expect(turtle().find('animate').prop('attributeName')).toEqual('points');
        expect(turtle().find('animate').prop('fill')).toEqual('freeze');
      });

      it('sets the movement to the x2, y2 coordinate of the line', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(turtle().find('animate').prop('to')).toEqual('15,15, 20,3, 25,15');
      });

      it('renders an animateTransform element for the rotation of a drawLine command', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        expect(turtle().find('animateTransform').exists()).toBeTruthy();
        expect(turtle().find('animateTransform').prop('attributeName')).toEqual('transform');
        expect(turtle().find('animateTransform').prop('type')).toEqual('rotate');
        expect(turtle().find('animateTransform').prop('fill')).toEqual('freeze');
      });

      it('sets the rotation to the angle and end position of the line', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineC ], turtle: { x: 20, y: 20, angle: 45 } });
        expect(turtle().find('animateTransform').prop('to')).toEqual('135, 30, 30');
      });

      it('sets the duration to the same duration that the drawLine transform occurs at', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA ] });
        const expectedDur = wrapper.find('line > animate').at(0).prop('dur');
        expect(turtle().find('animate').prop('dur')).toEqual(expectedDur);
        expect(turtle().find('animateTransform').prop('dur')).toEqual(expectedDur);
      });

      it('renders an animate element and an animateTransform element for each line drawn', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA, lineB, lineC ] });
        expect(turtle().find('animate').length).toEqual(3);
        expect(turtle().find('animateTransform').length).toEqual(3);
      });

      it('renders an animateTransform element for each rotation', () => {
        wrapper = mountAnimatedCommands({ drawCommands: [ lineA, lineB, lineC ] });
        expect(turtle().find('animateTransform').length).toEqual(3);
      });
    });

    it('begins the animation at the start time', () => {
      wrapper = mountAnimatedCommands({ drawCommands: [ lineA ], startTime: 5 });
      expect(wrapper.find('line').at(0).childAt(0).prop('begin')).toEqual(5);
    });

    it('sets animations to run consecutively', () => {
      wrapper = mountAnimatedCommands({ drawCommands: [ lineA, rotate90, lineB ], startTime: 5 });
      const beginDrawTimes = wrapper.find('line > animate[attributeName="x2"]').map(a => a.prop('begin'));
      const beginMoveTurtleTimes = wrapper.find('polygon > animate').map(a => a.prop('begin'));
      const beginRotateTurtleTimes = wrapper.find('polygon > animateTransform').map(a => a.prop('begin'));
      expect(beginDrawTimes).toEqual([5, 5.55]);
      expect(beginMoveTurtleTimes).toEqual([5, 5.55]);
      expect(beginRotateTurtleTimes).toEqual([5, 5.55, 5.05]);
    });
  });

  describe('second render', () => {
    let timeSpy;
    let root;

    beforeEach(async () => {
      timeSpy = jest.fn();
      timeSpy.mockReturnValue(5);
      SVGSVGElement.prototype.getCurrentTime = timeSpy;
      root = document.createElement('div');
      wrapper = mount(<Drawing drawCommands={ [  ] }/>);
      wrapper.setProps({ drawCommands: [ lineA, lineB ] });
      await new Promise(setTimeout);
      wrapper = wrapper.update();
    });

    it('uses getCurrentTime function to find current document animation time on second render', () => {
      expect(timeSpy).toHaveBeenCalled();
    });

    it('passes the time to AnimatedCommands as startTime', () => {
      expect(wrapper.find('AnimatedCommands').prop('startTime')).toEqual(5);
    });
  });
});

describe('ReduxConnectedDisplay', () => {
  let store;
  let wrapper;

  beforeEach(() => {
    store = configureStore([storeSpy], { script: { present: {
      drawCommands: [
        lineA, lineB
      ]
    }}});
  });

  function mountWithStore(component) {
    return mount(<StoreContext.Provider value={store}>{component}</StoreContext.Provider>);
  }

  it('renders a Drawing with drawCommands as props', () => {
    wrapper = mountWithStore(<ReduxConnectedDisplay />);
    expect(wrapper.find('Drawing').exists()).toBeTruthy();
    expect(wrapper.find('Drawing').prop('drawCommands')).toEqual([ lineA, lineB ]);
  });
});
