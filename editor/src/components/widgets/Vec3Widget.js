import NumberWidget from './NumberWidget';
import PropTypes from 'prop-types';
import React from 'react';
import { areVectorsEqual } from '../../lib/utils.js';
export default class Vec3Widget extends React.Component {
  static propTypes = {
    componentname: PropTypes.string,
    entity: PropTypes.object,
    onChange: PropTypes.func,
    value: PropTypes.object.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      x: props.value.x,
      y: props.value.y,
      z: props.value.z
    };
  }

  onChange = (name, value) => {
    this.setState({ [name]: parseFloat(value.toFixed(5)) }, () => {
      if (this.props.onChange) {
        this.props.onChange(name, this.state);
      }
    });
  };

  componentDidUpdate() {
    const props = this.props;
    if (!areVectorsEqual(props.value, this.state)) {
      this.setState({
        x: props.value.x,
        y: props.value.y,
        z: props.value.z
      });
    }
  }

  render() {
    const widgetProps = {
      componentname: this.props.componentname,
      entity: this.props.entity,
      onChange: this.onChange
    };

    return (
      <div className="vec3">
        <NumberWidget name="x" value={this.state.x} {...widgetProps} />
        <NumberWidget name="y" value={this.state.y} {...widgetProps} />
        <NumberWidget name="z" value={this.state.z} {...widgetProps} />
      </div>
    );
  }
}
